import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useRealtime } from '../context/RealtimeContext';
import * as analyticsService from '../services/analyticsService';
import * as sosService from '../services/sosService';
import * as incidentService from '../services/incidentService';
import * as teamService from '../services/teamService';
import * as demoService from '../services/demoService';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';
import StatCard from '../components/StatCard';
import { SeverityBadge, VerificationBadge } from '../components/Badge';
import { BarChart } from '../components/MiniChart';
import { emergencyMeta } from '../utils/constants';
import { timeAgo, titleCase } from '../utils/format';

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const { subscribe } = useRealtime();
  const [metrics, setMetrics] = useState(null);
  const [series, setSeries] = useState([]);
  const [unverified, setUnverified] = useState([]);
  const [activeSos, setActiveSos] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [launching, setLaunching] = useState(false);

  const [dispatchSos, setDispatchSos] = useState(null);
  const [recommendedTeams, setRecommendedTeams] = useState(null);

  const load = useCallback(async () => {
    try {
      const [m, s, inc, sos, hot] = await Promise.all([
        analyticsService.getCommandCenterMetrics(),
        analyticsService.getIncidentsOverTime(14),
        incidentService.listIncidents('unverified'),
        sosService.listSos(),
        analyticsService.getHotspots(24, 2),
      ]);
      setMetrics(m.metrics);
      setSeries(s.series);
      setUnverified(inc.incidents);
      setActiveSos(sos.sos_requests.filter((x) => !['resolved', 'cancelled'].includes(x.status)));
      setHotspots(hot.hotspots);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribe('*', load), [subscribe, load]);

  async function handleFindTeams(sos) {
    setDispatchSos(sos);
    setRecommendedTeams(null);
    try {
      const data = await teamService.recommendTeams(sos.latitude, sos.longitude, sos.emergency_type);
      setRecommendedTeams(data.teams);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDispatch(teamId) {
    try {
      await teamService.assignTeam(teamId, { sos_id: dispatchSos.id, notes: 'Dispatched from coordinator command center' });
      toast.success('Team dispatched.');
      setDispatchSos(null);
      setRecommendedTeams(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleVerify(id, action) {
    try {
      await incidentService.reviewIncident(id, action);
      toast.success(action === 'verify' ? 'Incident authority-verified.' : 'Marked under review.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleLaunchDemo() {
    setLaunching(true);
    try {
      const res = await demoService.launchScenario();
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLaunching(false);
    }
  }

  if (loading) return <LoadingState label="Loading coordinator dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Coordinator Command Center</h1>
          <p className="text-text-secondary">Welcome, {user.name}. Verify reports, dispatch teams, and monitor operations.</p>
        </div>
        <button onClick={handleLaunchDemo} disabled={launching} className="btn-emergency text-sm">
          {launching ? 'Launching...' : '▶ Launch Disaster Scenario'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard label="Active Emergencies" value={metrics.active_emergencies} tone="accent" icon="⚠️" />
        <StatCard label="Active SOS" value={metrics.active_sos} tone="accent" icon="🆘" />
        <StatCard label="Unverified Reports" value={metrics.unverified_reports} tone="warning" icon="📋" />
        <StatCard label="Missing Persons" value={metrics.missing_persons_active} tone="warning" icon="🔍" />
        <StatCard label="Teams Deployed" value={`${metrics.teams_deployed}/${metrics.teams_total}`} tone="primary" icon="🧑‍🚒" />
        <StatCard label="People Affected (est.)" value={metrics.people_affected_estimate} tone="accent" icon="👥" />
      </div>

      {hotspots.length > 0 && (
        <section className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <h2 className="font-bold text-yellow-900">📈 Incident Hotspots (analytical detection, last 24h)</h2>
          <div className="mt-2 space-y-1 text-sm text-yellow-800">
            {hotspots.slice(0, 4).map((h, i) => (
              <p key={i}>{h.note}</p>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">Incidents (last 14 days)</h2>
        <div className="card">
          {series.length === 0 ? <EmptyState title="Not enough data yet" icon="📊" /> : <BarChart data={series} />}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">🚑 Rescue Dispatch</h2>
        {activeSos.length === 0 ? <EmptyState title="No active SOS requiring dispatch" icon="✅" /> : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              {activeSos.map((s) => {
                const eMeta = emergencyMeta(s.emergency_type);
                return (
                  <button
                    key={s.id}
                    onClick={() => handleFindTeams(s)}
                    className={`card block w-full text-left hover:shadow-essential ${dispatchSos?.id === s.id ? 'ring-2 ring-primary-500' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-semibold text-primary-700">{s.code}</p>
                      <SeverityBadge severity={s.severity} />
                    </div>
                    <p className="text-sm text-text-secondary">{eMeta.icon} {eMeta.label} · {s.citizen_name || 'Anonymous'} · {timeAgo(s.created_at)}</p>
                  </button>
                );
              })}
            </div>
            <div className="card">
              {!dispatchSos ? (
                <p className="text-sm text-text-tertiary">Select an SOS to see recommended rescue teams.</p>
              ) : !recommendedTeams ? (
                <LoadingState label="Finding suitable teams..." />
              ) : recommendedTeams.length === 0 ? (
                <EmptyState title="No teams currently available" />
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-text-primary">Recommended for {dispatchSos.code}</p>
                  {recommendedTeams.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-surface p-3 text-sm">
                      <div>
                        <p className="font-semibold text-text-primary">{t.team_code} — {t.name}</p>
                        <p className="text-text-secondary">
                          {titleCase(t.type)} · {t.distance_km.toFixed(1)} km · ETA ~{t.eta_minutes} min
                          {t.capability_match && <span className="text-secondary-700"> · Capability match</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDispatch(t.id)}
                        disabled={t.status !== 'available'}
                        className="btn-primary !px-3 !py-1.5 text-sm disabled:opacity-40"
                      >
                        {t.status === 'available' ? 'Dispatch' : 'Busy'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Verification Queue</h2>
          <Link to="/community" className="text-sm text-primary-600 hover:underline">Open full verification center</Link>
        </div>
        {unverified.length === 0 ? <EmptyState title="Nothing awaiting verification" icon="✅" /> : (
          <div className="space-y-2">
            {unverified.slice(0, 5).map((inc) => (
              <div key={inc.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{inc.title}</p>
                  <p className="text-sm text-text-secondary">{timeAgo(inc.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <VerificationBadge status={inc.status} />
                  <button onClick={() => handleVerify(inc.id, 'verify')} className="btn-secondary !px-3 !py-1.5 text-sm">Authority-verify</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
