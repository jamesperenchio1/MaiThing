import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';

export function useRecentBroadcasts(merchantId: string) {
  return useQuery({
    queryKey: ['broadcasts', merchantId],
    queryFn: () => mockRepositories.merchants.getRecentBroadcasts(merchantId),
    enabled: !!merchantId,
  });
}

export function useSendBroadcast(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => mockRepositories.merchants.sendBroadcast(merchantId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts', merchantId] });
    },
  });
}
