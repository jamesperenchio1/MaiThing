import { useQuery } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';

export function useMerchantAnalytics(merchantId: string) {
  return useQuery({
    queryKey: ['analytics', merchantId],
    queryFn: () => repositories.analytics.getMerchantAnalytics(merchantId),
    enabled: !!merchantId,
  });
}
