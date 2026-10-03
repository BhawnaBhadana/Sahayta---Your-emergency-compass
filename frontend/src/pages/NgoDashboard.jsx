import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as resourceService from '../services/resourceService';
import * as shelterService from '../services/shelterService';
import { useToast } from '../context/ToastContext';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';
import StatCard from '../components/StatCard';
import { RESOURCE_CATEGORIES } from '../utils/constants';
import { titleCase, timeAgo } from '../utils/format';

const NEXT_STATUS = { requested: 'approved', approved: 'dispatched', dispatched: 'delivered' };

export default function NgoDashboard() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [matchForm, setMatchForm] = useState({ requesting_shelter_id: '', category: 'water', quantity_needed: 100 });
  const [matches, setMatches] = useState(null);
  const [matching, setMatching] = useState(false);

  async function load() {
    try {
      const [r, res, s] = await Promise.all([
        resourceService.listResourceRequests(),
        resourceService.listResources(),
        shelterService.listShelters(),
      ]);
      setRequests(r.requests);
      setResources(res.resources);
      setShelters(s.shelters);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleFindMatch(e) {
    e.preventDefault();
    setMatching(true);
    try {
      const shelter = shelters.find((s) => s.id === matchForm.requesting_shelter_id);
      const data = await resourceService.findMatches(matchForm.category, Number(matchForm.quantity_needed), shelter?.latitude, shelter?.longitude);
      setMatches(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMatching(false);
    }
  }

  async function handleCreateRequest(resourceId, quantity) {
    try {
      await resourceService.createResourceRequest({
        requesting_shelter_id: matchForm.requesting_shelter_id,
        category: matchForm.category,
        quantity_needed: quantity,
        fulfilling_resource_id: resourceId,
      });
      setMatches(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAdvance(id, status) {
    const next = NEXT_STATUS[status];
    if (!next) return;
    await resourceService.updateResourceRequest(id, next);
    load();
  }

  if (loading) return <LoadingState label="Loading NGO dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const critical = resources.filter((r) => ['critical', 'out_of_stock'].includes(r.status));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text-primary">NGO Operations Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pending Requests" value={requests.filter((r) => r.status === 'requested').length} tone="warning" icon="📨" />
        <StatCard label="In Transit" value={requests.filter((r) => r.status === 'dispatched').length} tone="primary" icon="🚚" />
        <StatCard label="Critical Stock Items" value={critical.length} tone="accent" icon="⚠️" />
        <StatCard label="Total Resources Tracked" value={resources.length} tone="secondary" icon="📦" />
      </div>

      <section className="card">
        <h2 className="font-bold text-text-primary">🔄 Resource Matching Engine</h2>
        <p className="mt-1 text-sm text-text-secondary">Find providers who can cover a shelter's shortage.</p>
        <form onSubmit={handleFindMatch} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <select required value={matchForm.requesting_shelter_id} onChange={(e) => setMatchForm((f) => ({ ...f, requesting_shelter_id: e.target.value }))} className="input-field sm:col-span-2">
            <option value="">Select shelter with shortage...</option>
            {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={matchForm.category} onChange={(e) => setMatchForm((f) => ({ ...f, category: e.target.value }))} className="input-field">
            {RESOURCE_CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </select>
          <input type="number" min={1} value={matchForm.quantity_needed} onChange={(e) => setMatchForm((f) => ({ ...f, quantity_needed: e.target.value }))} className="input-field" placeholder="Qty needed" />
          <button type="submit" disabled={matching} className="btn-primary sm:col-span-4">{matching ? 'Searching...' : 'Find Match'}</button>
        </form>

        {matches && (
          <div className="mt-4 rounded-lg border border-surface bg-surface/40 p-4">
            {matches.fully_covered ? (
              <p className="font-semibold text-secondary-700">✓ Shortage can be fully covered</p>
            ) : (
              <p className="font-semibold text-yellow-700">Partial match — {matches.shortage_remaining} {matchForm.category} still short</p>
            )}
            <div className="mt-2 space-y-2">
              {matches.matches.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-white p-3 text-sm shadow-minimal">
                  <div>
                    <p className="font-semibold text-text-primary">{m.name}</p>
                    <p className="text-text-secondary">{m.suggested_quantity} {m.unit} available{m.distance_km != null ? ` · ${m.distance_km.toFixed(1)} km` : ''}</p>
                  </div>
                  <button onClick={() => handleCreateRequest(m.id, m.suggested_quantity)} className="btn-secondary !px-3 !py-1.5 text-sm">Create Request</button>
                </div>
              ))}
              {matches.matches.length === 0 && <p className="text-sm text-text-tertiary">No providers currently have this resource available.</p>}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Resource Requests</h2>
          <Link to="/resources" className="text-sm text-primary-600 hover:underline">Manage inventory</Link>
        </div>
        {requests.length === 0 ? <EmptyState title="No resource requests yet" /> : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{r.quantity_needed} {titleCase(r.category)} for {r.shelter_name}</p>
                  <p className="text-sm text-text-secondary">
                    {r.resource_name ? `Fulfilled by ${r.resource_name}` : 'Awaiting match'} · {timeAgo(r.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge border border-primary-200 bg-primary-100 text-primary-800 capitalize">{r.status}</span>
                  {NEXT_STATUS[r.status] && (
                    <button onClick={() => handleAdvance(r.id, r.status)} className="btn-primary !px-3 !py-1.5 text-sm">
                      Mark {NEXT_STATUS[r.status]}
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
