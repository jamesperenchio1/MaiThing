import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { DehydrateOptions } from '@tanstack/react-query';
import superjson from 'superjson';

import { createSSRSafeMMKV } from '@/src/lib/mmkvStorage';

/**
 * MMKV-backed storage for TanStack Query offline cache.
 * Replaces AsyncStorage with MMKV for 10-100x faster reads/writes.
 * Uses the shared SSR-safe helper so static web export does not touch
 * localStorage on the server.
 */
const mmkvQueryCache = createSSRSafeMMKV({ id: 'maithing-query-cache' });

const mmkvStorage = {
  getItem: (key: string): string | null => mmkvQueryCache.getString(key) ?? null,
  setItem: (key: string, value: string): void => {
    mmkvQueryCache.set(key, value);
  },
  removeItem: (key: string): void => {
    mmkvQueryCache.remove(key);
  },
};

export const persister = createSyncStoragePersister({
  storage: mmkvStorage,
  serialize: superjson.stringify,
  deserialize: (data: string) => superjson.parse(data),
});

export const dehydrateOptions: DehydrateOptions = {
  shouldDehydrateQuery: (query) => {
    const queryKey = query.queryKey[0];
    if (queryKey === 'notifications' || queryKey === 'messages') {
      return false;
    }
    return query.state.status === 'success';
  },
};
