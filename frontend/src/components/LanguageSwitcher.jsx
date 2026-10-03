import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';
import { useToast } from '../context/ToastContext';

const PRIMARY = LANGUAGES.filter((l) => l.translated);
const MORE = LANGUAGES.filter((l) => !l.translated);

export default function LanguageSwitcher({ compact = false }) {
  const { i18n, t } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function selectLanguage(lang) {
    i18n.changeLanguage(lang.code);
    document.documentElement.lang = lang.code;
    setOpen(false);
    if (!lang.translated) toast.info(t('language.comingSoon'));
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1 text-sm font-medium">
        {PRIMARY.map((lang) => (
          <button
            key={lang.code}
            onClick={() => selectLanguage(lang)}
            aria-pressed={i18n.language === lang.code}
            className={`rounded-md px-2 py-1 transition-colors ${i18n.language === lang.code ? 'bg-primary-100 text-primary-700' : 'text-text-secondary hover:bg-surface'}`}
          >
            {lang.name}
          </button>
        ))}
        {!compact && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={t('language.choose')}
            className="rounded-md px-2 py-1 text-text-tertiary hover:bg-surface"
          >
            +{MORE.length}
          </button>
        )}
      </div>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl border border-surface bg-white p-2 shadow-essential">
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">{t('language.choose')}</p>
          {MORE.map((lang) => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-text-secondary hover:bg-surface"
            >
              <span>{lang.name}</span>
              <span className="text-[10px] text-text-tertiary">soon</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
