import { useEffect, useState } from 'react';
import * as alertService from '../services/alertService';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { useToast } from '../context/ToastContext';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';
import { SeverityBadge } from '../components/Badge';
import { ALERT_TYPES } from '../utils/constants';
import { timeAgo, titleCase } from '../utils/format';

const ALERT_STATUS_STYLE = {
  active: 'bg-accent-100 text-accent-700 border-accent-200',
  acknowledged: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  escalated: 'bg-orange-100 text-orange-800 border-orange-200',
  resolved: 'bg-secondary-100 text-secondary-800 border-secondary-200',
};

export default function AlertsPage() {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const toast = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'public_safety', title: '', description: '', severity: 'medium', area: '', recommended_action: '' });

  const canIssue = user && ['admin', 'coordinator'].includes(user.role);
  const canAct = user && ['admin', 'coordinator', 'responder'].includes(user.role);

  async function load() {
    try {
      const data = await alertService.listAlerts();
      setAlerts(data.alerts);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => subscribe('NEW_ALERT', load), [subscribe]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => subscribe('ALERT_UPDATED', load), [subscribe]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await alertService.createAlert(form);
      setForm({ type: 'public_safety', title: '', description: '', severity: 'medium', area: '', recommended_action: '' });
      setShowForm(false);
      toast.success('Alert issued.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAction(fn, id, label) {
    try {
      await fn(id);
      toast.success(label);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <LoadingState label="Loading alerts..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Emergency Alerts</h1>
        {canIssue && (
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm">{showForm ? 'Cancel' : '+ Issue Alert'}</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input-field">
            {ALERT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </select>
          <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className="input-field">
            {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field sm:col-span-2" />
          <input placeholder="Affected area" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} className="input-field sm:col-span-2" />
          <textarea placeholder="Description (what happened, where, when, why it matters)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field sm:col-span-2 h-20 resize-none" />
          <input placeholder="Recommended action for citizens" value={form.recommended_action} onChange={(e) => setForm((f) => ({ ...f, recommended_action: e.target.value }))} className="input-field sm:col-span-2" />
          <button type="submit" className="btn-emergency sm:col-span-2">Issue alert</button>
        </form>
      )}

      {alerts.length === 0 ? <EmptyState title="No active alerts" description="You're all caught up." icon="✅" /> : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className="card border-l-4 border-l-accent-500">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{titleCase(a.type)}: {a.title}</p>
                  <p className="text-sm text-text-secondary">{a.description}</p>
                  {a.recommended_action && <p className="mt-1 text-sm text-primary-700">➜ {a.recommended_action}</p>}
                  <p className="mt-1 text-xs text-text-tertiary">{a.area} · issued {timeAgo(a.issued_at)} by {a.issued_by_name || 'System'}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <SeverityBadge severity={a.severity} />
                  <span className={`badge border capitalize ${ALERT_STATUS_STYLE[a.status] || ALERT_STATUS_STYLE.active}`}>{a.status || 'active'}</span>
                </div>
              </div>
              {canAct && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-surface pt-3">
                  {a.status !== 'acknowledged' && a.status !== 'resolved' && (
                    <button onClick={() => handleAction(alertService.acknowledgeAlert, a.id, 'Alert acknowledged.')} className="btn-outline !px-3 !py-1.5 text-sm">Acknowledge</button>
                  )}
                  {a.status !== 'escalated' && a.status !== 'resolved' && (
                    <button onClick={() => handleAction(alertService.escalateAlert, a.id, 'Alert escalated.')} className="rounded-lg border border-orange-300 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-50">Escalate</button>
                  )}
                  {(user.role === 'admin' || user.role === 'coordinator') && a.status !== 'resolved' && (
                    <button onClick={() => handleAction(alertService.resolveAlert, a.id, 'Alert resolved.')} className="btn-secondary !px-3 !py-1.5 text-sm">Resolve</button>
                  )}
                  {user.role === 'admin' && (
                    <button onClick={() => handleAction(alertService.expireAlert, a.id, 'Alert expired.')} className="text-xs text-text-tertiary hover:underline">Expire</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
