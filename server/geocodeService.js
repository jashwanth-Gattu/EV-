// server/geocodeService.js
import { globalCache } from './cache.js';
import { HYDERABAD_BOUNDS } from './geoUtils.js';

/**
 * Geocode search via OpenStreetMap Nominatim, bounded strictly to Hyderabad.
 * Follows Nominatim usage policy: valid User-Agent, bounded queries, caching.
 */
export async function searchHyderabadLocations(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim().toLowerCase();
  const cacheKey = `geocode_${cleanQuery}`;

  const cached = globalCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Bounded to Greater Hyderabad region
  const { minLon, maxLat, maxLon, minLat } = HYDERABAD_BOUNDS;
  const viewbox = `${minLon},${maxLat},${maxLon},${minLat}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=1&countrycodes=in&addressdetails=1&limit=6`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ChargeNEat-Hyderabad/1.0 (contact@chargeneat.local)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      console.warn(`[Nominatim] Returned status ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const formatted = data.map(item => ({
      placeId: item.place_id,
      name: item.name || item.display_name.split(',')[0],
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      importance: item.importance
    }));

    // Cache geocode results for 1 hour
    globalCache.set(cacheKey, formatted, 60 * 60 * 1000);

    return formatted;
  } catch (err) {
    console.error('[Nominatim] Search failed:', err.message);
    return [];
  }
}
