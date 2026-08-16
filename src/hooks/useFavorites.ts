import { useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import { useOfflineMutation } from './useOfflineMutation';
import { useNetworkState } from './useNetworkState';
import { analytics } from '@/src/services/analytics';
import type { CustomerProfile } from '@/src/types';

export function useCustomerProfile(userId: string) {
  return useQuery({
    queryKey: ['customer-profile', userId],
    queryFn: () => repositories.users.getCustomerProfile(userId),
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkState();
  return useOfflineMutation({
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
        await repositories.users.removeFavorite(userId, merchantId);
      } else {
        await repositories.users.addFavorite(userId, merchantId);
      }
      return { merchantId, isFavorite: !isFavorite };
    },
    offlineOperation: {
      type: (vars) => (vars.isFavorite ? 'removeFavorite' : 'addFavorite'),
      payload: ({ userId, merchantId }) => ({ userId, merchantId }),
    },
    onMutate: async ({ userId, merchantId, isFavorite }) => {
      const queryKey = ['customer-profile', userId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CustomerProfile>(queryKey);

      queryClient.setQueryData<CustomerProfile>(queryKey, (old) => {
        if (!old) return old;
        const favorites = new Set(old.favorites);
        if (isFavorite) {
          favorites.delete(merchantId);
        } else {
          favorites.add(merchantId);
        }
        return { ...old, favorites: Array.from(favorites) };
      });

      return { previous };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['customer-profile', userId], context.previous);
      }
    },
    onSuccess: (data, variables) => {
      const merchantId = data?.merchantId ?? variables.merchantId;
      const isFavorite = data?.isFavorite ?? !variables.isFavorite;
      analytics.favoriteToggled(merchantId, isFavorite).catch(() => {});
    },
    onSettled: (_data, _err, { userId }) => {
      // Skip invalidation while offline so the optimistic update survives until
      // the offline queue replays the mutation.
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
      }
    },
  });
}

export function useMerchantFollowNotification(userId: string, merchantId: string) {
  const { data: profile } = useCustomerProfile(userId);
  return (
    profile?.notificationPreferences?.followedMerchantNotifications?.includes(merchantId) ?? false
  );
}

export function useToggleMerchantFollowNotification() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: async ({
      userId,
      merchantId,
      isFollowing,
    }: {
      userId: string;
      merchantId: string;
      isFollowing: boolean;
    }) => {
      if (isFollowing) {
        await repositories.users.removeMerchantFollowNotification(userId, merchantId);
      } else {
        await repositories.users.addMerchantFollowNotification(userId, merchantId);
      }
      return { merchantId, isFollowing: !isFollowing };
    },
    offlineOperation: {
      type: (vars) =>
        vars.isFollowing ? 'removeMerchantFollowNotification' : 'addMerchantFollowNotification',
      payload: ({ userId, merchantId }) => ({ userId, merchantId }),
    },
    onMutate: async ({ userId, merchantId, isFollowing }) => {
      const queryKey = ['customer-profile', userId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CustomerProfile>(queryKey);

      queryClient.setQueryData<CustomerProfile>(queryKey, (old) => {
        if (!old) return old;
        const followed = new Set(old.notificationPreferences.followedMerchantNotifications);
        if (isFollowing) {
          followed.delete(merchantId);
        } else {
          followed.add(merchantId);
        }
        return {
          ...old,
          notificationPreferences: {
            ...old.notificationPreferences,
            followedMerchantNotifications: Array.from(followed),
          },
        };
      });

      return { previous };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['customer-profile', userId], context.previous);
      }
    },
    onSettled: (_data, _err, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
    },
    onSuccess: ({ merchantId, isFollowing }) => {
      analytics.merchantFollowNotificationToggled(merchantId, isFollowing).catch(() => {});
    },
  });
}

export function useRestockAlert(userId: string, listingId: string) {
  const { data: profile } = useCustomerProfile(userId);
  return profile?.restockAlerts?.includes(listingId) ?? false;
}

export function useToggleRestockAlert() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: async ({
      userId,
      listingId,
      isAlerting,
    }: {
      userId: string;
      listingId: string;
      isAlerting: boolean;
    }) => {
      if (isAlerting) {
        await repositories.users.removeRestockAlert(userId, listingId);
      } else {
        await repositories.users.addRestockAlert(userId, listingId);
      }
      return { listingId, isAlerting: !isAlerting };
    },
    offlineOperation: {
      type: (vars) => (vars.isAlerting ? 'removeRestockAlert' : 'addRestockAlert'),
      payload: ({ userId, listingId }) => ({ userId, listingId }),
    },
    onMutate: async ({ userId, listingId, isAlerting }) => {
      const queryKey = ['customer-profile', userId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CustomerProfile>(queryKey);

      queryClient.setQueryData<CustomerProfile>(queryKey, (old) => {
        if (!old) return old;
        const alerts = new Set(old.restockAlerts);
        if (isAlerting) {
          alerts.delete(listingId);
        } else {
          alerts.add(listingId);
        }
        return { ...old, restockAlerts: Array.from(alerts) };
      });

      return { previous };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['customer-profile', userId], context.previous);
      }
    },
    onSettled: (_data, _err, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
    },
  });
}

export function useSavedListings(userId: string) {
  const { data: profile } = useCustomerProfile(userId);
  return profile?.savedListings ?? [];
}

export function useSaveListingToggle() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
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
        await repositories.users.removeSavedListing(userId, listingId);
      } else {
        await repositories.users.addSavedListing(userId, listingId);
      }
      return { listingId, isSaved: !isSaved };
    },
    offlineOperation: {
      type: (vars) => (vars.isSaved ? 'removeSavedListing' : 'addSavedListing'),
      payload: ({ userId, listingId }) => ({ userId, listingId }),
    },
    onMutate: async ({ userId, listingId, isSaved }) => {
      const queryKey = ['customer-profile', userId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CustomerProfile>(queryKey);

      queryClient.setQueryData<CustomerProfile>(queryKey, (old) => {
        if (!old) return old;
        const saved = new Set(old.savedListings);
        if (isSaved) {
          saved.delete(listingId);
        } else {
          saved.add(listingId);
        }
        return { ...old, savedListings: Array.from(saved) };
      });

      return { previous };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['customer-profile', userId], context.previous);
      }
    },
    onSettled: (_data, _err, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
    },
    onSuccess: ({ listingId, isSaved }) => {
      analytics.savedListingToggled(listingId, isSaved).catch(() => {});
    },
  });
}
