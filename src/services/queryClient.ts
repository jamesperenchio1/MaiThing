import { QueryClient } from '@tanstack/react-query';
import { persister, dehydrateOptions } from './offlineCache';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24,
      networkMode: 'offlineFirst',
    },
  },
});

export const persistOptions = {
  persister,
  maxAge: 1000 * 60 * 60 * 24,
  dehydrateOptions,
};
