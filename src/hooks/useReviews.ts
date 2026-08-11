import { useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import { analytics } from '@/src/services/analytics';
import { useOfflineMutation } from './useOfflineMutation';
import type { Review } from '@/src/types';

export function useReviews(merchantId: string) {
  return useQuery({
    queryKey: ['reviews', merchantId],
    queryFn: () => repositories.merchants.getReviews(merchantId),
    enabled: !!merchantId,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (data: Omit<Review, 'id' | 'createdAt' | 'merchantReply' | 'merchantRepliedAt'>) =>
      repositories.merchants.submitReview(data),
    offlineOperation: {
      type: 'submitReview',
      payload: (data) => ({ ...data }),
    },
    onMutate: async (data) => {
      const queryKey = ['reviews', data.merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Review[]>(queryKey);

      const optimisticReview: Review = {
        ...data,
        id: `temp_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Review[]>(queryKey, (old) => {
        if (!old) return [optimisticReview];
        return [...old, optimisticReview];
      });

      return { previous };
    },
    onError: (_err, data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['reviews', data.merchantId], context.previous);
      }
    },
    onSettled: (_data, _err, data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.merchantId] });
      queryClient.invalidateQueries({ queryKey: ['merchant', data.merchantId] });
    },
    onSuccess: (data) => {
      if (!data) return;
      analytics.reviewSubmitted(data.merchantId, data.rating).catch(() => {});
    },
  });
}
