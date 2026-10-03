import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as teamService from '../services/teamService';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';
import { TEAM_TYPES } from '../utils/constants';
import { titleCase } from '../utils/format';

const STATUS_STYLE = {
  available: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  busy: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  off_duty: 'bg-surface text-text-secondary border-surface-100',
  maintenance: 'bg-accent-100 text-accent-700 border-accent-200',
};

const ASSIGNMENT_NEXT = { assigned: 'dispatched', dispatched: 'en_route', en_route: 'arrived', arrived: 'completed' };

export default function RescueTeams() {
  const { user } = useAuth();
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ team_code: '', name: '', type: 'general', capabilities: '', equipment: '' });

  const canManage = user && ['coordinator', 'admin'].includes(user.role);

  async function load() {
    try {
      const [t, a] = await Promise.all([teamService.listTeams(), teamService.listAssignments()]);
      setTeams(t.teams);
      setAssignments(a.assignments);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await teamService.createTeam({
        ...form,
        capabilities: form.capabilities.split(',').map((s) => s.trim()).filter(Boolean),
        equipment: form.equipment.split(',').map((s) => s.trim()).filter(Boolean),
      });
      toast.success('Rescue team created.');
      setShowForm(false);
      setForm({ team_code: '', name: '', type: 'general', capabilities: '', equipment: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await teamService.updateTeam(id, { status });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAdvanceAssignment(id, current) {
    const next = ASSIGNMENT_NEXT[current];
    if (!next) return;
    try {
      await teamService.updateAssignment(id, next);
      toast.success(`Assignment marked ${next.replace('_', ' ')}.`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <LoadingState label="Loading rescue teams..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Rescue Teams</h1>
        {canManage && <button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm">{showForm ? 'Cancel' : '+ New Team'}</button>}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required placeholder="Team code (e.g. R-06)" value={form.team_code} onChange={(e) => setForm((f) => ({ ...f, team_code: e.target.value }))} className="input-field" />
          <input required placeholder="Team name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" />
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input-field">
            {TEAM_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </select>
          <input placeholder="Capabilities (comma separated)" value={form.capabilities} onChange={(e) => setForm((f) => ({ ...f, capabilities: e.target.value }))} className="input-field" />
          <input placeholder="Equipment (comma separated)" value={form.equipment} onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))} className="input-field sm:col-span-2" />
          <button type="submit" className="btn-secondary sm:col-span-2">Create team</button>
        </form>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">All Teams</h2>
        {teams.length === 0 ? <EmptyState title="No rescue teams yet" /> : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <div key={t.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-text-tertiary">{t.team_code}</p>
                    <p className="font-bold text-text-primary">{t.name}</p>
                    <p className="text-sm text-text-secondary">{titleCase(t.type)}</p>
                  </div>
                  <span className={`badge border capitalize ${STATUS_STYLE[t.status]}`}>{t.status.replace('_', ' ')}</span>
                </div>
                {t.capabilities?.length > 0 && <p className="mt-2 text-xs text-text-tertiary">Capabilities: {t.capabilities.join(', ')}</p>}
                {t.equipment?.length > 0 && <p className="text-xs text-text-tertiary">Equipment: {t.equipment.join(', ')}</p>}
                {canManage && (
                  <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)} className="input-field mt-3 !py-1.5 text-sm">
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="off_duty">Off duty</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">Assignment History</h2>
        {assignments.length === 0 ? <EmptyState title="No assignments yet" /> : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{a.team_code} — {a.team_name}</p>
                  <p className="text-sm text-text-secondary">{a.sos_id ? `SOS ${a.sos_id.slice(0, 8)}...` : a.incident_id ? `Incident ${a.incident_id.slice(0, 8)}...` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge border border-primary-200 bg-primary-100 text-primary-800 capitalize">{a.status.replace('_', ' ')}</span>
                  {canManage && ASSIGNMENT_NEXT[a.status] && (
                    <button onClick={() => handleAdvanceAssignment(a.id, a.status)} className="btn-primary !px-3 !py-1.5 text-sm">
                      Mark {ASSIGNMENT_NEXT[a.status].replace('_', ' ')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
