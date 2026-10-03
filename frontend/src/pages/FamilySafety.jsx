import { useEffect, useState } from 'react';
import * as familyService from '../services/familyService';
import { LoadingState, ErrorState } from '../components/DataState';

const STATUS_OPTIONS = [
  { value: 'safe', label: 'Safe', dot: '🟢' },
  { value: 'needs_help', label: 'Needs Help', dot: '🔴' },
  { value: 'not_responded', label: 'Not Responded', dot: '🟡' },
];

export default function FamilySafety() {
  const [family, setFamily] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ display_name: '', phone: '' });

  async function load() {
    try {
      const data = await familyService.getMyFamily();
      setFamily(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.display_name.trim()) return;
    await familyService.addFamilyMember(form);
    setForm({ display_name: '', phone: '' });
    load();
  }

  async function handleStatus(memberId, status) {
    await familyService.updateMemberStatus(memberId, status);
    load();
  }

  async function handleRemove(memberId) {
    if (!confirm('Remove this family member?')) return;
    await familyService.removeMember(memberId);
    load();
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!family) return <LoadingState label="Loading family safety..." />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-text-primary">Family Safety Check-In</h1>
      <p className="mb-4 text-sm text-text-secondary">Keep track of your trusted circle's safety status during a crisis.</p>

      <div className="space-y-3">
        {family.members.length === 0 ? (
          <p className="card text-center text-text-secondary">No family members added yet.</p>
        ) : (
          family.members.map((m) => (
            <div key={m.id} className="card flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-text-primary">{m.display_name}</p>
                {m.phone && <p className="text-sm text-text-secondary">{m.phone}</p>}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={m.status}
                  onChange={(e) => handleStatus(m.id, e.target.value)}
                  className="input-field !w-auto !py-1.5 text-sm"
                  aria-label={`Status for ${m.display_name}`}
                >
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.dot} {o.label}</option>)}
                </select>
                <button onClick={() => handleRemove(m.id)} className="text-sm text-accent-600 hover:underline">Remove</button>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="card mt-6 flex flex-wrap gap-3">
        <input required placeholder="Name" value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} className="input-field flex-1" />
        <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field flex-1" />
        <button type="submit" className="btn-primary">Add member</button>
      </form>
    </div>
  );
}
