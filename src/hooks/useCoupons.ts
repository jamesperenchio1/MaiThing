import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import { useOfflineMutation } from './useOfflineMutation';
import type { Coupon, CouponValidationResult, ListingType } from '@/src/types';
import type { QueryKey } from '@tanstack/react-query';

export function useCoupons(merchantId: string) {
  return useQuery({
    queryKey: ['coupons', merchantId],
    queryFn: () => repositories.coupons.getCoupons(merchantId),
    enabled: !!merchantId,
  });
}

export function useCreateCoupon(merchantId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (data: Omit<Coupon, 'id' | 'merchantId' | 'usesCount' | 'createdAt'>) =>
      repositories.coupons.createCoupon(merchantId, data),
    offlineOperation: {
      type: 'createCoupon',
      payload: (data) => ({ merchantId, ...data }),
    },
    onMutate: async (data) => {
      const queryKey = ['coupons', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Coupon[]>(queryKey);

      const tempCoupon: Coupon = {
        ...data,
        id: `temp_${Date.now()}`,
        merchantId,
        usesCount: 0,
        createdAt: new Date().toISOString(),
      } as Coupon;

      queryClient.setQueryData<Coupon[]>(queryKey, (old) => {
        if (!old) return [tempCoupon];
        return [tempCoupon, ...old];
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['coupons', merchantId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons', merchantId] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coupon> }) =>
      repositories.coupons.updateCoupon(id, data),
    offlineOperation: {
      type: 'updateCoupon',
      payload: ({ id, data }) => ({ id, data }),
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['coupons'] });
      const previous = queryClient.getQueriesData<Coupon[]>({ queryKey: ['coupons'] });

      queryClient.setQueriesData<Coupon[]>({ queryKey: ['coupons'] }, (old) => {
        if (!old) return old;
        return old.map((coupon) => (coupon.id === id ? { ...coupon, ...data } : coupon));
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (id: string) => repositories.coupons.deleteCoupon(id),
    offlineOperation: {
      type: 'deleteCoupon',
      payload: (id) => ({ id }),
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['coupons'] });
      const previous = queryClient.getQueriesData<Coupon[]>({ queryKey: ['coupons'] });

      queryClient.setQueriesData<Coupon[]>({ queryKey: ['coupons'] }, (old) => {
        if (!old) return old;
        return old.filter((coupon) => coupon.id !== id);
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: (input: {
      code: string;
      customerId: string;
      merchantId: string;
      subtotal: number;
      listing: { id: string; category: string; type: ListingType };
    }): Promise<CouponValidationResult> => repositories.coupons.validateCoupon(input),
  });
}
