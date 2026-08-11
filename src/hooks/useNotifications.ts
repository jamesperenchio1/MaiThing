import { useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import { useOfflineMutation } from './useOfflineMutation';
import type { CustomerProfile, Notification, NotificationPreferences } from '@/src/types';

export function useNotifications(userId: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => repositories.notifications.getNotifications(userId),
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: ({ userId, notificationId }: { userId: string; notificationId: string }) =>
      repositories.notifications.markAsRead(userId, notificationId),
    offlineOperation: {
      type: 'markAsRead',
      payload: ({ userId, notificationId }) => ({ userId, notificationId }),
    },
    onMutate: async ({ userId, notificationId }) => {
      const queryKey = ['notifications', userId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Notification[]>(queryKey);

      queryClient.setQueryData<Notification[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        );
      });

      return { previous };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', userId], context.previous);
      }
    },
    onSettled: (_data, _err, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
}

export function useNotificationPreferences(userId: string) {
  return useQuery({
    queryKey: ['customerProfile', userId],
    queryFn: () => repositories.users.getCustomerProfile(userId),
    select: (data) => data.notificationPreferences,
    enabled: !!userId,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: ({
      userId,
      preferences,
    }: {
      userId: string;
      preferences: NotificationPreferences;
    }) => repositories.users.updateNotificationPreferences(userId, preferences),
    offlineOperation: {
      type: 'updateNotificationPreferences',
      payload: ({ userId, preferences }) => ({ userId, preferences }),
    },
    onMutate: async ({ userId, preferences }) => {
      const queryKey = ['customerProfile', userId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CustomerProfile>(queryKey);

      queryClient.setQueryData<CustomerProfile>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, notificationPreferences: preferences };
      });

      return { previous };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['customerProfile', userId], context.previous);
      }
    },
    onSettled: (_data, _err, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile', userId] });
    },
  });
}
