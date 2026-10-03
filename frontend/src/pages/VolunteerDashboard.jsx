import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { useToast } from '../context/ToastContext';
import * as taskService from '../services/taskService';
import * as responderService from '../services/responderService';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';
import StatCard from '../components/StatCard';
import { titleCase } from '../utils/format';

const NEXT_STATUS = { accepted: 'in_progress', in_progress: 'arrived', arrived: 'completed' };

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [available, setAvailable] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await taskService.listTasks();
      setTasks(data.tasks);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribe('NEW_TASK', load), [subscribe, load]);
  useEffect(() => subscribe('TASK_UPDATED', load), [subscribe, load]);

  async function handleAccept(id) {
    try {
      await taskService.acceptTask(id);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAdvance(id, status) {
    const next = NEXT_STATUS[status];
    if (!next) return;
    await taskService.updateTaskStatus(id, next);
    load();
  }

  async function toggleAvailability() {
    const next = !available;
    setAvailable(next);
    try {
      await responderService.updateMyVolunteerProfile({ is_available: next });
    } catch {
      setAvailable(!next);
    }
  }

  if (loading) return <LoadingState label="Loading your tasks..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const openTasks = tasks.filter((t) => t.status === 'open');
  const myTasks = tasks.filter((t) => t.assigned_volunteer_id === user.id && !['completed', 'cancelled'].includes(t.status));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Volunteer Dashboard</h1>
        <button
          onClick={toggleAvailability}
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${available ? 'border-secondary-300 bg-secondary-50 text-secondary-700' : 'border-surface-100 bg-surface text-text-secondary'}`}
        >
          {available ? '🟢 Available' : '⚪ Unavailable'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Open Tasks Nearby" value={openTasks.length} tone="primary" icon="📋" />
        <StatCard label="My Active Tasks" value={myTasks.length} tone="secondary" icon="🤝" />
        <StatCard label="Completed" value={tasks.filter((t) => t.status === 'completed').length} tone="secondary" icon="✅" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">Nearby Open Tasks</h2>
        {openTasks.length === 0 ? <EmptyState title="No open tasks right now" icon="✅" /> : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {openTasks.map((t) => (
              <div key={t.id} className="card">
                <p className="text-xs uppercase text-text-tertiary">{titleCase(t.type)}</p>
                <p className="font-semibold text-text-primary">{t.title}</p>
                {t.address && <p className="text-sm text-text-secondary">{t.address}</p>}
                <button onClick={() => handleAccept(t.id)} className="btn-primary mt-3 w-full text-sm">Accept Task</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">My Active Tasks</h2>
        {myTasks.length === 0 ? <EmptyState title="You have no active tasks" icon="🤝" /> : (
          <div className="space-y-2">
            {myTasks.map((t) => (
              <div key={t.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{t.title}</p>
                  <p className="text-sm capitalize text-text-secondary">Status: {t.status.replace('_', ' ')}</p>
                </div>
                {NEXT_STATUS[t.status] && (
                  <button onClick={() => handleAdvance(t.id, t.status)} className="btn-secondary !px-3 !py-1.5 text-sm">
                    Mark as {NEXT_STATUS[t.status].replace('_', ' ')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
