import { useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import { useOfflineMutation } from './useOfflineMutation';
import type { MerchantMessage } from '@/src/types';

export function useConversations(merchantId: string) {
  return useQuery({
    queryKey: ['conversations', merchantId],
    queryFn: () => repositories.messages.getConversations(merchantId),
    enabled: !!merchantId,
  });
}

export function useMessages(merchantId: string, customerId: string) {
  return useQuery({
    queryKey: ['messages', merchantId, customerId],
    queryFn: () => repositories.messages.getMessages(merchantId, customerId),
    enabled: !!merchantId && !!customerId,
  });
}

function createOptimisticMessage(
  merchantId: string,
  customerId: string,
  content: string,
  sentBy: 'merchant' | 'customer'
): MerchantMessage {
  return {
    id: `temp_${Date.now()}`,
    merchantId,
    customerId,
    customerName: '',
    content,
    sentBy,
    read: sentBy === 'merchant',
    createdAt: new Date().toISOString(),
  };
}

export function useSendMessage(merchantId: string, customerId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (content: string) =>
      repositories.messages.sendMessage(merchantId, customerId, content, 'merchant'),
    offlineOperation: {
      type: 'sendMessage',
      payload: (content) => ({ merchantId, customerId, content, sentBy: 'merchant' as const }),
    },
    onMutate: async (content) => {
      const messagesKey = ['messages', merchantId, customerId];
      const conversationsKey = ['conversations', merchantId];

      await queryClient.cancelQueries({ queryKey: messagesKey });
      await queryClient.cancelQueries({ queryKey: conversationsKey });

      const previousMessages = queryClient.getQueryData<MerchantMessage[]>(messagesKey);
      const previousConversations = queryClient.getQueryData<MerchantMessage[]>(conversationsKey);

      const optimistic = createOptimisticMessage(merchantId, customerId, content, 'merchant');

      queryClient.setQueryData<MerchantMessage[]>(messagesKey, (old) => {
        if (!old) return [optimistic];
        return [...old, optimistic];
      });

      queryClient.setQueryData<MerchantMessage[]>(conversationsKey, (old) => {
        if (!old) return old;
        return old.map((c) =>
          c.customerId === customerId ? { ...c, content, createdAt: optimistic.createdAt } : c
        );
      });

      return { previousMessages, previousConversations };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', merchantId, customerId], context.previousMessages);
      }
      if (context?.previousConversations) {
        queryClient.setQueryData(['conversations', merchantId], context.previousConversations);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', merchantId, customerId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', merchantId] });
    },
  });
}

export function useSendMessageAsCustomer(merchantId: string, customerId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (content: string) =>
      repositories.messages.sendMessage(merchantId, customerId, content, 'customer'),
    offlineOperation: {
      type: 'sendMessage',
      payload: (content) => ({ merchantId, customerId, content, sentBy: 'customer' as const }),
    },
    onMutate: async (content) => {
      const messagesKey = ['messages', merchantId, customerId];
      const conversationsKey = ['conversations', merchantId];

      await queryClient.cancelQueries({ queryKey: messagesKey });
      await queryClient.cancelQueries({ queryKey: conversationsKey });

      const previousMessages = queryClient.getQueryData<MerchantMessage[]>(messagesKey);
      const previousConversations = queryClient.getQueryData<MerchantMessage[]>(conversationsKey);

      const optimistic = createOptimisticMessage(merchantId, customerId, content, 'customer');

      queryClient.setQueryData<MerchantMessage[]>(messagesKey, (old) => {
        if (!old) return [optimistic];
        return [...old, optimistic];
      });

      queryClient.setQueryData<MerchantMessage[]>(conversationsKey, (old) => {
        if (!old) return old;
        return old.map((c) =>
          c.customerId === customerId ? { ...c, content, createdAt: optimistic.createdAt } : c
        );
      });

      return { previousMessages, previousConversations };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', merchantId, customerId], context.previousMessages);
      }
      if (context?.previousConversations) {
        queryClient.setQueryData(['conversations', merchantId], context.previousConversations);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', merchantId, customerId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', merchantId] });
    },
  });
}

export function useMarkConversationAsRead(merchantId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (customerId: string) =>
      repositories.messages.markConversationAsRead(merchantId, customerId),
    offlineOperation: {
      type: 'markConversationAsRead',
      payload: (customerId) => ({ merchantId, customerId }),
    },
    onMutate: async (customerId) => {
      const messagesKey = ['messages', merchantId, customerId];
      const conversationsKey = ['conversations', merchantId];

      await queryClient.cancelQueries({ queryKey: messagesKey });
      await queryClient.cancelQueries({ queryKey: conversationsKey });

      const previousMessages = queryClient.getQueryData<MerchantMessage[]>(messagesKey);
      const previousConversations = queryClient.getQueryData<MerchantMessage[]>(conversationsKey);

      queryClient.setQueryData<MerchantMessage[]>(messagesKey, (old) => {
        if (!old) return old;
        return old.map((m) => (m.sentBy === 'customer' && !m.read ? { ...m, read: true } : m));
      });

      queryClient.setQueryData<MerchantMessage[]>(conversationsKey, (old) => {
        if (!old) return old;
        return old.map((c) => (c.customerId === customerId ? { ...c, read: true } : c));
      });

      return { previousMessages, previousConversations, customerId };
    },
    onError: (_err, customerId, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', merchantId, customerId], context.previousMessages);
      }
      if (context?.previousConversations) {
        queryClient.setQueryData(['conversations', merchantId], context.previousConversations);
      }
    },
    onSettled: (_data, _err, customerId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', merchantId, customerId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', merchantId] });
    },
  });
}
