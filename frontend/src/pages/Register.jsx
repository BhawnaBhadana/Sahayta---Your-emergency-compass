import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/constants';

const ROLES = [
  { value: 'citizen', label: 'Citizen', desc: 'Send SOS, report incidents, find help' },
  { value: 'volunteer', label: 'Volunteer', desc: 'Accept tasks, support relief operations' },
  { value: 'responder', label: 'Responder', desc: 'Respond to emergencies, verify reports' },
  { value: 'ngo', label: 'NGO', desc: 'Manage shelters and resource supply' },
  { value: 'hospital', label: 'Hospital', desc: 'Publish bed/ICU capacity' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'citizen' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(ROLE_HOME[user.role] || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="card">
        <h1 className="text-2xl font-bold text-text-primary">Create your Sahayta account</h1>
        <p className="mt-1 text-sm text-text-secondary">Choose the role that matches how you'll use Sahayta.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <p role="alert" className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-sm text-accent-700">{error}</p>}

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-text-primary">Full name</label>
            <input id="name" required value={form.name} onChange={(e) => update('name', e.target.value)} className="input-field" />
          </div>
          <div>
            <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-text-primary">Email</label>
            <input id="reg-email" type="email" required autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" />
          </div>
          <div>
            <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-text-primary">Password</label>
            <input id="reg-password" type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field" />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-text-primary">Phone (optional)</label>
            <input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" placeholder="+91..." />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-text-primary">I am a...</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`cursor-pointer rounded-lg border-2 p-3 text-sm transition-colors ${form.role === r.value ? 'border-primary-600 bg-primary-50' : 'border-surface-100 hover:border-primary-200'}`}
                >
                  <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => update('role', r.value)} className="sr-only" />
                  <span className="block font-semibold text-text-primary">{r.label}</span>
                  <span className="block text-xs text-text-secondary">{r.desc}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating account...' : 'Create account'}</button>
        </form>

        <p className="mt-4 text-center text-sm text-text-secondary">
          Already have an account? <Link to="/login" className="font-medium text-primary-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
