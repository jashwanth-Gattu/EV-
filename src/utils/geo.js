// src/utils/geo.js

export const HYDERABAD_CENTER = {
  name: 'Hyderabad (Center)',
  lat: 17.3850,
  lng: 78.4867
};

export const HYDERABAD_BOUNDS = {
  minLat: 17.15,
  maxLat: 17.65,
  minLon: 78.15,
  maxLon: 78.75
};

export const HYDERABAD_SHORTCUTS = [
  { id: 'hitec', name: 'HITEC City', lat: 17.4474, lng: 78.3762, subtitle: 'Cyberabad Tech Hub' },
  { id: 'gachibowli', name: 'Gachibowli', lat: 17.4401, lng: 78.3489, subtitle: 'Financial District' },
  { id: 'banjara', name: 'Banjara Hills', lat: 17.4156, lng: 78.4350, subtitle: 'Road No. 1 - 12' },
  { id: 'secunderabad', name: 'Secunderabad', lat: 17.4399, lng: 78.4983, subtitle: 'Twin City Hub' },
  { id: 'kukatpally', name: 'Kukatpally', lat: 17.4849, lng: 78.4138, subtitle: 'KPHB & NH 65' },
  { id: 'uppal', name: 'Uppal', lat: 17.4018, lng: 78.5602, subtitle: 'East Zone & Metro' }
];

/**
 * Checks whether coordinates lie inside the Hyderabad greater metropolitan area
 */
export function isWithinHyderabad(lat, lng) {
  if (lat == null || lng == null) return false;
  return (
    lat >= HYDERABAD_BOUNDS.minLat &&
    lat <= HYDERABAD_BOUNDS.maxLat &&
    lng >= HYDERABAD_BOUNDS.minLon &&
    lng <= HYDERABAD_BOUNDS.maxLon
  );
}

/**
 * Calculate distance between two lat/lng points in kilometers using Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

/**
 * Human-friendly distance formatting
 */
export function formatDistance(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) return '--';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Approximate walking time estimate
 */
export function estimateWalkTime(distanceMeters) {
  if (!distanceMeters) return '1 min';
  // Average human walking speed ~ 80 meters per minute (4.8 km/h)
  const minutes = Math.max(1, Math.round(distanceMeters / 80));
  return `${minutes} min walk`;
}

/**
 * Generate free map navigation links (No Google Maps or paid APIs)
 */
export function getFreeNavigationUrls(destLat, destLng, destName = 'Destination', startLat, startLng) {
  const encName = encodeURIComponent(destName);

  // 1. OpenStreetMap Directions (FOSSGIS OSRM routing)
  let osmDirectionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car`;
  if (startLat && startLng) {
    osmDirectionsUrl += `&route=${startLat}%2C${startLng}%3B${destLat}%2C${destLng}`;
  } else {
    osmDirectionsUrl = `https://www.openstreetmap.org/?mlat=${destLat}&mlon=${destLng}#map=18/${destLat}/${destLng}`;
  }

  // 2. OpenStreetMap Direct Marker Link
  const osmMarkerUrl = `https://www.openstreetmap.org/?mlat=${destLat}&mlon=${destLng}#map=18/${destLat}/${destLng}`;

  // 3. Free Geo: URI for mobile native intent (Leaflet/Organic Maps/OSMAnd/Default device map)
  const geoUri = `geo:${destLat},${destLng}?q=${destLat},${destLng}(${encName})`;

  return {
    osmDirectionsUrl,
    osmMarkerUrl,
    geoUri
  };
}
