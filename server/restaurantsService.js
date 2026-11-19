// server/restaurantsService.js
import { calculateHaversineKm } from './geoUtils.js';
import { globalCache } from './cache.js';

const OVERPASS_ENDPOINTS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

/**
 * Fetch restaurants, cafes, and fast-food outlets within given radius (default 500m)
 * of a charger coordinate using Overpass API only.
 */
export async function getNearbyRestaurants(lat, lng, radiusMeters = 500) {
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLng = Math.round(lng * 1000) / 1000;
  const cacheKey = `restaurants_${roundedLat}_${roundedLng}_${radiusMeters}`;

  const cached = globalCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const query = `[out:json][timeout:20];
(
  node["amenity"~"^(restaurant|cafe|fast_food)$"](around:${radiusMeters},${lat},${lng});
  way["amenity"~"^(restaurant|cafe|fast_food)$"](around:${radiusMeters},${lat},${lng});
);
out center 40;`;

  let elements = [];
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
        lastError = new Error(`Overpass returned status ${res.status}`);
        continue;
      }

      const data = await res.json();
      if (data && Array.isArray(data.elements)) {
        elements = data.elements;
        break;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (elements.length === 0 && lastError) {
    console.warn(`[Restaurants] Overpass queries warning:`, lastError.message);
  }

  // Parse and sort by distance
  const restaurants = elements
    .map(elem => parseRestaurant(elem, lat, lng))
    .filter(Boolean)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const result = {
    chargerCenter: { lat, lng, radiusMeters },
    restaurants,
    count: restaurants.length,
    timestamp: new Date().toISOString()
  };

  // Cache for 15 minutes
  globalCache.set(cacheKey, result, 15 * 60 * 1000);

  return { ...result, cached: false };
}

function parseRestaurant(elem, refLat, refLng) {
  const tags = elem.tags || {};
  const lat = elem.lat ?? elem.center?.lat;
  const lon = elem.lon ?? elem.center?.lon;

  if (lat == null || lon == null) return null;

  const amenity = tags.amenity || 'restaurant';
  const name = tags.name || tags.brand || (
    amenity === 'cafe' ? 'Local Cafe' :
    amenity === 'fast_food' ? 'Fast Food Counter' :
    'Local Eatery'
  );

  // Format cuisine
  let cuisine = tags.cuisine || tags.food;
  if (!cuisine) {
    if (amenity === 'cafe') cuisine = 'Coffee & Beverages';
    else if (amenity === 'fast_food') cuisine = 'Quick Bites';
    else cuisine = 'Multi-Cuisine / Indian';
  } else {
    // Replace semicolons with commas and format nicely
    cuisine = cuisine.split(';').map(c => c.trim()).map(c => {
      return c.charAt(0).toUpperCase() + c.slice(1);
    }).join(', ');
  }

  const distanceKm = calculateHaversineKm(refLat, refLng, lat, lon);
  const distanceMeters = Math.round(distanceKm * 1000);

  return {
    id: `osm_${elem.type}_${elem.id}`,
    name,
    amenity, // restaurant | cafe | fast_food
    cuisine,
    latitude: lat,
    longitude: lon,
    distanceMeters,
    distanceKm,
    brand: tags.brand || null,
    openingHours: tags.opening_hours || null,
    takeaway: tags.takeaway === 'yes',
    delivery: tags.delivery === 'yes',
    isVegetarian: tags['diet:vegetarian'] === 'yes' || tags['diet:vegetarian'] === 'only',
    isVegan: tags['diet:vegan'] === 'yes',
    address: [
      tags['addr:street'],
      tags['addr:suburb'] || tags['addr:district'],
      tags['addr:city']
    ].filter(Boolean).join(', ') || null,
    osmUrl: `https://www.openstreetmap.org/${elem.type}/${elem.id}`
  };
}
