import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';

export function useCustomerProfile(userId: string) {
  return useQuery({
    queryKey: ['customer-profile', userId],
    queryFn: () => repositories.users.getCustomerProfile(userId),
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
        await repositories.users.removeFavorite(userId, merchantId);
      } else {
        await repositories.users.addFavorite(userId, merchantId);
      }
      return { merchantId, isFavorite: !isFavorite };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
  });
}

export function useMerchantFollowNotification(userId: string, merchantId: string) {
  const { data: profile } = useCustomerProfile(userId);
  return profile?.notificationPreferences?.followedMerchantNotifications?.includes(merchantId) ?? false;
}

export function useToggleMerchantFollowNotification() {
  const queryClient = useQueryClient();
  return useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
  });
}

export function useRestockAlert(userId: string, listingId: string) {
  const { data: profile } = useCustomerProfile(userId);
  return profile?.restockAlerts?.includes(listingId) ?? false;
}

export function useToggleRestockAlert() {
  const queryClient = useQueryClient();
  return useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
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
        await repositories.users.removeSavedListing(userId, listingId);
      } else {
        await repositories.users.addSavedListing(userId, listingId);
      }
      return { listingId, isSaved: !isSaved };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
  });
}
