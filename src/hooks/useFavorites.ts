import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { mockRepositories } from '@/src/repositories/mock';
import { scheduleLocalNotification } from '@/src/services/notifications';
import type { Merchant } from '@/src/types';

export function useCustomerProfile(userId: string) {
  return useQuery({
    queryKey: ['customer-profile', userId],
    queryFn: () => mockRepositories.users.getCustomerProfile(userId),
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      merchantId,
      isFavorite,
    }: {
      userId: string;
      merchantId: string;
      isFavorite: boolean;
    }) => {
      if (isFavorite) {
        await mockRepositories.users.removeFavorite(userId, merchantId);
      } else {
        await mockRepositories.users.addFavorite(userId, merchantId);
      }
      return { merchantId, isFavorite: !isFavorite };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
      if (!variables.isFavorite && Platform.OS !== 'web') {
        const merchant = queryClient.getQueryData<Merchant>(['merchant', variables.merchantId]);
        const merchantName = merchant?.name ?? 'A merchant you follow';
        setTimeout(() => {
          scheduleLocalNotification(
            `${merchantName} just posted!`,
            "A new listing is available from a merchant you follow. Tap to see what's available."
          );
        }, 2000);
      }
    },
  });
}

export function useSavedListings(userId: string) {
  const { data: profile } = useCustomerProfile(userId);
  return profile?.savedListings ?? [];
}

export function useSaveListingToggle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      listingId,
      isSaved,
    }: {
      userId: string;
      listingId: string;
      isSaved: boolean;
    }) => {
      if (isSaved) {
        await mockRepositories.users.removeSavedListing(userId, listingId);
      } else {
        await mockRepositories.users.addSavedListing(userId, listingId);
      }
      return { listingId, isSaved: !isSaved };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
  });
}
