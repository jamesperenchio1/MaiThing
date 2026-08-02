import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';

export function useRecentBroadcasts(merchantId: string) {
  return useQuery({
    queryKey: ['broadcasts', merchantId],
    queryFn: () => repositories.merchants.getRecentBroadcasts(merchantId),
    enabled: !!merchantId,
  });
}

export function useSendBroadcast(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => repositories.merchants.sendBroadcast(merchantId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts', merchantId] });
    },
  });
}
