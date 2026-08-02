import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import type { NotificationPreferences } from '@/src/types';

export function useNotifications(userId: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => repositories.notifications.getNotifications(userId),
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, notificationId }: { userId: string; notificationId: string }) =>
      repositories.notifications.markAsRead(userId, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
  return useMutation({
    mutationFn: ({
      userId,
      preferences,
    }: {
      userId: string;
      preferences: NotificationPreferences;
    }) => repositories.users.updateNotificationPreferences(userId, preferences),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile', variables.userId] });
    },
  });
}
