import { createMMKV, type MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/**
 * Global MMKV instance for Zustand store persistence.
 * MMKV is 10-100x faster than AsyncStorage and supports synchronous reads,
 * which means store hydration is instant on app launch.
 *
 * During SSR (web export), MMKV/localStorage cannot be accessed synchronously,
 * so we return a no-op adapter that leaves stores in their default state.
 *
 * @see https://github.com/mrousavy/react-native-mmkv
 */
export const SSR_SAFE_MMKV_NOOP: MMKV = {
  getString: () => undefined,
  getBoolean: () => false,
  getNumber: () => 0,
  set: () => {},
  delete: () => {},
  remove: () => {},
  contains: () => false,
  getAllKeys: () => [],
  clearAll: () => {},
  setAsync: async () => {},
  getStringAsync: async () => undefined,
  getBooleanAsync: async () => false,
  getNumberAsync: async () => 0,
  addOnValueChangedListener: () => ({ remove: () => {} }),
  recrypt: () => {},
  trim: () => {},
} as unknown as MMKV;

/**
 * Creates an MMKV instance that is safe for SSR / static web export.
 * During server-side rendering (web export), `window` is undefined and
 * MMKV's web implementation would try to touch `localStorage`, which throws.
 * This helper returns a no-op adapter instead, leaving storage empty for SSR.
 */
export function createSSRSafeMMKV(config: { id: string }): MMKV {
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return SSR_SAFE_MMKV_NOOP;
  }
  return createMMKV(config);
}

export const mmkvStorage = createSSRSafeMMKV({ id: 'maithing-zustand' });

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
