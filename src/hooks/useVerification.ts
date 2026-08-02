import { useMutation, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';

export function useVerifyMerchant(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => repositories.merchants.verifyMerchant(merchantId),
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
      repositories.merchants.uploadFoodSafetyCert(merchantId, certUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}
