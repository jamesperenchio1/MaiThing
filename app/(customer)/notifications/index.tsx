import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Bell } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useNotifications, useMarkNotificationRead } from '@/src/hooks/useNotifications';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const {
    data: notifications,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useNotifications(user?.id ?? '');
  const colors = useThemeColor();
  const markAsRead = useMarkNotificationRead();

  return (
    <Screen scrollable className="bg-background" refreshing={isRefetching} onRefresh={refetch}>
      <Header title={t('common.notifications')} />
      <View className="px-6 py-4">
        {isLoading ? (
          <Text variant="body" className="text-muted">
            {t('common.loading')}
          </Text>
        ) : isError ? (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your notifications."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        ) : notifications?.length ? (
          notifications.map((notification) => (
            <PressableScale
              key={notification.id}
              onPress={() => {
                markAsRead.mutate({ userId: user?.id ?? '', notificationId: notification.id });
              }}
              scale={0.98}
            >
              <Card
                variant={notification.read ? 'outlined' : 'elevated'}
                className={`mb-3 ${!notification.read ? 'border border-primary/20' : ''}`}
              >
                <View className="flex-row items-start">
                  <View className="mr-3 rounded-full bg-primary/10 p-2">
                    <Bell size={18} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text variant="body-sm" className="mb-1 font-semibold">
                      {notification.title}
                    </Text>
                    <Text variant="body-sm" className="text-muted">
                      {notification.body}
                    </Text>
                    <Text variant="caption" className="mt-2 text-muted">
                      {new Date(notification.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  {!notification.read && (
                    <View className="ml-2 h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </View>
              </Card>
            </PressableScale>
          ))
        ) : (
          <View className="items-center py-12">
            <Bell size={48} color={colors.muted} />
            <Text variant="h3" className="mt-4 text-center">
              No notifications yet
            </Text>
            <Text variant="body" className="text-center text-muted">
              We'll notify you about new deals and order updates.
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
