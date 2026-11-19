// server/geoUtils.js
/**
 * Calculate Haversine distance between two coordinates in kilometers.
 */
export function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 100) / 100;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Hyderabad bounding box
 * Lat: [17.15, 17.65], Lon: [78.15, 78.75]
 */
export const HYDERABAD_BOUNDS = {
  minLat: 17.15,
  maxLat: 17.65,
  minLon: 78.15,
  maxLon: 78.75,
  defaultCenter: {
    lat: 17.3850,
    lng: 78.4867,
    name: 'Hyderabad (City Center)'
  }
};

export function isWithinHyderabad(lat, lon) {
  return (
    lat >= HYDERABAD_BOUNDS.minLat &&
    lat <= HYDERABAD_BOUNDS.maxLat &&
    lon >= HYDERABAD_BOUNDS.minLon &&
    lon <= HYDERABAD_BOUNDS.maxLon
  );
}
