import { useEffect, useState } from 'react';
import * as routeService from '../services/routeService';
import * as shelterService from '../services/shelterService';
import * as hospitalService from '../services/hospitalService';
import CrisisMap from '../components/CrisisMap';
import { ErrorState } from '../components/DataState';

const RISK_STYLE = {
  LOW: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-accent-100 text-accent-700 border-accent-200',
};

export default function SafeRoute() {
  const [start, setStart] = useState({ lat: '28.6139', lng: '77.2090' });
  const [destinations, setDestinations] = useState([]);
  const [end, setEnd] = useState(null);
  const [route, setRoute] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([shelterService.listShelters(), hospitalService.listHospitals()]).then(([s, h]) => {
      setDestinations([
        ...s.shelters.map((x) => ({ id: `shelter-${x.id}`, label: `🏠 ${x.name}`, lat: x.latitude, lng: x.longitude })),
        ...h.hospitals.map((x) => ({ id: `hospital-${x.id}`, label: `🏥 ${x.name}`, lat: x.latitude, lng: x.longitude })),
      ]);
    }).catch(() => {});
  }, []);

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setStart({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
    });
  }

  async function handleFindRoute(e) {
    e.preventDefault();
    if (!end) {
      setError('Choose a destination first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await routeService.computeSafeRoute(start.lat, start.lng, end.lat, end.lng);
      setRoute(data.route);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-text-primary">Find Safest Route</h1>
      <p className="mb-4 text-sm text-text-secondary">Routes are simulated using known blocked roads and active verified incidents (no live traffic provider connected).</p>

      <form onSubmit={handleFindRoute} className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-text-primary">Start</label>
          <div className="flex gap-2">
            <input value={start.lat} onChange={(e) => setStart((s) => ({ ...s, lat: e.target.value }))} className="input-field" placeholder="Lat" />
            <input value={start.lng} onChange={(e) => setStart((s) => ({ ...s, lng: e.target.value }))} className="input-field" placeholder="Lng" />
            <button type="button" onClick={useMyLocation} className="btn-outline whitespace-nowrap !px-3 text-sm">📍 Me</button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-text-primary">Destination</label>
          <select
            className="input-field"
            value={end?.id || ''}
            onChange={(e) => setEnd(destinations.find((d) => d.id === e.target.value) || null)}
          >
            <option value="">Select a shelter or hospital...</option>
            {destinations.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary sm:col-span-4">{loading ? 'Calculating...' : 'Find Safest Route'}</button>
      </form>

      {error && <ErrorState message={error} />}

      {route && (
        <div className="space-y-4">
          <div className="card flex flex-wrap items-center gap-4">
            <span className={`badge border ${RISK_STYLE[route.risk_level]}`}>Risk: {route.risk_level}</span>
            <span className="text-sm text-text-secondary">{route.distance_km} km · ~{route.estimated_minutes} min</span>
            {route.is_simulated && <span className="text-xs text-text-tertiary">(simulated route)</span>}
          </div>

          {(route.avoided_roads.length > 0 || route.warnings.length > 0) && (
            <div className="card">
              <h3 className="font-semibold text-text-primary">Route notes</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {route.avoided_roads.map((r, i) => <li key={i} className="text-secondary-700">✓ Avoids {r.label} ({r.reason})</li>)}
                {route.warnings.map((w, i) => <li key={i} className="text-yellow-700">⚠ {w}</li>)}
                {route.nearest_hospital && <li className="text-text-secondary">🏥 Hospital available nearby: {route.nearest_hospital.name}</li>}
                {route.nearest_shelter && <li className="text-text-secondary">🏠 Shelter available nearby: {route.nearest_shelter.name}</li>}
              </ul>
            </div>
          )}

          <CrisisMap
            center={[Number(start.lat), Number(start.lng)]}
            routeWaypoints={route.waypoints}
            blockedRoads={[]}
            height="420px"
          />
        </div>
      )}
    </div>
  );
}
