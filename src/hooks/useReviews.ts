import { useMutation, useQuery } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';
import type { Review } from '@/src/types';

export function useReviews(merchantId: string) {
  return useQuery({
    queryKey: ['reviews', merchantId],
    queryFn: () => mockRepositories.merchants.getReviews(merchantId),
    enabled: !!merchantId,
  });
}

export function useSubmitReview() {
  return useMutation({
    mutationFn: (data: Omit<Review, 'id' | 'createdAt' | 'merchantReply' | 'merchantRepliedAt'>) =>
      mockRepositories.merchants.submitReview(data),
  });
}
