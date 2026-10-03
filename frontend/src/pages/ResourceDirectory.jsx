import { useEffect, useState } from 'react';
import * as resourceService from '../services/resourceService';
import { useAuth } from '../context/AuthContext';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';
import { RESOURCE_CATEGORIES } from '../utils/constants';
import { titleCase } from '../utils/format';

const STATUS_STYLE = {
  available: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  critical: 'bg-orange-100 text-orange-800 border-orange-200',
  out_of_stock: 'bg-accent-100 text-accent-700 border-accent-200',
};

export default function ResourceDirectory() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'water', name: '', quantity: 0, unit: 'units', location_label: '' });

  async function load() {
    setLoading(true);
    try {
      const data = await resourceService.listResources(category || undefined);
      setResources(data.resources);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = resources.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const canManage = user && ['ngo', 'admin', 'coordinator'].includes(user.role);

  async function handleCreate(e) {
    e.preventDefault();
    await resourceService.createResource(form);
    setShowForm(false);
    setForm({ category: 'water', name: '', quantity: 0, unit: 'units', location_label: '' });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Resource Directory</h1>
        {canManage && <button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm">{showForm ? 'Cancel' : '+ Add Resource'}</button>}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field">
            {RESOURCE_CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </select>
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field sm:col-span-2" />
          <input required type="number" min={0} placeholder="Quantity" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="input-field" />
          <input placeholder="Unit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="input-field" />
          <button type="submit" className="btn-secondary sm:col-span-5">Save resource</button>
        </form>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field max-w-xs" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field max-w-xs">
          <option value="">All categories</option>
          {RESOURCE_CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
        </select>
      </div>

      {loading ? <LoadingState label="Loading resources..." /> : error ? <ErrorState message={error} onRetry={load} /> : filtered.length === 0 ? (
        <EmptyState title="No resources found" description="Try a different category or search term." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase text-text-tertiary">{titleCase(r.category)}</p>
                  <p className="font-semibold text-text-primary">{r.name}</p>
                </div>
                <span className={`badge border ${STATUS_STYLE[r.status]}`}>{titleCase(r.status)}</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-text-primary">{r.quantity} <span className="text-sm font-normal text-text-secondary">{r.unit}</span></p>
              {r.reserved > 0 && <p className="text-xs text-text-tertiary">{r.reserved} reserved for pending requests</p>}
              {r.location_label && <p className="mt-1 text-sm text-text-secondary">{r.location_label}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
