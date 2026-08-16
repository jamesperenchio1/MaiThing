import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import { useOfflineMutation } from './useOfflineMutation';
import type { Listing, ListingTemplate } from '@/src/types';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

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
  sortBy?:
    'distance' | 'price_asc' | 'price_desc' | 'discount' | 'newest' | 'top_rated' | 'going_fast';
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
  return useOfflineMutation({
    mutationFn: (data: Omit<Listing, 'id' | 'createdAt'>) =>
      repositories.listings.createListing(data),
    offlineOperation: {
      type: 'createListing',
      payload: (data) => ({ ...data }),
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['listings'] });
      const previous = queryClient.getQueriesData<Listing[]>({ queryKey: ['listings'] });

      const tempListing: Listing = {
        ...data,
        id: `temp_${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as Listing;

      queryClient.setQueriesData<Listing[]>({ queryKey: ['listings'] }, (old) => {
        if (!old) return old;
        return [tempListing, ...old];
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Listing> }) =>
      repositories.listings.updateListing(id, data),
    offlineOperation: {
      type: 'updateListing',
      payload: ({ id, data }) => ({ id, data }),
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['listings'] });
      await queryClient.cancelQueries({ queryKey: ['listing', id] });

      const previousListings = queryClient.getQueriesData<Listing[]>({ queryKey: ['listings'] });
      const previousListing = queryClient.getQueryData<Listing>(['listing', id]);

      queryClient.setQueriesData<Listing[]>(
        { queryKey: ['listings'] },
        (old): Listing[] | undefined => {
          if (!old) return old;
          return old.map((listing): Listing =>
            listing.id === id ? ({ ...listing, ...data } as Listing) : listing
          );
        }
      );

      queryClient.setQueryData<Listing>(['listing', id], (old): Listing | undefined => {
        if (!old) return old;
        return { ...old, ...data } as Listing;
      });

      return { previous: { listings: previousListings, listing: previousListing } };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        context.previous.listings.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        if (context.previous.listing !== undefined) {
          queryClient.setQueryData(['listing', id], context.previous.listing);
        }
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (id: string) => repositories.listings.deleteListing(id),
    offlineOperation: {
      type: 'deleteListing',
      payload: (id) => ({ id }),
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['listings'] });
      await queryClient.cancelQueries({ queryKey: ['listing', id] });

      const previousListings = queryClient.getQueriesData<Listing[]>({ queryKey: ['listings'] });
      const previousListing = queryClient.getQueryData<Listing>(['listing', id]);

      queryClient.setQueriesData<Listing[]>({ queryKey: ['listings'] }, (old) => {
        if (!old) return old;
        return old.filter((listing) => listing.id !== id);
      });

      queryClient.setQueryData<Listing>(['listing', id], (old) => {
        if (!old) return old;
        return undefined;
      });

      return { previous: { listings: previousListings, listing: previousListing } };
    },
    onError: (_err, id, context) => {
      if (context?.previous) {
        context.previous.listings.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        if (context.previous.listing !== undefined) {
          queryClient.setQueryData(['listing', id], context.previous.listing);
        }
      }
    },
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
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
  return useOfflineMutation({
    mutationFn: (data: Omit<ListingTemplate, 'id' | 'merchantId' | 'createdAt'>) =>
      repositories.listings.createListingTemplate({ ...data, merchantId }),
    offlineOperation: {
      type: 'createListingTemplate',
      payload: (data) => ({ ...data, merchantId }),
    },
    onMutate: async (data) => {
      const queryKey = ['listing-templates', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ListingTemplate[]>(queryKey);

      const tempTemplate: ListingTemplate = {
        ...data,
        id: `temp_${Date.now()}`,
        merchantId,
        createdAt: new Date().toISOString(),
      } as ListingTemplate;

      queryClient.setQueryData<ListingTemplate[]>(queryKey, (old) => {
        if (!old) return [tempTemplate];
        return [tempTemplate, ...old];
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['listing-templates', merchantId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-templates', merchantId] });
    },
  });
}

export function useDeleteListingTemplate() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (id: string) => repositories.listings.deleteListingTemplate(id),
    offlineOperation: {
      type: 'deleteListingTemplate',
      payload: (id) => ({ id }),
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['listing-templates'] });
      const previous = queryClient.getQueriesData<ListingTemplate[]>({
        queryKey: ['listing-templates'],
      });

      queryClient.setQueriesData<ListingTemplate[]>({ queryKey: ['listing-templates'] }, (old) => {
        if (!old) return old;
        return old.filter((template) => template.id !== id);
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-templates'] });
    },
  });
}
