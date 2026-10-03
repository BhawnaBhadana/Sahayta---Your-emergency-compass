import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { severityMeta, emergencyMeta } from '../utils/constants';

// Vite bundles marker assets oddly with Leaflet's default icon paths; use inline SVG divIcons instead.
function dotIcon(color, size = 14) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function emojiIcon(emoji, bg) {
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:${bg};transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.35)"><span style="transform:rotate(45deg);font-size:15px">${emoji}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

const ICONS = {
  incident: (severity) => emojiIcon(emergencyMeta(severity?.type).icon || '⚠️', severityMeta(severity?.severity).value === 'critical' ? '#DC2626' : '#D97706'),
  sos: () => emojiIcon('🆘', '#DC2626'),
  shelter: () => emojiIcon('🏠', '#2B6CB0'),
  hospital: () => emojiIcon('🏥', '#059669'),
  responder: () => dotIcon('#2B6CB0', 14),
  resource: () => emojiIcon('📦', '#7C3AED'),
};

function FitBounds({ points }) {
  const map = useMap();
  useMemo(() => {
    if (points.length) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length]);
  return null;
}

export default function CrisisMap({
  center = [28.6139, 77.209],
  zoom = 11,
  incidents = [],
  sosRequests = [],
  shelters = [],
  hospitals = [],
  responders = [],
  resources = [],
  blockedRoads = [],
  routeWaypoints = [],
  height = '520px',
  fitToData = false,
}) {
  const fitPoints = fitToData
    ? [...incidents, ...sosRequests, ...shelters, ...hospitals].filter((p) => p.latitude || p.lat)
        .map((p) => ({ lat: p.latitude ?? p.lat, lng: p.longitude ?? p.lng }))
    : [];

  return (
    <div style={{ height }} className="overflow-hidden rounded-xl border border-surface">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitToData && fitPoints.length > 0 && <FitBounds points={fitPoints} />}

        {blockedRoads.map((r) => (
          <Polyline
            key={r.id}
            positions={[[r.lat_start, r.lng_start], [r.lat_end, r.lng_end]]}
            pathOptions={{ color: '#DC2626', weight: 5, dashArray: '6 6' }}
          >
            <Popup>
              <strong>🚧 {r.label}</strong>
              <p>{r.reason}</p>
            </Popup>
          </Polyline>
        ))}

        {routeWaypoints.length > 1 && (
          <Polyline positions={routeWaypoints.map((w) => [w.lat, w.lng])} pathOptions={{ color: '#2B6CB0', weight: 5 }} />
        )}

        {incidents.map((inc) => (
          <Marker key={`inc-${inc.id}`} position={[inc.latitude, inc.longitude]} icon={ICONS.incident({ type: inc.emergency_type, severity: inc.severity })}>
            <Popup>
              <strong>{inc.title}</strong>
              <p className="capitalize">{inc.emergency_type} · {inc.severity} · {inc.status}</p>
            </Popup>
          </Marker>
        ))}

        {sosRequests.map((s) => (
          <Marker key={`sos-${s.id}`} position={[s.latitude, s.longitude]} icon={ICONS.sos()}>
            <Popup>
              <strong>{s.code}</strong>
              <p className="capitalize">{s.emergency_type} · {s.severity}</p>
              <p className="capitalize">Status: {s.status?.replace('_', ' ')}</p>
            </Popup>
          </Marker>
        ))}

        {shelters.map((s) => (
          <Marker key={`shelter-${s.id}`} position={[s.latitude, s.longitude]} icon={ICONS.shelter()}>
            <Popup>
              <strong>{s.name}</strong>
              <p>Occupancy: {s.occupied}/{s.capacity}</p>
              <p className="capitalize">{s.status}</p>
            </Popup>
          </Marker>
        ))}

        {hospitals.map((h) => (
          <Marker key={`hosp-${h.id}`} position={[h.latitude, h.longitude]} icon={ICONS.hospital()}>
            <Popup>
              <strong>{h.name}</strong>
              <p>Beds available: {h.available_beds}/{h.total_beds}</p>
              <p>ICU: {h.icu_available}/{h.icu_beds}</p>
            </Popup>
          </Marker>
        ))}

        {resources.map((r) => (
          r.latitude && (
            <Marker key={`res-${r.id}`} position={[r.latitude, r.longitude]} icon={ICONS.resource()}>
              <Popup>
                <strong>{r.name}</strong>
                <p className="capitalize">{r.category} · {r.quantity} {r.unit}</p>
              </Popup>
            </Marker>
          )
        ))}

        {responders.map((r) => (
          r.latitude && (
            <CircleMarker key={`resp-${r.id}`} center={[r.latitude, r.longitude]} radius={7} pathOptions={{ color: '#2B6CB0', fillColor: '#2B6CB0', fillOpacity: 0.8 }}>
              <Popup>
                <strong>{r.name}</strong>
                <p>{r.is_available ? 'Available' : 'Busy'}</p>
              </Popup>
            </CircleMarker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
