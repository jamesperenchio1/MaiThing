import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';
import type { NotificationPreferences } from '@/src/types';

export function useNotifications(userId: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => mockRepositories.notifications.getNotifications(userId),
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, notificationId }: { userId: string; notificationId: string }) =>
      mockRepositories.notifications.markAsRead(userId, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useNotificationPreferences(userId: string) {
  return useQuery({
    queryKey: ['customerProfile', userId],
    queryFn: () => mockRepositories.users.getCustomerProfile(userId),
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
    }) => mockRepositories.users.updateNotificationPreferences(userId, preferences),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile', variables.userId] });
    },
  });
}
