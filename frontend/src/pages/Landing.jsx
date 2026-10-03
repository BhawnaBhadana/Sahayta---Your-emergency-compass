import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/constants';

const SECONDARY_LINKS = [
  { to: '/shelters', labelKey: 'landing.findShelter', icon: '🏠' },
  { to: '/hospitals', labelKey: 'landing.findHospital', icon: '🏥' },
  { to: '/register', labelKey: 'landing.volunteer', icon: '🤝' },
  { to: '/alerts', labelKey: 'landing.emergencyAlerts', icon: '📢' },
];

const USPS = [
  { title: 'Verified Information', desc: 'Not every report becomes trusted information — a verification pipeline confirms it first.', icon: '✅' },
  { title: 'Smart Coordination', desc: 'Citizens, responders, volunteers, hospitals, shelters and NGOs act on one shared picture.', icon: '🧩' },
  { title: 'Location Intelligence', desc: 'The platform understands where help, danger and resources actually are, in real time.', icon: '📍' },
  { title: 'Resource Matching', desc: 'Shortages at one shelter are automatically matched with surplus from nearby providers.', icon: '🔄' },
  { title: 'Response Tracking', desc: 'Every SOS is tracked end-to-end, from request to resolution, with timestamps.', icon: '⏱️' },
  { title: 'Human-Controlled AI', desc: 'AI assists triage and summarization; humans always make the final call.', icon: '🧠' },
];

export default function Landing() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const primaryHome = user ? ROLE_HOME[user.role] || '/dashboard' : '/login';

  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-br from-primary-800 to-primary-600 px-6 py-16 text-center text-white sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-100">{t('brand.name')}</p>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{t('brand.motto')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-primary-50">{t('landing.heroLine')}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to={user ? '/sos' : '/login'} className="btn-emergency !px-10 !py-5 text-lg">🚨 {t('landing.sos')}</Link>
          <Link to="/map" className="rounded-lg bg-white/10 px-8 py-4 font-semibold backdrop-blur hover:bg-white/20">🗺️ {t('landing.findHelp')}</Link>
          <Link to={user ? '/report' : '/login'} className="rounded-lg bg-white/10 px-8 py-4 font-semibold backdrop-blur hover:bg-white/20">⚠️ {t('landing.reportIncident')}</Link>
        </div>

        {!user && (
          <p className="mt-6 text-sm text-primary-100">{t('landing.signInPrompt')}</p>
        )}
      </section>

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {SECONDARY_LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="card flex flex-col items-center gap-2 text-center hover:shadow-essential">
            <span className="text-3xl" aria-hidden="true">{l.icon}</span>
            <span className="text-sm font-medium text-text-primary">{t(l.labelKey)}</span>
          </Link>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-center text-2xl font-bold text-text-primary">{t('landing.flowTitle')}</h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-center text-sm font-medium">
          {['SOS / Report', 'Verification', 'Priority', 'Responder Assignment', 'Safe Route', 'Response', 'Resolution', 'Analytics'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-primary-700">{step}</span>
              {i < arr.length - 1 && <span className="text-primary-300" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {USPS.map((u) => (
          <div key={u.title} className="card">
            <span className="text-2xl" aria-hidden="true">{u.icon}</span>
            <h3 className="mt-2 font-bold text-text-primary">{u.title}</h3>
            <p className="mt-1 text-sm text-text-secondary">{u.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center text-sm text-yellow-800">
        {t('landing.demoBanner')}
      </section>
    </div>
  );
}
