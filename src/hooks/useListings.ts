import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import type { Listing, ListingTemplate } from '@/src/types';
import type { QueryClient } from '@tanstack/react-query';

function findListingInCache(queryClient: QueryClient, id: string): Listing | undefined {
  const queries = queryClient.getQueriesData<Listing[]>({ queryKey: ['listings'] });
  for (const [, data] of queries) {
    const found = data?.find((l) => l.id === id);
    if (found) return found;
  }
  return undefined;
}

export interface ListingFilters {
  merchantId?: string;
  category?: string;
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  type?: string;
  sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'discount' | 'newest' | 'top_rated' | 'going_fast';
  dietaryTags?: string[];
  allergens?: string[];
  minPrice?: number;
  maxPrice?: number;
  minMerchantRating?: number;
  status?: string;
}

export function useListings(params?: ListingFilters) {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => repositories.listings.getListings(params),
    placeholderData: keepPreviousData,
  });
}

export function useListing(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => repositories.listings.getListing(id),
    enabled: !!id,
    initialData: () => findListingInCache(queryClient, id),
    initialDataUpdatedAt: 0,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Listing, 'id' | 'createdAt'>) =>
      repositories.listings.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Listing> }) =>
      repositories.listings.updateListing(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.listings.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useListingTemplates(merchantId: string) {
  return useQuery({
    queryKey: ['listing-templates', merchantId],
    queryFn: () => repositories.listings.getListingTemplates(merchantId),
    enabled: !!merchantId,
  });
}

export function useCreateListingTemplate(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ListingTemplate, 'id' | 'merchantId' | 'createdAt'>) =>
      repositories.listings.createListingTemplate({ ...data, merchantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-templates', merchantId] });
    },
  });
}

export function useDeleteListingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.listings.deleteListingTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-templates'] });
    },
  });
}
