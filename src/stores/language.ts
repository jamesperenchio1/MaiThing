import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/src/i18n';

interface LanguageState {
  language: 'en' | 'th';
  setLanguage: (lang: 'en' | 'th') => void;
  toggle: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
      },
      toggle: () => {
        const next = get().language === 'en' ? 'th' : 'en';
        set({ language: next });
        i18n.changeLanguage(next);
      },
    }),
    {
      name: 'maithing-language',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          i18n.changeLanguage(state.language);
        }
      },
    }
  )
);
