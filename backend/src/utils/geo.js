/** Haversine distance in kilometers between two lat/lng points. */
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function sortByDistance(items, lat, lng, latKey = 'latitude', lngKey = 'longitude') {
  return items
    .map((item) => ({ ...item, distance_km: distanceKm(lat, lng, item[latKey], item[lngKey]) }))
    .sort((a, b) => a.distance_km - b.distance_km);
}
