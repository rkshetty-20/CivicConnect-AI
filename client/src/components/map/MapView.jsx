import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../issues/StatusBadge';

// Fix Leaflet default marker icon issue with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom colored icons per status
const createIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width: 14px; height: 14px;
      background: ${color};
      border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,0.85);
      box-shadow: 0 0 6px ${color};
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });

const icons = {
  pending: createIcon('#f87171'),      // red
  acknowledged: createIcon('#60a5fa'), // blue
  assigned: createIcon('#818cf8'),     // indigo
  in_progress: createIcon('#fbbf24'),  // amber
  resolved: createIcon('#34d399'),     // emerald
  rejected: createIcon('#94a3b8'),     // slate
};

// Auto-fit map to markers
function FitBounds({ issues }) {
  const map = useMap();
  useEffect(() => {
    if (issues.length > 0) {
      const bounds = L.latLngBounds(
        issues.map((i) => [i.location.coordinates[1], i.location.coordinates[0]])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [issues, map]);
  return null;
}

function MapView({ issues = [], center = [20.5937, 78.9629], zoom = 5 }) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', background: '#e2e8f0' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {issues.length > 0 && <FitBounds issues={issues} />}

        {issues.map((issue) => (
          <Marker
            key={issue._id}
            position={[
              issue.location.coordinates[1],
              issue.location.coordinates[0],
            ]}
            icon={icons[issue.status] || icons.pending}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{issue.title}</p>
                <p className="text-xs text-slate-600 mb-2">{issue.category}</p>
                <Link
                  to={`/issues/${issue._id}`}
                  className="text-xs text-teal-600 font-semibold hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center space-x-4 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 backdrop-blur-sm text-xs">
        {[
          { color: '#f87171', label: 'Pending' },
          { color: '#fbbf24', label: 'In Progress' },
          { color: '#34d399', label: 'Resolved' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
            <span className="text-slate-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MapView;
