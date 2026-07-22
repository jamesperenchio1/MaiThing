import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import th from './th';

export const resources = {
  en: { translation: en },
  th: { translation: th },
} as const;

export type Language = 'en' | 'th';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'th'];

export function initializeI18n(fallbackLng: Language = 'en') {
  i18n.use(initReactI18next).init({
    resources,
    lng: fallbackLng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
  return i18n;
}

export default i18n;
