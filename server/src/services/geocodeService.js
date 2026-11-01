// Reverse / forward geocoding via OpenStreetMap Nominatim (keyless public service).
// Falls back gracefully to a coordinate label when offline or rate-limited so the
// app never fabricates an address and never blocks complaint submission.

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'CivicConnect-AI/1.0 (demo civic platform)';
const TIMEOUT_MS = 4000;

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
}

const coordLabel = (lat, lng) =>
  `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;

// @returns { address, source } where source is 'nominatim' | 'coordinate'
export const reverseGeocode = async (lat, lng) => {
  const fallback = { address: coordLabel(lat, lng), source: 'coordinate' };
  try {
    const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return fallback;
    const data = await res.json();
    if (!data || !data.display_name) return fallback;
    return { address: data.display_name, source: 'nominatim' };
  } catch {
    return fallback;
  }
};

// @returns array of { label, lat, lng }
export const forwardGeocode = async (query) => {
  try {
    if (!query || !query.trim()) return [];
    const url = `${NOMINATIM_BASE}/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((d) => ({
      label: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }));
  } catch {
    return [];
  }
};
