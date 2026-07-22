import { useQuery } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';

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

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => mockRepositories.merchants.getCategories(),
  });
}
