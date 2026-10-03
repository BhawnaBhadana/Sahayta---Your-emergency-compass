import { useEffect, useState } from 'react';
import * as missingPersonService from '../services/missingPersonService';
import { useAuth } from '../context/AuthContext';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';
import { timeAgo } from '../utils/format';

const STATUS_STYLE = {
  missing: 'bg-accent-100 text-accent-700 border-accent-200',
  potential_match: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  verified: 'bg-primary-100 text-primary-800 border-primary-200',
  located: 'bg-primary-100 text-primary-800 border-primary-200',
  identity_verified: 'bg-primary-100 text-primary-800 border-primary-200',
  reunited: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  found: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  closed: 'bg-surface text-text-secondary border-surface-100',
};
const STATUS_OPTIONS = ['missing', 'potential_match', 'located', 'identity_verified', 'reunited', 'closed'];

export default function MissingPersons() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', description: '', last_seen_location: '', contact_phone: '' });

  async function load() {
    setLoading(true);
    try {
      const data = await missingPersonService.listMissingPersons();
      setRecords(data.missing_persons);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await missingPersonService.reportMissingPerson(form);
    setForm({ name: '', age: '', description: '', last_seen_location: '', contact_phone: '' });
    setShowForm(false);
    load();
  }

  async function handleStatus(id, status) {
    await missingPersonService.updateMissingPersonStatus(id, status);
    load();
  }

  const canUpdate = user && ['responder', 'admin', 'coordinator'].includes(user.role);

  if (loading) return <LoadingState label="Loading missing person reports..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Missing Person Network</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm">{showForm ? 'Cancel' : '+ Report Missing Person'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" />
          <input type="number" placeholder="Age" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} className="input-field" />
          <input placeholder="Last seen location" value={form.last_seen_location} onChange={(e) => setForm((f) => ({ ...f, last_seen_location: e.target.value }))} className="input-field sm:col-span-2" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field sm:col-span-2 h-20 resize-none" />
          <input placeholder="Contact phone" value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} className="input-field sm:col-span-2" />
          <button type="submit" className="btn-secondary sm:col-span-2">Submit report</button>
        </form>
      )}

      {records.length === 0 ? <EmptyState title="No missing person reports" icon="🔍" /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-text-primary">{r.name}{r.age ? `, ${r.age}` : ''}</p>
                  <p className="text-sm text-text-secondary">{r.last_seen_location}</p>
                </div>
                <span className={`badge border ${STATUS_STYLE[r.status]}`}>{r.status.replace('_', ' ')}</span>
              </div>
              {r.description && <p className="mt-2 text-sm text-text-secondary">{r.description}</p>}
              <p className="mt-2 text-xs text-text-tertiary">Reported {timeAgo(r.created_at)}{r.contact_phone && ` · ${r.contact_phone}`}</p>
              {canUpdate && (
                <select value={r.status} onChange={(e) => handleStatus(r.id, e.target.value)} className="input-field mt-3 !py-1.5 text-sm">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
