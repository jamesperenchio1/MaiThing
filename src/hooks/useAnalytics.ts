import { useQuery } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';

export function useAnalytics(merchantId: string) {
  return useQuery({
    queryKey: ['analytics', merchantId],
    queryFn: () => mockRepositories.analytics.getMerchantAnalytics(merchantId),
    enabled: !!merchantId,
  });
}
