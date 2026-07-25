import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'maithing_recent_searches';
const MAX_ITEMS = 8;

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setRecent(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((items: string[]) => {
    setRecent(items);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
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
