import { useQuery } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';

export function useCustomerImpact(userId?: string) {
  return useQuery({
    queryKey: ['impact', userId],
    queryFn: () => mockRepositories.analytics.getCustomerImpact(userId ?? ''),
    enabled: !!userId,
  });
}
