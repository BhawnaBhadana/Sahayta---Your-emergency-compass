import { useEffect, useState } from 'react';
import CrisisMap from '../components/CrisisMap';
import * as incidentService from '../services/incidentService';
import * as sosService from '../services/sosService';
import * as shelterService from '../services/shelterService';
import * as hospitalService from '../services/hospitalService';
import * as resourceService from '../services/resourceService';
import * as responderService from '../services/responderService';
import * as routeService from '../services/routeService';
import { useAuth } from '../context/AuthContext';
import { LoadingState, ErrorState } from '../components/DataState';

const LAYERS = [
  { key: 'incidents', label: 'Emergencies', icon: '⚠️' },
  { key: 'sosRequests', label: 'Active SOS', icon: '🆘', authOnly: true },
  { key: 'shelters', label: 'Shelters', icon: '🏠' },
  { key: 'hospitals', label: 'Hospitals', icon: '🏥' },
  { key: 'blockedRoads', label: 'Blocked Roads', icon: '🚧' },
  { key: 'resources', label: 'Resources', icon: '📦', authOnly: true },
  { key: 'responders', label: 'Responders', icon: '🧑‍🚒', authOnly: true },
];

export default function CrisisMapPage() {
  const { user } = useAuth();
  const [data, setData] = useState({ incidents: [], sosRequests: [], shelters: [], hospitals: [], blockedRoads: [], resources: [], responders: [] });
  const [active, setActive] = useState(new Set(['incidents', 'shelters', 'hospitals', 'blockedRoads']));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [incidents, shelters, hospitals, roads] = await Promise.all([
          incidentService.listIncidents('verified'),
          shelterService.listShelters(),
          hospitalService.listHospitals(),
          routeService.listBlockedRoads(),
        ]);
        const next = {
          incidents: incidents.incidents,
          shelters: shelters.shelters,
          hospitals: hospitals.hospitals,
          blockedRoads: roads.blocked_roads,
          sosRequests: [],
          resources: [],
          responders: [],
        };
        if (user) {
          const [sos, resources, responders] = await Promise.all([
            sosService.listSos().catch(() => ({ sos_requests: [] })),
            resourceService.listResources().catch(() => ({ resources: [] })),
            responderService.listResponders().catch(() => ({ responders: [] })),
          ]);
          next.sosRequests = sos.sos_requests.filter((s) => !['resolved', 'cancelled'].includes(s.status));
          next.resources = resources.resources;
          next.responders = responders.responders;
        }
        setData(next);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  function toggleLayer(key) {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  if (loading) return <LoadingState label="Loading crisis map..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-text-primary">Live Crisis Map</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {LAYERS.filter((l) => !l.authOnly || user).map((l) => (
          <button
            key={l.key}
            onClick={() => toggleLayer(l.key)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${active.has(l.key) ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-surface-100 text-text-secondary'}`}
          >
            {l.icon} {l.label} ({data[l.key]?.length ?? 0})
          </button>
        ))}
      </div>

      <CrisisMap
        incidents={active.has('incidents') ? data.incidents : []}
        sosRequests={active.has('sosRequests') ? data.sosRequests : []}
        shelters={active.has('shelters') ? data.shelters : []}
        hospitals={active.has('hospitals') ? data.hospitals : []}
        resources={active.has('resources') ? data.resources : []}
        responders={active.has('responders') ? data.responders : []}
        blockedRoads={active.has('blockedRoads') ? data.blockedRoads : []}
        height="70vh"
      />

      <p className="mt-3 text-xs text-text-tertiary">
        Legend: ⚠️ Emergency · 🆘 SOS · 🏠 Shelter · 🏥 Hospital · 📦 Resource · 🧑‍🚒 Responder · 🚧 Blocked road
      </p>
    </div>
  );
}
