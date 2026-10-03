import { useEffect, useState } from 'react';
import * as shelterService from '../services/shelterService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';

const AMENITIES = [
  { key: 'has_food', label: 'Food' },
  { key: 'has_water', label: 'Water' },
  { key: 'has_medical', label: 'Medical' },
  { key: 'is_women_safe', label: 'Women Safe' },
  { key: 'has_children_area', label: 'Children' },
  { key: 'is_accessible', label: 'Accessible' },
];

export default function Shelters() {
  const { user } = useAuth();
  const toast = useToast();
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const data = await shelterService.listShelters();
      setShelters(data.shelters);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const canManage = user && ['ngo', 'admin', 'coordinator'].includes(user.role);

  async function handleUpdate(id) {
    try {
      await shelterService.updateOccupancy(id, Number(editValue));
      setEditing(null);
      toast.success('Occupancy updated.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <LoadingState label="Loading shelters..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!shelters.length) return <EmptyState title="No shelters registered yet" />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-text-primary">Shelter Directory</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shelters.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold text-text-primary">{s.name}</h2>
              {s.status === 'full' && <span className="badge border border-accent-200 bg-accent-100 text-accent-700">⚠ FULL</span>}
            </div>
            {s.address && <p className="text-sm text-text-secondary">{s.address}</p>}

            <div className="mt-3">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Capacity: {s.capacity}</span>
                <span>Available: {s.available}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className={`h-full ${s.occupied / s.capacity > 0.9 ? 'bg-accent-600' : 'bg-secondary-600'}`}
                  style={{ width: `${Math.min(100, (s.occupied / s.capacity) * 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1 text-sm">
              {AMENITIES.map((a) => (
                <span key={a.key} className={s[a.key] ? 'text-secondary-700' : 'text-text-tertiary line-through'}>
                  {s[a.key] ? '✓' : '✕'} {a.label}
                </span>
              ))}
            </div>

            {s.contact_phone && <p className="mt-2 text-xs text-text-tertiary">📞 {s.contact_phone}</p>}

            {canManage && (
              editing === s.id ? (
                <div className="mt-3 flex gap-2">
                  <input type="number" min={0} max={s.capacity} value={editValue} onChange={(e) => setEditValue(e.target.value)} className="input-field !py-1.5" />
                  <button onClick={() => handleUpdate(s.id)} className="btn-primary !px-3 !py-1.5 text-sm">Save</button>
                  <button onClick={() => setEditing(null)} className="btn-outline !px-3 !py-1.5 text-sm">Cancel</button>
                </div>
              ) : (
                <button onClick={() => { setEditing(s.id); setEditValue(s.occupied); }} className="mt-3 text-sm text-primary-600 hover:underline">Update occupancy</button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
