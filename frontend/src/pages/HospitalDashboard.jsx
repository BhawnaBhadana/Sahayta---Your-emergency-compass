import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as hospitalService from '../services/hospitalService';
import { LoadingState, ErrorState } from '../components/DataState';
import StatCard from '../components/StatCard';

export default function HospitalDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const storageKey = `sahayta_managed_hospital_${user.id}`;
  const [hospitals, setHospitals] = useState([]);
  const [selectedId, setSelectedId] = useState(localStorage.getItem(storageKey) || '');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function load() {
    try {
      const data = await hospitalService.listHospitals();
      setHospitals(data.hospitals);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const selected = hospitals.find((h) => h.id === selectedId);

  useEffect(() => {
    if (selected) {
      setForm({
        available_beds: selected.available_beds,
        icu_available: selected.icu_available,
        ambulances_available: selected.ambulances_available,
        emergency_capacity_status: selected.emergency_capacity_status,
      });
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectHospital(id) {
    setSelectedId(id);
    localStorage.setItem(storageKey, id);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      await hospitalService.updateCapacity(selectedId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <LoadingState label="Loading hospital dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Hospital Capacity Dashboard</h1>

      <div className="card">
        <label className="mb-1 block text-sm font-medium text-text-primary">Which hospital do you manage?</label>
        <select value={selectedId} onChange={(e) => selectHospital(e.target.value)} className="input-field max-w-md">
          <option value="">Select hospital...</option>
          {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>

      {selected && form && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Beds" value={selected.total_beds} tone="primary" />
            <StatCard label="Available" value={selected.available_beds} tone="secondary" />
            <StatCard label="ICU Beds" value={selected.icu_beds} tone="primary" />
            <StatCard label="ICU Available" value={selected.icu_available} tone="secondary" />
          </div>

          <form onSubmit={handleSave} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Available beds (of {selected.total_beds})</label>
              <input type="number" min={0} max={selected.total_beds} value={form.available_beds} onChange={(e) => setForm((f) => ({ ...f, available_beds: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">ICU available (of {selected.icu_beds})</label>
              <input type="number" min={0} max={selected.icu_beds} value={form.icu_available} onChange={(e) => setForm((f) => ({ ...f, icu_available: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Ambulances available</label>
              <input type="number" min={0} value={form.ambulances_available} onChange={(e) => setForm((f) => ({ ...f, ambulances_available: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Emergency capacity status</label>
              <select value={form.emergency_capacity_status} onChange={(e) => setForm((f) => ({ ...f, emergency_capacity_status: e.target.value }))} className="input-field">
                <option value="available">Available</option>
                <option value="limited">Limited</option>
                <option value="full">Full</option>
              </select>
            </div>
            <button type="submit" className="btn-primary sm:col-span-2">{saved ? '✓ Saved' : 'Update capacity'}</button>
          </form>
        </>
      )}
    </div>
  );
}
