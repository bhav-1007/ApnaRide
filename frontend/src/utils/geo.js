// Great-circle distance in meters between two { lat, lng } points using Haversine formula
export function distanceMeters(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Convert GeoJSON point [lng, lat] to Leaflet/UI { lat, lng } format
export const fromGeoJson = (point) => (point ? { lat: point.coordinates[ 1 ], lng: point.coordinates[ 0 ] } : null);
export const placeFromRide = (place) => ({ address: place.address, ...fromGeoJson(place.location) });
