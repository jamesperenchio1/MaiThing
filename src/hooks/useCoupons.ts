import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';
import type { Coupon } from '@/src/types';

export function useCoupons(merchantId: string) {
  return useQuery({
    queryKey: ['coupons', merchantId],
    queryFn: () => mockRepositories.coupons.getCoupons(merchantId),
    enabled: !!merchantId,
  });
}

export function useCreateCoupon(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Coupon, 'id' | 'merchantId' | 'usesCount' | 'createdAt'>) =>
      mockRepositories.coupons.createCoupon(merchantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons', merchantId] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coupon> }) =>
      mockRepositories.coupons.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockRepositories.coupons.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}
