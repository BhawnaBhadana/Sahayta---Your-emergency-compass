import { useEffect, useState } from 'react';
import * as hospitalService from '../services/hospitalService';
import { LoadingState, ErrorState, EmptyState } from '../components/DataState';

const STATUS_STYLE = {
  available: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  limited: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  full: 'bg-accent-100 text-accent-700 border-accent-200',
};

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    hospitalService.listHospitals()
      .then((data) => setHospitals(data.hospitals))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Loading hospitals..." />;
  if (error) return <ErrorState message={error} />;
  if (!hospitals.length) return <EmptyState title="No hospitals registered yet" />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-text-primary">Hospital Capacity</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hospitals.map((h) => (
          <div key={h.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold text-text-primary">{h.name}</h2>
              <span className={`badge border capitalize ${STATUS_STYLE[h.emergency_capacity_status]}`}>{h.emergency_capacity_status}</span>
            </div>
            {h.address && <p className="text-sm text-text-secondary">{h.address}</p>}

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-surface/50 p-2">
                <p className="text-lg font-bold text-text-primary">{h.available_beds}/{h.total_beds}</p>
                <p className="text-xs text-text-tertiary">Beds</p>
              </div>
              <div className="rounded-lg bg-surface/50 p-2">
                <p className="text-lg font-bold text-text-primary">{h.icu_available}/{h.icu_beds}</p>
                <p className="text-xs text-text-tertiary">ICU</p>
              </div>
              <div className="rounded-lg bg-surface/50 p-2">
                <p className="text-lg font-bold text-text-primary">{h.ambulances_available}</p>
                <p className="text-xs text-text-tertiary">Ambulances</p>
              </div>
            </div>

            {h.contact_phone && <p className="mt-3 text-xs text-text-tertiary">📞 {h.contact_phone}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
