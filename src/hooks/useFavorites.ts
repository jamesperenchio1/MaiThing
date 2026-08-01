import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';

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
        await mockRepositories.users.removeMerchantFollowNotification(userId, merchantId);
      } else {
        await mockRepositories.users.addMerchantFollowNotification(userId, merchantId);
      }
      return { merchantId, isFollowing: !isFollowing };
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
