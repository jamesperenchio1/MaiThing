import { useCallback, useEffect, useState } from 'react';

import { createSSRSafeMMKV } from '@/src/lib/mmkvStorage';

const recentSearchStorage = createSSRSafeMMKV({ id: 'maithing-recent-searches' });

const STORAGE_KEY = 'recent_searches';
const MAX_ITEMS = 8;

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = recentSearchStorage.getString(STORAGE_KEY);
    if (raw) {
      try {
        setRecent(JSON.parse(raw));
      } catch {
        setRecent([]);
      }
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((items: string[]) => {
    setRecent(items);
    recentSearchStorage.set(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      const next = [trimmed, ...recent.filter((q) => q !== trimmed)].slice(0, MAX_ITEMS);
      persist(next);
    },
    [recent, persist]
  );

  const removeSearch = useCallback(
    (query: string) => {
      persist(recent.filter((q) => q !== query));
    },
    [recent, persist]
  );

  const clearSearches = useCallback(() => {
    persist([]);
  }, [persist]);

  return { recent, loaded, addSearch, removeSearch, clearSearches };
}
