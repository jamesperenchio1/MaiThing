import { useQuery } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';

export function useListings(params?: { merchantId?: string; category?: string; query?: string; lat?: number; lng?: number; radius?: number; type?: string }) {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => mockRepositories.listings.getListings(params),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => mockRepositories.listings.getListing(id),
    enabled: !!id,
  });
}
