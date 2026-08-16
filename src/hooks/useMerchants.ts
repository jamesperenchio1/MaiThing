import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import { useOfflineMutation } from './useOfflineMutation';
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
  return useOfflineMutation({
    mutationFn: (data: Partial<Merchant>) =>
      repositories.merchants.updateMerchant(merchantId, data),
    offlineOperation: {
      type: 'updateMerchant',
      payload: (data) => ({ merchantId, data }),
    },
    onMutate: async (data) => {
      const queryKey = ['merchant', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Merchant>(queryKey);

      queryClient.setQueryData<Merchant>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['merchant', merchantId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useUpdateBusinessHours(merchantId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (hours: BusinessHours[]) =>
      repositories.merchants.updateBusinessHours(merchantId, hours),
    offlineOperation: {
      type: 'updateBusinessHours',
      payload: (hours) => ({ merchantId, hours }),
    },
    onMutate: async (hours) => {
      const queryKey = ['merchant', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Merchant>(queryKey);

      queryClient.setQueryData<Merchant>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, businessHours: hours };
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['merchant', merchantId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useUpdatePickupInstructions(merchantId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (instructions: string) =>
      repositories.merchants.updatePickupInstructions(merchantId, instructions),
    offlineOperation: {
      type: 'updatePickupInstructions',
      payload: (instructions) => ({ merchantId, instructions }),
    },
    onMutate: async (instructions) => {
      const queryKey = ['merchant', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Merchant>(queryKey);

      queryClient.setQueryData<Merchant>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, pickupInstructions: instructions };
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['merchant', merchantId], context.previous);
      }
    },
    onSettled: () => {
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
  return useOfflineMutation({
    mutationFn: (data: Omit<StaffMember, 'id' | 'merchantId' | 'createdAt'>) =>
      repositories.merchants.addStaff(merchantId, data),
    offlineOperation: {
      type: 'addStaff',
      payload: (data) => ({ merchantId, data }),
    },
    onMutate: async (data) => {
      const queryKey = ['staff', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StaffMember[]>(queryKey);

      const optimistic: StaffMember = {
        ...data,
        id: `optimistic-${Date.now()}`,
        merchantId,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<StaffMember[]>(queryKey, (old) => {
        return old ? [...old, optimistic] : [optimistic];
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['staff', merchantId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', merchantId] });
    },
  });
}

export function useUpdateStaff(merchantId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: ({ staffId, data }: { staffId: string; data: Partial<StaffMember> }) =>
      repositories.merchants.updateStaff(merchantId, staffId, data),
    offlineOperation: {
      type: 'updateStaff',
      payload: ({ staffId, data }) => ({ merchantId, staffId, data }),
    },
    onMutate: async ({ staffId, data }) => {
      const queryKey = ['staff', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StaffMember[]>(queryKey);

      queryClient.setQueryData<StaffMember[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((member) => (member.id === staffId ? { ...member, ...data } : member));
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['staff', merchantId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', merchantId] });
    },
  });
}

export function useRemoveStaff(merchantId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (staffId: string) => repositories.merchants.removeStaff(merchantId, staffId),
    offlineOperation: {
      type: 'removeStaff',
      payload: (staffId) => ({ merchantId, staffId }),
    },
    onMutate: async (staffId) => {
      const queryKey = ['staff', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StaffMember[]>(queryKey);

      queryClient.setQueryData<StaffMember[]>(queryKey, (old) => {
        if (!old) return old;
        return old.filter((member) => member.id !== staffId);
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['staff', merchantId], context.previous);
      }
    },
    onSettled: () => {
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
  return useOfflineMutation({
    mutationFn: (closedUntil: string | null) =>
      repositories.merchants.setStoreClosure(merchantId, closedUntil),
    offlineOperation: {
      type: 'setStoreClosure',
      payload: (closedUntil) => ({ merchantId, closedUntil }),
    },
    onMutate: async (closedUntil) => {
      const queryKey = ['merchant', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Merchant>(queryKey);

      queryClient.setQueryData<Merchant>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          closedUntil: closedUntil ?? undefined,
          isOpen: !closedUntil,
        };
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['merchant', merchantId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useUpdateMerchantNotificationPreferences(merchantId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (preferences: MerchantNotificationPreferences) =>
      repositories.merchants.updateMerchantNotificationPreferences(merchantId, preferences),
    offlineOperation: {
      type: 'updateMerchantNotificationPreferences',
      payload: (preferences) => ({ merchantId, preferences }),
    },
    onMutate: async (preferences) => {
      const queryKey = ['merchant-notification-preferences', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MerchantNotificationPreferences>(queryKey);

      queryClient.setQueryData<MerchantNotificationPreferences>(queryKey, (old) => {
        return old ? { ...old, ...preferences } : preferences;
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ['merchant-notification-preferences', merchantId],
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['merchant-notification-preferences', merchantId],
      });
    },
  });
}
