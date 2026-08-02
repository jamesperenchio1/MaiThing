import { useMutation, useQuery } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import type { Review } from '@/src/types';

export function useReviews(merchantId: string) {
  return useQuery({
    queryKey: ['reviews', merchantId],
    queryFn: () => repositories.merchants.getReviews(merchantId),
    enabled: !!merchantId,
  });
}

export function useSubmitReview() {
  return useMutation({
    mutationFn: (data: Omit<Review, 'id' | 'createdAt' | 'merchantReply' | 'merchantRepliedAt'>) =>
      repositories.merchants.submitReview(data),
  });
}
