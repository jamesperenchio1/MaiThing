import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';

export function useConversations(merchantId: string) {
  return useQuery({
    queryKey: ['conversations', merchantId],
    queryFn: () => mockRepositories.messages.getConversations(merchantId),
    enabled: !!merchantId,
  });
}

export function useMessages(merchantId: string, customerId: string) {
  return useQuery({
    queryKey: ['messages', merchantId, customerId],
    queryFn: () => mockRepositories.messages.getMessages(merchantId, customerId),
    enabled: !!merchantId && !!customerId,
  });
}

export function useSendMessage(merchantId: string, customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      mockRepositories.messages.sendMessage(merchantId, customerId, content, 'merchant'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', merchantId, customerId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', merchantId] });
    },
  });
}

export function useMarkConversationAsRead(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) =>
      mockRepositories.messages.markConversationAsRead(merchantId, customerId),
    onSuccess: (_, customerId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', merchantId, customerId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', merchantId] });
    },
  });
}
