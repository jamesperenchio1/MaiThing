import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import th from './th';
import { registerZodI18nErrorMap } from './zodErrorMap';

export const resources = {
  en: { translation: en },
  th: { translation: th },
} as const;

export type Language = 'en' | 'th';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'th'];

export function initializeI18n(fallbackLng: Language = 'en') {
  i18n.use(initReactI18next).init({
    resources,
    fallbackLng,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
  registerZodI18nErrorMap();
  return i18n;
}

export default i18n;
