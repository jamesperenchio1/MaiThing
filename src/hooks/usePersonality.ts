import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: Partial<Omit<UserPersonality, 'userId' | 'createdAt' | 'updatedAt'>>;
    }) => repositories.users.upsertUserPersonality(userId, data),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['user-personality', userId] });
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      merchantId,
      data,
    }: {
      merchantId: string;
      data: Partial<Omit<MerchantPersonality, 'merchantId' | 'createdAt' | 'updatedAt'>>;
    }) => repositories.merchants.upsertMerchantPersonality(merchantId, data),
    onSuccess: (_, { merchantId }) => {
      qc.invalidateQueries({ queryKey: ['merchant-personality', merchantId] });
    },
  });
}
