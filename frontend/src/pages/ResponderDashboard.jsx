import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { useToast } from '../context/ToastContext';
import * as sosService from '../services/sosService';
import * as incidentService from '../services/incidentService';
import * as analyticsService from '../services/analyticsService';
import * as responderService from '../services/responderService';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';
import { SeverityBadge } from '../components/Badge';
import StatCard from '../components/StatCard';
import { SOS_STAGES, emergencyMeta } from '../utils/constants';
import { timeAgo } from '../utils/format';

const NEXT_STATUS = {
  responder_assigned: 'dispatched',
  dispatched: 'en_route',
  en_route: 'arrived',
  arrived: 'resolved',
};

export default function ResponderDashboard() {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const toast = useToast();
  const [sos, setSos] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [sosData, incData, analyticsData] = await Promise.all([
        sosService.listSos(),
        incidentService.listIncidents('unverified'),
        analyticsService.getResponseTimes().catch(() => ({ analytics: null })),
      ]);
      setSos(sosData.sos_requests);
      setIncidents(incData.incidents);
      setAnalytics(analyticsData.analytics);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribe('NEW_SOS', load), [subscribe, load]);
  useEffect(() => subscribe('SOS_UPDATED', load), [subscribe, load]);

  async function handleSelfAssign(id) {
    try {
      await sosService.assignResponder(id, user.id);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAdvance(id, current) {
    const next = NEXT_STATUS[current];
    if (!next) return;
    try {
      await sosService.updateSosStatus(id, next);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function toggleAvailability() {
    const next = !available;
    setAvailable(next);
    try {
      await responderService.updateMyResponderProfile({ is_available: next });
    } catch {
      setAvailable(!next);
    }
  }

  if (loading) return <LoadingState label="Loading responder dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const unassigned = sos.filter((s) => s.status === 'triaged');
  const myAssignments = sos.filter((s) => s.assigned_responder_id === user.id && !['resolved', 'cancelled'].includes(s.status));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Responder Dashboard</h1>
        <button
          onClick={toggleAvailability}
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${available ? 'border-secondary-300 bg-secondary-50 text-secondary-700' : 'border-surface-100 bg-surface text-text-secondary'}`}
        >
          {available ? '🟢 Available' : '⚪ Off duty'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="New SOS Requests" value={unassigned.length} tone="accent" icon="🆘" />
        <StatCard label="My Active Assignments" value={myAssignments.length} tone="primary" icon="📋" />
        <StatCard label="Reports to Verify" value={incidents.length} tone="warning" icon="⚠️" />
        <StatCard label="Avg. Response Time" value={analytics?.average_response_time || '—'} tone="secondary" icon="⏱️" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">New SOS Requests</h2>
        {unassigned.length === 0 ? <EmptyState title="No new SOS requests" icon="✅" /> : (
          <div className="space-y-2">
            {unassigned.map((s) => {
              const eMeta = emergencyMeta(s.emergency_type);
              return (
                <div key={s.id} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono font-semibold text-primary-700">{s.code}</p>
                      <p className="text-sm text-text-secondary">{eMeta.icon} {eMeta.label} · {s.citizen_name || 'Anonymous'} · {timeAgo(s.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={s.triage_priority || s.severity} />
                      <button onClick={() => handleSelfAssign(s.id)} className="btn-primary !px-3 !py-1.5 text-sm">Accept</button>
                    </div>
                  </div>
                  {s.triage_reasoning && (
                    <p className="mt-2 rounded-lg bg-primary-50 p-2 text-xs text-primary-800">
                      <strong>AI-assisted triage:</strong> {s.triage_reasoning}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">My Active Assignments</h2>
        {myAssignments.length === 0 ? <EmptyState title="No active assignments" icon="🧑‍🚒" /> : (
          <div className="space-y-2">
            {myAssignments.map((s) => {
              const stageLabel = SOS_STAGES.find((st) => st.value === s.status)?.label;
              return (
                <div key={s.id} className="card flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link to={`/sos/${s.id}`} className="font-mono font-semibold text-primary-700 hover:underline">{s.code}</Link>
                    <p className="text-sm text-text-secondary capitalize">{s.emergency_type} · {s.citizen_name} · Status: {stageLabel}</p>
                  </div>
                  {NEXT_STATUS[s.status] && (
                    <button onClick={() => handleAdvance(s.id, s.status)} className="btn-secondary !px-3 !py-1.5 text-sm">
                      Mark as {NEXT_STATUS[s.status].replace('_', ' ')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Reports Awaiting Verification</h2>
          <Link to="/community" className="text-sm text-primary-600 hover:underline">Open verification center</Link>
        </div>
        {incidents.length === 0 ? <EmptyState title="No pending reports" icon="✅" /> : (
          <div className="space-y-2">
            {incidents.slice(0, 5).map((inc) => (
              <div key={inc.id} className="card">
                <p className="font-semibold text-text-primary">{inc.title}</p>
                <p className="text-sm text-text-secondary">{timeAgo(inc.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
