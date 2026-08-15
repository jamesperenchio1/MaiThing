// Manual Jest mock for react-native-mmkv.
//
// MMKV is a native (JSI) module — there's no TurboModule available under the Jest/Node
// test environment, so `createMMKV()` throws if the real module is used. This in-memory
// stand-in implements the subset of the MMKV interface the app actually uses
// (see src/lib/mmkvStorage.ts) so Zustand's `persist` middleware and anything else that
// touches MMKV-backed storage can run under Jest without a native module.
//
// Jest auto-discovers this file because it lives in `__mocks__` adjacent to `node_modules`
// at the project root — no explicit `jest.mock('react-native-mmkv')` call is required.
function createMMKV() {
  const store = new Map();

  return {
    getString: (key) => store.get(key),
    getBoolean: (key) => store.get(key),
    getNumber: (key) => store.get(key),
    set: (key, value) => {
      store.set(key, value);
    },
    delete: (key) => {
      store.delete(key);
    },
    remove: (key) => {
      store.delete(key);
    },
    contains: (key) => store.has(key),
    getAllKeys: () => Array.from(store.keys()),
    clearAll: () => {
      store.clear();
    },
    setAsync: async (key, value) => {
      store.set(key, value);
    },
    getStringAsync: async (key) => store.get(key),
    getBooleanAsync: async (key) => store.get(key),
    getNumberAsync: async (key) => store.get(key),
    addOnValueChangedListener: () => ({ remove: () => {} }),
    recrypt: () => {},
    trim: () => {},
  };
}

module.exports = { createMMKV };
