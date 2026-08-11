import { useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import { useOfflineMutation } from './useOfflineMutation';
import type { MerchantPersonality, UserPersonality } from '@/src/types';

/* ─── User Personality ──────────────────────────────────────────────────── */

export function useUserPersonality(userId: string) {
  return useQuery({
    queryKey: ['user-personality', userId],
    queryFn: () => repositories.users.getUserPersonality(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpsertUserPersonality() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: Partial<Omit<UserPersonality, 'userId' | 'createdAt' | 'updatedAt'>>;
    }) => repositories.users.upsertUserPersonality(userId, data),
    offlineOperation: {
      type: 'upsertUserPersonality',
      payload: ({ userId, data }) => ({ userId, data }),
    },
    onMutate: async ({ userId, data }) => {
      const queryKey = ['user-personality', userId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<UserPersonality>(queryKey);

      queryClient.setQueryData<UserPersonality>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      return { previous };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['user-personality', userId], context.previous);
      }
    },
    onSettled: (_data, _err, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-personality', userId] });
    },
  });
}

/* ─── Merchant Personality ──────────────────────────────────────────────── */

export function useMerchantPersonality(merchantId: string) {
  return useQuery({
    queryKey: ['merchant-personality', merchantId],
    queryFn: () => repositories.merchants.getMerchantPersonality(merchantId),
    enabled: !!merchantId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpsertMerchantPersonality() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: ({
      merchantId,
      data,
    }: {
      merchantId: string;
      data: Partial<Omit<MerchantPersonality, 'merchantId' | 'createdAt' | 'updatedAt'>>;
    }) => repositories.merchants.upsertMerchantPersonality(merchantId, data),
    offlineOperation: {
      type: 'upsertMerchantPersonality',
      payload: ({ merchantId, data }) => ({ merchantId, data }),
    },
    onMutate: async ({ merchantId, data }) => {
      const queryKey = ['merchant-personality', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MerchantPersonality>(queryKey);

      queryClient.setQueryData<MerchantPersonality>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      return { previous };
    },
    onError: (_err, { merchantId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['merchant-personality', merchantId], context.previous);
      }
    },
    onSettled: (_data, _err, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-personality', merchantId] });
    },
  });
}
