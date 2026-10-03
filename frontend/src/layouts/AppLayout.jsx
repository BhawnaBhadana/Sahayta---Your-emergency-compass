import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getNavForRole } from '../utils/navConfig';
import { ROLE_LABELS } from '../utils/constants';
import NotificationBell from '../components/NotificationBell';
import ConnectivityBanner from '../components/ConnectivityBanner';
import LanguageSwitcher from '../components/LanguageSwitcher';
import MobileBottomNav from '../components/MobileBottomNav';

function Logo() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center">
      <svg className="h-8 w-8 text-primary-600" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
        <path d="M16 2L3 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L16 2z" />
        <path d="M14 14h4v4h-4z" fill="white" />
        <path d="M12 10h8v2h-8z" fill="white" />
        <path d="M12 20h8v2h-8z" fill="white" />
      </svg>
      <div className="ml-3">
        <h1 className="text-xl font-bold leading-tight text-text-primary">{t('brand.name')}</h1>
        <p className="text-xs leading-tight text-text-secondary">{t('brand.tagline')}</p>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const navItems = getNavForRole(user?.role);
  const showMobileBottomNav = !user || user.role === 'citizen';

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <ConnectivityBanner />

      <header className="sticky top-0 z-40 border-b border-surface bg-white shadow-essential">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to={user ? navItems[0]?.to || '/' : '/'} aria-label="Sahayta home">
            <Logo />
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-6" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'border-b-2 border-primary-600 pb-1 text-primary-600' : 'text-text-secondary hover:text-primary-600'}`
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
            {user && (
              <Link
                to="/sos"
                className="hidden items-center gap-1 rounded-full bg-accent-600 px-4 py-2 text-sm font-bold text-white shadow-emergency hover:bg-accent-700 animate-pulse-emergency sm:flex"
              >
                🚨 {t('nav.sos')}
              </Link>
            )}
            {user ? (
              <>
                <NotificationBell />
                <div className="hidden items-center gap-2 md:flex">
                  <span className="text-sm text-text-secondary">
                    {user.name} <span className="text-xs text-text-tertiary">({t(`role.${user.role}`, ROLE_LABELS[user.role])})</span>
                  </span>
                  <button onClick={handleLogout} className="btn-outline !px-3 !py-1.5 text-sm">{t('nav.logout')}</button>
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login" className="btn-outline !px-4 !py-2 text-sm">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">{t('nav.signup')}</Link>
              </div>
            )}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="text-text-secondary hover:text-primary-600 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-surface bg-white md:hidden">
            <div className="space-y-1 px-4 py-3">
              <div className="pb-2">
                <LanguageSwitcher />
              </div>
              {user && (
                <Link to="/sos" onClick={() => setMenuOpen(false)} className="block rounded-md bg-accent-600 px-3 py-2 text-center font-bold text-white">
                  🚨 {t('nav.sos')}
                </Link>
              )}
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary-50 text-primary-600' : 'text-text-secondary hover:bg-surface'}`}
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
              {user ? (
                <button onClick={handleLogout} className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-text-secondary hover:bg-surface">
                  {t('nav.logout')} ({user.name})
                </button>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-outline flex-1 text-center text-sm">{t('nav.login')}</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-center text-sm">{t('nav.signup')}</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className={`mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 ${showMobileBottomNav ? 'pb-24 sm:pb-6' : ''}`}>
        <Outlet />
      </main>

      <footer className="hidden border-t border-surface bg-white sm:block">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-text-secondary sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p>{t('footer.rights')}</p>
            <p className="text-xs text-text-tertiary">{t('footer.demoNote')}</p>
          </div>
        </div>
      </footer>

      {showMobileBottomNav && <MobileBottomNav />}
    </div>
  );
}
