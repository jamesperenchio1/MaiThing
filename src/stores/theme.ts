import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvZustandStorage } from '@/src/lib/mmkvStorage';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

function getResolvedIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return Appearance.getColorScheme() === 'dark';
}

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  syncSystem: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      isDark: getResolvedIsDark('light'),
      setMode: (mode) => set({ mode, isDark: getResolvedIsDark(mode) }),
      toggle: () => {
        const current = get().isDark;
        set({ mode: current ? 'light' : 'dark', isDark: !current });
      },
      syncSystem: () => {
        const { mode } = get();
        if (mode === 'system') {
          set({ isDark: getResolvedIsDark('system') });
        }
      },
    }),
    {
      name: 'maithing-theme',
      storage: createJSONStorage(() => mmkvZustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isDark = getResolvedIsDark(state.mode);
        }
      },
    }
  )
);

Appearance.addChangeListener(() => {
  useThemeStore.getState().syncSystem();
});
