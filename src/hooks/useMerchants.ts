import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import type {
  BusinessHours,
  Merchant,
  MerchantNotificationPreferences,
  StaffMember,
} from '@/src/types';

export function useMerchants(params?: {
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  query?: string;
}) {
  return useQuery({
    queryKey: ['merchants', params],
    queryFn: () => repositories.merchants.getMerchants(params),
  });
}

export function useMerchant(id: string) {
  return useQuery({
    queryKey: ['merchant', id],
    queryFn: () => repositories.merchants.getMerchant(id),
    enabled: !!id,
  });
}

export function useMerchantByOwner(ownerId: string) {
  return useQuery({
    queryKey: ['merchant', 'owner', ownerId],
    queryFn: () => repositories.merchants.getMerchantByOwnerId(ownerId),
    enabled: !!ownerId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => repositories.merchants.getCategories(),
  });
}

export function useUpdateMerchant(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Merchant>) =>
      repositories.merchants.updateMerchant(merchantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useUpdateBusinessHours(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hours: BusinessHours[]) =>
      repositories.merchants.updateBusinessHours(merchantId, hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useUpdatePickupInstructions(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instructions: string) =>
      repositories.merchants.updatePickupInstructions(merchantId, instructions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useMerchantReviews(merchantId: string) {
  return useQuery({
    queryKey: ['reviews', merchantId],
    queryFn: () => repositories.merchants.getReviews(merchantId),
    enabled: !!merchantId,
  });
}

export function useReplyToReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      repositories.merchants.replyToReview(reviewId, reply),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review', variables.reviewId] });
    },
  });
}

export function useStaff(merchantId: string) {
  return useQuery({
    queryKey: ['staff', merchantId],
    queryFn: () => repositories.merchants.getStaff(merchantId),
    enabled: !!merchantId,
  });
}

export function useAddStaff(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<StaffMember, 'id' | 'merchantId' | 'createdAt'>) =>
      repositories.merchants.addStaff(merchantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', merchantId] });
    },
  });
}

export function useRemoveStaff(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => repositories.merchants.removeStaff(merchantId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', merchantId] });
    },
  });
}

export function useMerchantNotificationPreferences(merchantId: string) {
  return useQuery({
    queryKey: ['merchant-notification-preferences', merchantId],
    queryFn: () => repositories.merchants.getMerchantNotificationPreferences(merchantId),
    enabled: !!merchantId,
  });
}

export function useSetStoreClosure(merchantId: string, ownerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (closedUntil: string | null) =>
      repositories.merchants.setStoreClosure(merchantId, closedUntil),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useUpdateMerchantNotificationPreferences(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: MerchantNotificationPreferences) =>
      repositories.merchants.updateMerchantNotificationPreferences(merchantId, preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['merchant-notification-preferences', merchantId],
      });
    },
  });
}
