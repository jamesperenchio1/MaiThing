import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';
import type { BusinessHours, Merchant } from '@/src/types';

export function useMerchants(params?: { lat?: number; lng?: number; radius?: number; category?: string; query?: string }) {
  return useQuery({
    queryKey: ['merchants', params],
    queryFn: () => mockRepositories.merchants.getMerchants(params),
  });
}

export function useMerchant(id: string) {
  return useQuery({
    queryKey: ['merchant', id],
    queryFn: () => mockRepositories.merchants.getMerchant(id),
    enabled: !!id,
  });
}

export function useMerchantByOwner(ownerId: string) {
  return useQuery({
    queryKey: ['merchant', 'owner', ownerId],
    queryFn: () => mockRepositories.merchants.getMerchantByOwnerId(ownerId),
    enabled: !!ownerId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => mockRepositories.merchants.getCategories(),
  });
}

export function useUpdateMerchant(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Merchant>) => mockRepositories.merchants.updateMerchant(merchantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useUpdateBusinessHours(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hours: BusinessHours[]) => mockRepositories.merchants.updateBusinessHours(merchantId, hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useUpdatePickupInstructions(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instructions: string) => mockRepositories.merchants.updatePickupInstructions(merchantId, instructions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}
