import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../locales/en/common.json';
import hi from '../locales/hi/common.json';

// Architecture is ready for all 22 Scheduled Indian Languages (see LANGUAGES
// below for the full list shown in the switcher). Translation FILES only
// exist for English and Hindi today — every other language falls back to
// English via `fallbackLng` until translated. This is deliberate and
// disclosed in the UI rather than silently pretending full coverage exists.
export const LANGUAGES = [
  { code: 'en', name: 'English', translated: true },
  { code: 'hi', name: 'हिन्दी', translated: true },
  { code: 'bn', name: 'বাংলা', translated: false },
  { code: 'te', name: 'తెలుగు', translated: false },
  { code: 'mr', name: 'मराठी', translated: false },
  { code: 'ta', name: 'தமிழ்', translated: false },
  { code: 'ur', name: 'اردو', translated: false },
  { code: 'gu', name: 'ગુજરાતી', translated: false },
  { code: 'kn', name: 'ಕನ್ನಡ', translated: false },
  { code: 'or', name: 'ଓଡ଼ିଆ', translated: false },
  { code: 'ml', name: 'മലയാളം', translated: false },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', translated: false },
  { code: 'as', name: 'অসমীয়া', translated: false },
  { code: 'mai', name: 'मैथिली', translated: false },
  { code: 'sa', name: 'संस्कृतम्', translated: false },
  { code: 'ks', name: 'کٲشُر', translated: false },
  { code: 'ne', name: 'नेपाली', translated: false },
  { code: 'kok', name: 'कोंकणी', translated: false },
  { code: 'sd', name: 'سنڌي', translated: false },
  { code: 'doi', name: 'डोगरी', translated: false },
  { code: 'mni', name: 'ꯃꯤꯇꯩꯂꯣꯟ', translated: false },
  { code: 'brx', name: 'बड़ो', translated: false },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ', translated: false },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      hi: { common: hi },
    },
    fallbackLng: 'en',
    supportedLngs: LANGUAGES.map((l) => l.code),
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'sahayta_language',
      caches: ['localStorage'],
    },
  });

export default i18n;
