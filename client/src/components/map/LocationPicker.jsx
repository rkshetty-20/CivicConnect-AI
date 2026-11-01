import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Crosshair } from 'lucide-react';
import { reverseGeocode } from '../../services/geocodeService';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Recenter the map when an external source (GPS) changes the coordinates.
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15));
    }
  }, [lat, lng, map]);
  return null;
}

// Capture map clicks to drop the picker marker.
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bengaluru

function LocationPicker({ lat, lng, onPick, address, setAddress }) {
  const [resolving, setResolving] = useState(false);
  const [source, setSource] = useState(null);

  const pick = (nextLat, nextLng) => {
    onPick(nextLat, nextLng);
    // Resolve a readable address: Google Geocoding when a key is configured,
    // otherwise the backend Nominatim proxy (coordinate label if offline).
    resolveAddress(nextLat, nextLng);
  };

  const resolveAddress = async (nextLat, nextLng) => {
    if (!setAddress) return;
    setResolving(true);
    try {
      const { address: resolved, source: from } = await reverseGeocode(nextLat, nextLng);
      setAddress(resolved || '');
      setSource(from || null);
    } catch {
      setAddress('');
      setSource(null);
    } finally {
      setResolving(false);
    }
  };

  const hasLocation = lat != null && lng != null;

  return (
    <div className="space-y-2">
      <div className="relative h-56 rounded-xl overflow-hidden border border-slate-800">
        <MapContainer
          center={hasLocation ? [lat, lng] : DEFAULT_CENTER}
          zoom={hasLocation ? 15 : 11}
          style={{ height: '100%', width: '100%', background: '#e2e8f0', cursor: 'crosshair' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={pick} />
          {hasLocation && <Recenter lat={lat} lng={lng} />}
          {hasLocation && <Marker position={[lat, lng]} />}
        </MapContainer>

        {!hasLocation && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-slate-950/40 pointer-events-none">
            <span className="text-xs text-slate-200 bg-slate-900/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" /> Click the map to set the exact location
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {hasLocation ? `Pinned: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : 'No location pinned yet'}
        </span>
        {resolving && (
          <span className="text-slate-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Resolving address...
          </span>
        )}
      </div>

      {address && (
        <p className="text-xs text-teal-300 bg-teal-500/5 border border-teal-500/15 rounded-lg px-3 py-2 leading-relaxed">
          📍 {address}
          {source && (
            <span className="text-slate-500"> · via {source === 'google' ? 'Google' : source === 'nominatim' ? 'OpenStreetMap' : source}</span>
          )}
        </p>
      )}
    </div>
  );
}

export default LocationPicker;
