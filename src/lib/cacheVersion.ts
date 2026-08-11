import { createSSRSafeMMKV } from '@/src/lib/mmkvStorage';

/**
 * Cache Schema Version
 * --------------------
 * Bumps whenever the Supabase schema changes in a way that invalidates
 * persisted TanStack Query cache or offline queue data.
 *
 * On app init, if the stored version does not match CURRENT_CACHE_VERSION,
 * the query cache and offline queue are cleared and the new version is stored.
 */

const cacheVersionStorage = createSSRSafeMMKV({ id: 'maithing-cache-version' });
const CACHE_VERSION_KEY = 'cache_schema_version';

export const CURRENT_CACHE_VERSION = '2';

export function getStoredCacheVersion(): string | null {
  return cacheVersionStorage.getString(CACHE_VERSION_KEY) ?? null;
}

export function setStoredCacheVersion(version: string): void {
  cacheVersionStorage.set(CACHE_VERSION_KEY, version);
}
