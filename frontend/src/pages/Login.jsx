import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/constants';

const DEMO_ACCOUNTS = [
  { role: 'Citizen', email: 'citizen@sahayta.org' },
  { role: 'Responder', email: 'responder1@sahayta.org' },
  { role: 'Coordinator', email: 'coordinator@sahayta.org' },
  { role: 'Volunteer', email: 'volunteer1@sahayta.org' },
  { role: 'NGO', email: 'ngo@sahayta.org' },
  { role: 'Hospital', email: 'hospital@sahayta.org' },
  { role: 'Admin', email: 'admin@sahayta.org' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const dest = location.state?.from?.pathname || ROLE_HOME[user.role] || '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 py-8 lg:grid-cols-2">
      <div className="card">
        <h1 className="text-2xl font-bold text-text-primary">Sign in to Sahayta</h1>
        <p className="mt-1 text-sm text-text-secondary">Access your dashboard and emergency tools.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <p role="alert" className="rounded-lg bg-accent-50 border border-accent-200 px-4 py-2 text-sm text-accent-700">{error}</p>}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-primary">Email</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-primary">Password</label>
            <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>

        <p className="mt-4 text-center text-sm text-text-secondary">
          No account? <Link to="/register" className="font-medium text-primary-600 hover:underline">Create one</Link>
        </p>
      </div>

      <div className="card bg-primary-50">
        <h2 className="font-bold text-text-primary">Demo accounts</h2>
        <p className="mt-1 text-sm text-text-secondary">Password for every demo account: <code className="font-mono text-primary-700">Sahayta@123</code></p>
        <ul className="mt-4 space-y-2 text-sm">
          {DEMO_ACCOUNTS.map((acc) => (
            <li key={acc.email} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
              <span className="font-medium text-text-primary">{acc.role}</span>
              <button
                type="button"
                onClick={() => { setEmail(acc.email); setPassword('Sahayta@123'); }}
                className="font-mono text-xs text-primary-600 hover:underline"
              >
                {acc.email}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
