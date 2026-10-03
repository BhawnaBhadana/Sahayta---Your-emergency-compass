import { useEffect, useState } from 'react';
import * as incidentService from '../services/incidentService';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { useToast } from '../context/ToastContext';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';
import { VerificationBadge, SeverityBadge } from '../components/Badge';
import { emergencyMeta } from '../utils/constants';
import { timeAgo } from '../utils/format';

const SIGNAL_LABELS = {
  location_available: 'Location available',
  photo_evidence: 'Photo evidence',
  video_evidence: 'Video evidence',
  independent_reports: 'Independent reports',
  responder_confirmation: 'Responder confirmation',
  community_consensus: 'Community consensus reached',
};

function VerificationSignals({ incident }) {
  const [signals, setSignals] = useState(null);
  useEffect(() => {
    incidentService.getIncident(incident.id).then((d) => setSignals(d.signals)).catch(() => setSignals([]));
  }, [incident.id]);
  if (!signals) return null;
  return (
    <ul className="mt-2 space-y-0.5 text-xs text-secondary-700">
      {signals.map((s) => <li key={s.id}>✓ {SIGNAL_LABELS[s.signal_type] || s.signal_type}{s.detail ? `: ${s.detail}` : ''}</li>)}
    </ul>
  );
}

export default function CommunityVerification() {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const toast = useToast();
  const [incidents, setIncidents] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  async function load() {
    try {
      const data = await incidentService.listIncidents(status || undefined);
      setIncidents(data.incidents);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => subscribe('NEW_INCIDENT', load), [subscribe]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => subscribe('INCIDENT_UPDATED', load), [subscribe]); // eslint-disable-line react-hooks/exhaustive-deps

  const canReview = user && ['responder', 'admin', 'coordinator'].includes(user.role);

  async function handleReview(id, action) {
    let rejection_reason;
    if (action === 'reject') rejection_reason = prompt('Reason for rejection (optional):') || undefined;
    try {
      await incidentService.reviewIncident(id, action, rejection_reason);
      toast.success(action === 'verify' ? 'Incident authority-verified.' : action === 'reject' ? 'Incident rejected.' : 'Marked under review.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <LoadingState label="Loading incident reports..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-text-primary">Community Verification Center</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'unverified', 'under_review', 'community_verified', 'authority_verified', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${status === s ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-surface-100 text-text-secondary'}`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {incidents.length === 0 ? <EmptyState title="No incident reports" description="Reports submitted by citizens will appear here for verification." /> : (
        <div className="space-y-3">
          {incidents.map((inc) => {
            const eMeta = emergencyMeta(inc.emergency_type);
            const isOpen = expanded === inc.id;
            return (
              <div key={inc.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text-primary">{eMeta.icon} {inc.title}</p>
                    <p className="text-sm text-text-secondary">{inc.description}</p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Reported by {inc.reporter_name || 'Anonymous'} · {timeAgo(inc.created_at)}
                      {inc.independent_report_count > 1 && ` · ${inc.independent_report_count} independent reports`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <SeverityBadge severity={inc.severity} />
                    <VerificationBadge status={inc.status} />
                  </div>
                </div>

                <button onClick={() => setExpanded(isOpen ? null : inc.id)} className="mt-2 text-xs text-primary-600 hover:underline">
                  {isOpen ? 'Hide' : 'Show'} verification signals
                </button>
                {isOpen && <VerificationSignals incident={inc} />}

                {canReview && !['verified', 'authority_verified', 'rejected'].includes(inc.status) && (
                  <div className="mt-3 flex gap-2">
                    {inc.status === 'unverified' && (
                      <button onClick={() => handleReview(inc.id, 'under_review')} className="btn-outline !px-3 !py-1.5 text-sm">Mark under review</button>
                    )}
                    <button onClick={() => handleReview(inc.id, 'verify')} className="btn-secondary !px-3 !py-1.5 text-sm">✓ Authority-verify</button>
                    <button onClick={() => handleReview(inc.id, 'reject')} className="rounded-lg border border-accent-300 px-3 py-1.5 text-sm font-medium text-accent-700 hover:bg-accent-50">Reject</button>
                  </div>
                )}
                {inc.status === 'rejected' && inc.rejection_reason && (
                  <p className="mt-2 text-sm text-accent-700">Rejected: {inc.rejection_reason}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
