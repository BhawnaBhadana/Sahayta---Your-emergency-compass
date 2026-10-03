import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as alertService from '../services/alertService';
import * as shelterService from '../services/shelterService';
import * as hospitalService from '../services/hospitalService';
import * as sosService from '../services/sosService';
import * as familyService from '../services/familyService';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';
import { SeverityBadge } from '../components/Badge';
import { timeAgo } from '../utils/format';

const QUICK_ACTIONS = [
  { to: '/sos', label: 'Send SOS', icon: '🚨', cls: 'bg-accent-600 hover:bg-accent-700 text-white' },
  { to: '/report', label: 'Report Incident', icon: '⚠️', cls: 'bg-white border-2 border-surface-100 hover:border-primary-600 text-text-primary' },
  { to: '/safe-route', label: 'Find Safe Route', icon: '🧭', cls: 'bg-white border-2 border-surface-100 hover:border-primary-600 text-text-primary' },
  { to: '/shelters', label: 'Find Shelter', icon: '🏠', cls: 'bg-white border-2 border-surface-100 hover:border-primary-600 text-text-primary' },
];

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: '' });
  const [alerts, setAlerts] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [mySos, setMySos] = useState([]);
  const [family, setFamily] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [a, s, h, sos, fam] = await Promise.all([
          alertService.listAlerts(),
          shelterService.listShelters(),
          hospitalService.listHospitals(),
          sosService.listSos(),
          familyService.getMyFamily().catch(() => null),
        ]);
        setAlerts(a.alerts);
        setShelters(s.shelters.slice(0, 3));
        setHospitals(h.hospitals.slice(0, 3));
        setMySos(sos.sos_requests);
        setFamily(fam);
        setState({ loading: false, error: '' });
      } catch (err) {
        setState({ loading: false, error: err.message });
      }
    }
    load();
  }, []);

  if (state.loading) return <LoadingState label="Loading your dashboard..." />;
  if (state.error) return <ErrorState message={state.error} />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="text-text-secondary">Here's what's happening around you.</p>
      </div>

      {alerts.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-text-primary">🚨 Active Alerts</h2>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="card flex items-start justify-between gap-3 border-l-4 border-l-accent-500">
                <div>
                  <p className="font-semibold text-text-primary">{a.title}</p>
                  <p className="text-sm text-text-secondary">{a.description}</p>
                  <p className="mt-1 text-xs text-text-tertiary">{a.area} · {timeAgo(a.issued_at)}</p>
                </div>
                <SeverityBadge severity={a.severity} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center font-semibold shadow-minimal transition-colors ${a.cls}`}>
              <span className="text-2xl" aria-hidden="true">{a.icon}</span>
              <span className="text-sm">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {mySos.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-text-primary">Your SOS Requests</h2>
          <div className="space-y-2">
            {mySos.slice(0, 3).map((s) => (
              <Link key={s.id} to={`/sos/${s.id}`} className="card flex items-center justify-between hover:shadow-essential">
                <div>
                  <p className="font-mono font-semibold text-primary-700">{s.code}</p>
                  <p className="text-sm capitalize text-text-secondary">{s.emergency_type} · {timeAgo(s.created_at)}</p>
                </div>
                <span className="badge bg-primary-100 text-primary-800 border border-primary-200 capitalize">{s.status.replace('_', ' ')}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Nearby Shelters</h2>
            <Link to="/shelters" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {shelters.length === 0 ? <EmptyState title="No shelters listed yet" /> : (
            <div className="space-y-2">
              {shelters.map((s) => (
                <div key={s.id} className="card">
                  <p className="font-semibold text-text-primary">{s.name}</p>
                  <p className="text-sm text-text-secondary">{s.available} of {s.capacity} spots available</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Nearby Hospitals</h2>
            <Link to="/hospitals" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {hospitals.length === 0 ? <EmptyState title="No hospitals listed yet" /> : (
            <div className="space-y-2">
              {hospitals.map((h) => (
                <div key={h.id} className="card">
                  <p className="font-semibold text-text-primary">{h.name}</p>
                  <p className="text-sm text-text-secondary">{h.available_beds} beds · {h.icu_available} ICU available</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Family Safety</h2>
          <Link to="/family" className="text-sm text-primary-600 hover:underline">Manage</Link>
        </div>
        {!family?.members?.length ? (
          <EmptyState title="No family members added" description="Add trusted family members to track their safety status." />
        ) : (
          <div className="card grid grid-cols-2 gap-3 sm:grid-cols-4">
            {family.members.map((m) => {
              const dot = { safe: '🟢', needs_help: '🔴', not_responded: '🟡' }[m.status];
              return (
                <div key={m.id} className="text-center">
                  <p className="text-2xl">{dot}</p>
                  <p className="text-sm font-medium text-text-primary">{m.display_name}</p>
                  <p className="text-xs uppercase text-text-tertiary">{m.status.replace('_', ' ')}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
