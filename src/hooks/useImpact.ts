import { useQuery } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';

export function useCustomerImpact(userId?: string) {
  return useQuery({
    queryKey: ['impact', userId],
    queryFn: () => repositories.analytics.getCustomerImpact(userId ?? ''),
    enabled: !!userId,
  });
}
