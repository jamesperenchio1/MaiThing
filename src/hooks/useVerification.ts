import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';

export function useVerifyMerchant(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mockRepositories.merchants.verifyMerchant(merchantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useUploadFoodSafetyCert(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (certUrl: string) =>
      mockRepositories.merchants.uploadFoodSafetyCert(merchantId, certUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}
