// server/chargersService.js
import { calculateHaversineKm } from './geoUtils.js';
import { globalCache } from './cache.js';

const OVERPASS_ENDPOINTS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

/**
 * Fetch EV chargers from Open Charge Map (if key configured) or Overpass API fallback
 */
export async function getChargers(lat, lng, distanceKm = 5) {
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLng = Math.round(lng * 100) / 100;
  const cacheKey = `chargers_${roundedLat}_${roundedLng}_${distanceKm}`;

  const cached = globalCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const ocmKey = process.env.OPEN_CHARGE_MAP_KEY?.trim();
  let chargers = [];
  let source = '';

  // 1. Try Open Charge Map if API key is present
  if (ocmKey) {
    try {
      console.log(`[OCM] Fetching chargers near (${lat}, ${lng}) with radius ${distanceKm}km`);
      chargers = await fetchFromOpenChargeMap(lat, lng, distanceKm, ocmKey);
      if (chargers.length > 0) {
        source = 'Open Charge Map';
      }
    } catch (err) {
      console.warn('[OCM] Error fetching from Open Charge Map, falling back to Overpass:', err.message);
    }
  }

  // 2. Fallback to Overpass API if no OCM key or OCM returned empty/failed
  if (!chargers || chargers.length === 0) {
    try {
      console.log(`[Overpass] Fetching chargers near (${lat}, ${lng}) with radius ${distanceKm}km`);
      chargers = await fetchFromOverpass(lat, lng, distanceKm);
      source = 'OpenStreetMap (Overpass)';
    } catch (err) {
      console.error('[Overpass] Failed to fetch chargers:', err.message);
      // Return empty list rather than 500 so UI can show a friendly empty state
      chargers = [];
      source = 'Unavailable';
    }
  }

  // Calculate accurate distances and sort by distance ascending
  const enrichedChargers = chargers.map(c => {
    const dist = calculateHaversineKm(lat, lng, c.latitude, c.longitude);
    return {
      ...c,
      distanceKm: dist
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  const result = {
    chargers: enrichedChargers,
    source,
    count: enrichedChargers.length,
    searchCenter: { lat, lng, distanceKm },
    timestamp: new Date().toISOString()
  };

  // Cache for 15 minutes
  globalCache.set(cacheKey, result, 15 * 60 * 1000);

  return { ...result, cached: false };
}

/**
 * Fetch from Open Charge Map API
 */
async function fetchFromOpenChargeMap(lat, lng, distanceKm, apiKey) {
  const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lng}&distance=${distanceKm}&distanceunit=KM&countrycode=IN&maxresults=100&key=${apiKey}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'ChargeNEat-Hyderabad/1.0 (contact@chargeneat.local)'
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!res.ok) {
    throw new Error(`Open Charge Map API returned status ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map(item => {
    const address = item.AddressInfo || {};
    const connections = (item.Connections || []).map(conn => {
      const type = conn.ConnectionType?.Title || 'Standard Connector';
      let power = conn.PowerKW;
      if (!power || power <= 0) {
        if (type.toLowerCase().includes('ccs') || type.toLowerCase().includes('fast')) power = 50;
        else if (type.toLowerCase().includes('type 2')) power = 22;
        else power = 11;
      }
      return {
        id: conn.ID,
        type,
        powerKW: Math.round(power * 10) / 10,
        quantity: conn.Quantity || 1,
        currentType: conn.CurrentType?.Title || 'AC/DC'
      };
    });

    const maxPower = connections.reduce((max, c) => Math.max(max, c.powerKW || 0), 0);

    return {
      id: `ocm_${item.ID}`,
      name: address.Title || 'EV Charging Station',
      operator: item.OperatorInfo?.Title || 'Independent / Unspecified',
      address: [address.AddressLine1, address.Town, address.Postcode].filter(Boolean).join(', ') || 'Hyderabad, Telangana',
      latitude: address.Latitude,
      longitude: address.Longitude,
      connections: connections.length > 0 ? connections : [{ type: 'Standard EV Plug', powerKW: 22, quantity: 1, currentType: 'AC' }],
      maxPowerKW: maxPower || 22,
      access: item.UsageType?.Title || 'Public',
      status: item.StatusType?.Title || 'Operational',
      rawSource: 'OpenChargeMap'
    };
  });
}

/**
 * Fetch from Overpass API (OpenStreetMap)
 */
async function fetchFromOverpass(lat, lng, distanceKm) {
  const radiusMeters = Math.min(Math.round(distanceKm * 1000), 30000);
  const query = `[out:json][timeout:20];
(
  node["amenity"="charging_station"](around:${radiusMeters},${lat},${lng});
  way["amenity"="charging_station"](around:${radiusMeters},${lat},${lng});
);
out center;`;

  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ChargeNEat-Hyderabad/1.0 (contact@chargeneat.local)'
        },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(12000)
      });

      if (!res.ok) {
        lastError = new Error(`Overpass endpoint ${endpoint} status ${res.status}`);
        continue;
      }

      const data = await res.json();
      if (!data || !Array.isArray(data.elements)) return [];

      return data.elements.map(elem => parseOverpassCharger(elem, lat, lng));
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Overpass mirrors timed out or failed');
}

/**
 * Parse Overpass element into standard charger format
 */
function parseOverpassCharger(elem, refLat, refLng) {
  const tags = elem.tags || {};
  const lat = elem.lat ?? elem.center?.lat;
  const lon = elem.lon ?? elem.center?.lon;

  // Extract operator / brand / name
  const name = tags.name || tags.brand || tags.operator || 'EV Charging Station';
  const operator = tags.operator || tags.brand || 'EV Network / Community';

  // Parse connectors and power
  const connections = [];
  let maxPower = 0;

  // Check specific socket tags in OSM
  const socketMapping = [
    { key: 'socket:type2_combo', name: 'CCS 2 (DC Fast)', defaultPower: 50 },
    { key: 'socket:ccs', name: 'CCS 2 (DC Fast)', defaultPower: 50 },
    { key: 'socket:chademo', name: 'CHAdeMO (DC Fast)', defaultPower: 50 },
    { key: 'socket:type2', name: 'Type 2 (AC)', defaultPower: 22 },
    { key: 'socket:type2_cable', name: 'Type 2 Attached (AC)', defaultPower: 22 },
    { key: 'socket:schuko', name: 'Standard 3-Pin / 16A', defaultPower: 3.3 },
    { key: 'socket:bhat', name: 'Bharat EV AC001', defaultPower: 3.3 }
  ];

  let foundSpecificSocket = false;
  for (const s of socketMapping) {
    if (tags[s.key] !== undefined && tags[s.key] !== 'no') {
      foundSpecificSocket = true;
      const count = parseInt(tags[s.key], 10) || 1;
      let power = s.defaultPower;

      // Check if output wattage tag exists
      const outputKey = `${s.key}:output`;
      if (tags[outputKey]) {
        const parsed = parseFloat(tags[outputKey]);
        if (!isNaN(parsed)) power = parsed;
      }

      connections.push({
        type: s.name,
        powerKW: power,
        quantity: count,
        currentType: power >= 30 ? 'DC Fast' : 'AC'
      });
      maxPower = Math.max(maxPower, power);
    }
  }

  // Check general power tags if socket tags were not specific
  if (!foundSpecificSocket) {
    let power = 22; // default reasonable estimate for public station
    if (tags['charging_station:output']) {
      const p = parseFloat(tags['charging_station:output']);
      if (!isNaN(p)) power = p;
    } else if (tags.capacity && parseInt(tags.capacity, 10) > 4) {
      power = 50;
    }

    connections.push({
      type: power >= 50 ? 'CCS 2 / Fast Charger' : 'Type 2 AC Fast',
      powerKW: power,
      quantity: parseInt(tags.capacity, 10) || 1,
      currentType: power >= 30 ? 'DC Fast' : 'AC'
    });
    maxPower = power;
  }

  const address = [
    tags['addr:street'],
    tags['addr:suburb'] || tags['addr:district'],
    tags['addr:city'] || 'Hyderabad',
    tags['addr:postcode']
  ].filter(Boolean).join(', ') || 'Hyderabad, Telangana';

  return {
    id: `osm_${elem.type}_${elem.id}`,
    name,
    operator,
    address,
    latitude: lat,
    longitude: lon,
    connections,
    maxPowerKW: maxPower || 22,
    access: tags.access === 'private' ? 'Private / Restricted' : 'Public',
    status: tags.operational_status || 'Operational',
    openingHours: tags.opening_hours || '24/7',
    rawSource: 'OpenStreetMap'
  };
}
