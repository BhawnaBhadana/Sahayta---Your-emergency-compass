import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ITEMS = [
  { to: '/report', icon: '🚨', labelKey: 'landing.reportIncident', short: 'Report' },
  { to: '/shelters', icon: '🏠', labelKey: 'landing.findShelter', short: 'Shelter' },
  { to: '/sos', icon: '🆘', labelKey: 'nav.sos', short: 'SOS', emphasize: true },
  { to: '/hospitals', icon: '🏥', labelKey: 'landing.findHospital', short: 'Hospital' },
  { to: '/alerts', icon: '🔔', labelKey: 'nav.alerts', short: 'Alerts' },
];

/** Mobile-first sticky bottom nav for citizens — the actions that matter most in an emergency, always one thumb-tap away. */
export default function MobileBottomNav() {
  const { t } = useTranslation();
  return (
    <nav
      aria-label="Emergency quick actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-surface bg-white/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
                item.emphasize
                  ? 'text-accent-700'
                  : isActive
                    ? 'text-primary-600'
                    : 'text-text-secondary'
              }`
            }
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${item.emphasize ? 'bg-accent-600 text-white shadow-emergency' : ''}`}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            {t(item.labelKey, item.short)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
