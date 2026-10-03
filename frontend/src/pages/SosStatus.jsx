import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as sosService from '../services/sosService';
import { useRealtime } from '../context/RealtimeContext';
import { SOS_STAGES, severityMeta, emergencyMeta } from '../utils/constants';
import { LoadingState, ErrorState } from '../components/DataState';
import { timeAgo } from '../utils/format';

export default function SosStatus() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { subscribe } = useRealtime();

  const load = useCallback(async () => {
    try {
      const res = await sosService.getSos(id);
      setData(res);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
    const unsub = subscribe('SOS_UPDATED', (payload) => {
      if (payload.id === id) load();
    });
    return unsub;
  }, [load, subscribe, id]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState label="Loading SOS status..." />;

  const { sos, history } = data;
  const currentIndex = SOS_STAGES.findIndex((s) => s.value === sos.status);
  const isCancelled = sos.status === 'cancelled';
  const sMeta = severityMeta(sos.severity);
  const eMeta = emergencyMeta(sos.emergency_type);

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-lg font-bold text-primary-700">{sos.code}</p>
            <p className="text-sm text-text-secondary">{eMeta.icon} {eMeta.label} · reported {timeAgo(sos.created_at)}</p>
          </div>
          <span className={`badge border ${sMeta.color}`}>{sMeta.label}</span>
        </div>

        {sos.description && <p className="mt-3 rounded-lg bg-surface/50 p-3 text-sm text-text-secondary">{sos.description}</p>}

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-text-tertiary">Response pipeline</h2>
        {isCancelled ? (
          <p className="mt-2 text-accent-700">This SOS was cancelled.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {SOS_STAGES.map((stage, i) => {
              const done = i < currentIndex || sos.status === 'resolved';
              const active = i === currentIndex && sos.status !== 'resolved';
              const event = history.find((h) => h.status === stage.value);
              return (
                <li key={stage.value} className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done || (active && sos.status === 'resolved') ? 'bg-secondary-600 text-white' : active ? 'border-2 border-primary-600 text-primary-600' : 'border border-surface-100 text-text-tertiary'
                  }`}>
                    {done || sos.status === 'resolved' ? '✓' : active ? '●' : '○'}
                  </span>
                  <span className={done || active ? 'font-medium text-text-primary' : 'text-text-tertiary'}>{stage.label}</span>
                  {event && <span className="ml-auto text-xs text-text-tertiary">{timeAgo(event.created_at)}</span>}
                </li>
              );
            })}
          </ol>
        )}

        {sos.responder_name && (
          <div className="mt-6 rounded-lg border border-surface bg-surface/40 p-3 text-sm">
            <p className="font-semibold text-text-primary">Responder assigned</p>
            <p className="text-text-secondary">{sos.responder_name}{sos.responder_phone ? ` · ${sos.responder_phone}` : ''}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Link to="/map" className="btn-outline flex-1 text-center text-sm">View on map</Link>
          <Link to="/dashboard" className="btn-primary flex-1 text-center text-sm">Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
