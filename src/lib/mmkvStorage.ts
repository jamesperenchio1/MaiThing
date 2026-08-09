import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * Global MMKV instance for Zustand store persistence.
 * MMKV is 10-100x faster than AsyncStorage and supports synchronous reads,
 * which means store hydration is instant on app launch.
 *
 * @see https://github.com/mrousavy/react-native-mmkv
 */
export const mmkvStorage = createMMKV({
  id: 'maithing-zustand',
});

/**
 * Zustand-compatible StateStorage adapter backed by MMKV.
 * Replaces AsyncStorage for all persisted Zustand stores.
 */
export const mmkvZustandStorage: StateStorage = {
  getItem: (name) => {
    const value = mmkvStorage.getString(name);
    return value ?? null;
  },
  setItem: (name, value) => {
    mmkvStorage.set(name, value);
  },
  removeItem: (name) => {
    mmkvStorage.remove(name);
  },
};
