import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as incidentService from '../services/incidentService';
import * as uploadService from '../services/uploadService';
import { EMERGENCY_TYPES, SEVERITY_LEVELS } from '../utils/constants';

export default function ReportIncident() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ emergency_type: 'other', severity: 'medium', title: '', description: '', address: '' });
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  function detectLocation() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: 28.6139, lng: 77.209 })
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!location) {
      setError('Please capture your location first.');
      return;
    }
    setSubmitting(true);
    try {
      let photo_url;
      if (photo) photo_url = await uploadService.uploadFile(photo, photo.name);
      const { incident } = await incidentService.createIncident({
        ...form,
        latitude: location.lat,
        longitude: location.lng,
        photo_url,
      });
      setSuccess(incident);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="card">
          <p className="text-5xl">📨</p>
          <h1 className="mt-3 text-xl font-bold text-text-primary">Report submitted</h1>
          <p className="mt-2 text-text-secondary">
            Your report is now <strong>unverified</strong> and awaiting review by a responder or admin before it becomes actionable.
          </p>
          <div className="mt-4 flex gap-3">
            <button onClick={() => navigate('/community')} className="btn-primary flex-1">View verification queue</button>
            <button onClick={() => setSuccess(null)} className="btn-outline flex-1">Report another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-6">
      <h1 className="mb-1 text-2xl font-bold text-text-primary">Report an Incident</h1>
      <p className="mb-4 text-sm text-text-secondary">Share verified, first-hand information to help the community and responders.</p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && <p role="alert" className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-sm text-accent-700">{error}</p>}

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Emergency type</label>
          <select value={form.emergency_type} onChange={(e) => setForm((f) => ({ ...f, emergency_type: e.target.value }))} className="input-field">
            {EMERGENCY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Severity</label>
          <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className="input-field">
            {SEVERITY_LEVELS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-text-primary">Title</label>
          <input id="title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field" placeholder="Brief summary of what you saw" />
        </div>

        <div>
          <label htmlFor="idesc" className="mb-1 block text-sm font-medium text-text-primary">Description</label>
          <textarea id="idesc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field h-24 resize-none" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Location</label>
          <button type="button" onClick={detectLocation} className="btn-outline w-full text-sm">
            {location ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Capture current location'}
          </button>
        </div>

        <div>
          <label htmlFor="photo" className="mb-1 block text-sm font-medium text-text-primary">Photo evidence (optional)</label>
          <input id="photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="text-sm" />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Submitting...' : 'Submit report'}</button>
      </form>
    </div>
  );
}
