import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import amTranslations from './locales/am.json';

const LANGUAGE_KEY = 'gourmetcontrol_language';

const savedLanguage = localStorage.getItem(LANGUAGE_KEY) || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    am: { translation: amTranslations },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already safeguards against XSS
  },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_KEY, lng);
});

export default i18n;
