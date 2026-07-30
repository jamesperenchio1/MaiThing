import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';
import type { Listing, ListingTemplate } from '@/src/types';

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
  status?: string;
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

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Listing, 'id' | 'createdAt'>) =>
      mockRepositories.listings.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Listing> }) =>
      mockRepositories.listings.updateListing(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockRepositories.listings.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useListingTemplates(merchantId: string) {
  return useQuery({
    queryKey: ['listing-templates', merchantId],
    queryFn: () => mockRepositories.listings.getListingTemplates(merchantId),
    enabled: !!merchantId,
  });
}

export function useCreateListingTemplate(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ListingTemplate, 'id' | 'merchantId' | 'createdAt'>) =>
      mockRepositories.listings.createListingTemplate({ ...data, merchantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-templates', merchantId] });
    },
  });
}

export function useDeleteListingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockRepositories.listings.deleteListingTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-templates'] });
    },
  });
}
