// Client-side geocoding for address lookups (reverse geocode + place search).
//
// Strategy:
//   - When VITE_GOOGLE_MAPS_API_KEY is set, use the Google Geocoding API directly
//     from the browser (Google returns CORS headers, so browser calls are allowed).
//   - Otherwise (or on any Google failure), fall back to the backend's keyless
//     /api/geo endpoints, which proxy OpenStreetMap/Nominatim and degrade to a
//     coordinate label when offline.
//
// The visible map is always Leaflet/OpenStreetMap — this module only resolves
// human-readable addresses, so no map-tile key is required.
import API from './api';

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_GEOCODE = 'https://maps.googleapis.com/maps/api/geocode/json';

export const isGoogleGeocodingEnabled = () => Boolean(GOOGLE_KEY);

async function fetchJsonWithTimeout(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Returns { address, source } where source is 'google' | 'nominatim' | 'coordinate'.
export async function reverseGeocode(lat, lng) {
  if (GOOGLE_KEY) {
    try {
      const url = `${GOOGLE_GEOCODE}?latlng=${lat},${lng}&key=${GOOGLE_KEY}`;
      const data = await fetchJsonWithTimeout(url);
      if (data.status === 'OK' && Array.isArray(data.results) && data.results.length) {
        return { address: data.results[0].formatted_address, source: 'google' };
      }
    } catch {
      // fall through to the backend/Nominatim fallback
    }
  }
  const { data } = await API.get('/geo/reverse', { params: { lat, lng } });
  return { address: data.address, source: data.source };
}

// Returns [{ label, lat, lng }] for a free-text place query.
export async function forwardGeocode(query) {
  const q = (query || '').trim();
  if (!q) return [];
  if (GOOGLE_KEY) {
    try {
      const url = `${GOOGLE_GEOCODE}?address=${encodeURIComponent(q)}&key=${GOOGLE_KEY}`;
      const data = await fetchJsonWithTimeout(url);
      if (data.status === 'OK' && Array.isArray(data.results)) {
        return data.results.slice(0, 6).map((r) => ({
          label: r.formatted_address,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        }));
      }
    } catch {
      // fall through to the backend/Nominatim fallback
    }
  }
  const { data } = await API.get('/geo/search', { params: { query: q } });
  return data.results || [];
}
