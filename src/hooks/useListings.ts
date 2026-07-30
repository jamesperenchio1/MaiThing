import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';

export interface ListingFilters {
  merchantId?: string;
  category?: string;
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  type?: string;
  sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'discount' | 'newest';
  dietaryTags?: string[];
  allergens?: string[];
  maxPrice?: number;
}

export function useListings(params?: ListingFilters) {
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

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/src/types').Listing> }) =>
      mockRepositories.listings.updateListing(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
