import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/src/i18n';

interface LanguageState {
  language: 'en' | 'th';
  hydrated: boolean;
  setLanguage: (lang: 'en' | 'th') => void;
  toggle: () => void;
}

function changeLanguageIfNeeded(language: 'en' | 'th') {
  if (i18n.language !== language && i18n.isInitialized) {
    i18n.changeLanguage(language);
  }
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      hydrated: false,
      setLanguage: (language) => {
        if (get().language === language) return;
        set({ language });
        changeLanguageIfNeeded(language);
      },
      toggle: () => {
        const next = get().language === 'en' ? 'th' : 'en';
        set({ language: next });
        changeLanguageIfNeeded(next);
      },
    }),
    {
      name: 'maithing-language',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
          changeLanguageIfNeeded(state.language);
        }
      },
    }
  )
);
