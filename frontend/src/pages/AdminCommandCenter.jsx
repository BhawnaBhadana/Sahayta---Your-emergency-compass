import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as analyticsService from '../services/analyticsService';
import * as incidentService from '../services/incidentService';
import * as resourceService from '../services/resourceService';
import * as sosService from '../services/sosService';
import * as shelterService from '../services/shelterService';
import * as hospitalService from '../services/hospitalService';
import * as demoService from '../services/demoService';
import { useRealtime } from '../context/RealtimeContext';
import { useToast } from '../context/ToastContext';
import { LoadingState, ErrorState } from '../components/DataState';
import StatCard from '../components/StatCard';
import CrisisMap from '../components/CrisisMap';
import { SeverityBadge } from '../components/Badge';
import { BarChart, DistributionBar } from '../components/MiniChart';
import { titleCase, timeAgo } from '../utils/format';

const VERIFIED_STATUSES = ['verified', 'community_verified', 'authority_verified'];
const SEVERITY_COLORS = { low: '#10B981', medium: '#D97706', high: '#F97316', critical: '#DC2626' };

export default function AdminCommandCenter() {
  const { subscribe } = useRealtime();
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [rates, setRates] = useState(null);
  const [series, setSeries] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [criticalIncidents, setCriticalIncidents] = useState([]);
  const [shortages, setShortages] = useState([]);
  const [mapData, setMapData] = useState({ incidents: [], sosRequests: [], shelters: [], hospitals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [launching, setLaunching] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, a, incidents, resources, sos, shelters, hospitals, r, s, b, h] = await Promise.all([
        analyticsService.getCommandCenterMetrics(),
        analyticsService.getResponseTimes(),
        incidentService.listIncidents(),
        resourceService.listResources(),
        sosService.listSos(),
        shelterService.listShelters(),
        hospitalService.listHospitals(),
        analyticsService.getRates(),
        analyticsService.getIncidentsOverTime(14),
        analyticsService.getIncidentBreakdown(),
        analyticsService.getHotspots(24, 2),
      ]);
      setMetrics(m.metrics);
      setAnalytics(a.analytics);
      setRates(r.rates);
      setSeries(s.series);
      setBreakdown(b.breakdown);
      setHotspots(h.hotspots);
      setCriticalIncidents(incidents.incidents.filter((i) => ['high', 'critical'].includes(i.severity) && !['resolved', 'rejected'].includes(i.status)));
      setShortages(resources.resources.filter((r2) => ['critical', 'out_of_stock'].includes(r2.status)));
      setMapData({
        incidents: incidents.incidents.filter((i) => VERIFIED_STATUSES.includes(i.status)),
        sosRequests: sos.sos_requests.filter((s2) => !['resolved', 'cancelled'].includes(s2.status)),
        shelters: shelters.shelters,
        hospitals: hospitals.hospitals,
      });
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribe('*', load), [subscribe, load]);

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

  if (loading) return <LoadingState label="Loading command center..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const severitySegments = ['low', 'medium', 'high', 'critical'].map((sev) => ({
    label: titleCase(sev),
    value: breakdown.filter((b) => b.severity === sev).reduce((sum, b) => sum + b.count, 0),
    color: SEVERITY_COLORS[sev],
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Emergency Command Center</h1>
          <p className="text-text-secondary">Live operational overview across Sahayta.</p>
        </div>
        <button onClick={handleLaunchDemo} disabled={launching} className="btn-emergency text-sm">
          {launching ? 'Launching...' : '▶ Launch Disaster Scenario'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Active Emergencies" value={metrics.active_emergencies} tone="accent" icon="⚠️" />
        <StatCard label="Active SOS" value={metrics.active_sos} tone="accent" icon="🆘" />
        <StatCard label="Available Responders" value={metrics.available_responders} tone="primary" icon="🧑‍🚒" />
        <StatCard label="Active Shelters" value={metrics.active_shelters} tone="secondary" icon="🏠" />
        <StatCard label="Hospital Bed Capacity" value={`${metrics.hospital_capacity.percent_available}%`} sub={`${metrics.hospital_capacity.available_beds}/${metrics.hospital_capacity.total_beds} beds`} tone="primary" icon="🏥" />
        <StatCard label="Critical Resources" value={metrics.critical_resources} tone="warning" icon="📦" />
        <StatCard label="Unverified Reports" value={metrics.unverified_reports} tone="warning" icon="📋" />
        <StatCard label="Missing Persons" value={metrics.missing_persons_active} tone="warning" icon="🔍" />
        <StatCard label="Teams Deployed" value={`${metrics.teams_deployed}/${metrics.teams_total}`} tone="primary" icon="🚑" />
        <StatCard label="People Affected (est.)" value={metrics.people_affected_estimate} tone="accent" icon="👥" />
      </div>

      {hotspots.length > 0 && (
        <section className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <h2 className="font-bold text-yellow-900">📈 Incident Hotspots (analytical detection, last 24h)</h2>
          <div className="mt-2 space-y-1 text-sm text-yellow-800">
            {hotspots.slice(0, 4).map((h, i) => <p key={i}>{h.note}</p>)}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">Live Crisis Map</h2>
        <CrisisMap {...mapData} height="420px" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Critical Incidents</h2>
            <Link to="/community" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {criticalIncidents.length === 0 ? (
            <p className="card text-center text-sm text-text-secondary">No critical incidents right now.</p>
          ) : (
            <div className="space-y-2">
              {criticalIncidents.slice(0, 6).map((inc) => (
                <div key={inc.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{inc.title}</p>
                    <p className="text-xs text-text-tertiary">{timeAgo(inc.created_at)} · {inc.status.replace('_', ' ')}</p>
                  </div>
                  <SeverityBadge severity={inc.severity} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Resource Shortages</h2>
            <Link to="/resources" className="text-sm text-primary-600 hover:underline">Manage resources</Link>
          </div>
          {shortages.length === 0 ? (
            <p className="card text-center text-sm text-text-secondary">No critical shortages right now.</p>
          ) : (
            <div className="space-y-2">
              {shortages.map((r) => (
                <div key={r.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{r.name}</p>
                    <p className="text-xs text-text-tertiary">{titleCase(r.category)} · {r.quantity} {r.unit} left</p>
                  </div>
                  <span className="badge border border-accent-200 bg-accent-100 text-accent-700">{titleCase(r.status)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">Response Time Analytics</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Avg. Response Time" value={analytics.average_response_time || '—'} tone="primary" icon="⏱️" />
          <StatCard label="Avg. Resolution Time" value={analytics.average_resolution_time || '—'} tone="primary" icon="🏁" />
          <StatCard label="Verification Rate" value={`${rates.verification_rate}%`} tone="secondary" icon="✅" />
          <StatCard label="Resolution Rate" value={`${rates.resolution_rate}%`} tone="secondary" icon="🏁" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-bold text-text-primary">Incidents Over Time (14 days)</h2>
          <div className="card">
            {series.length === 0 ? <p className="text-center text-sm text-text-secondary">Not enough data yet.</p> : <BarChart data={series} />}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold text-text-primary">Severity Distribution</h2>
          <div className="card">
            <DistributionBar segments={severitySegments} />
          </div>
        </section>
      </div>
    </div>
  );
}
