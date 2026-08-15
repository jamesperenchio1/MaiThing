import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Bell } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { FlashList } from '@shopify/flash-list';
import { useNotifications, useMarkNotificationRead } from '@/src/hooks/useNotifications';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import type { Notification } from '@/src/types';

function NotificationCard({
  notification,
  userId,
}: {
  notification: Notification;
  userId: string;
}) {
  const router = useRouter();
  const colors = useThemeColor();
  const markAsRead = useMarkNotificationRead();
  const { i18n } = useTranslation();

  return (
    <PressableScale
      onPress={() => {
        markAsRead.mutate({ userId, notificationId: notification.id });
        const data = notification.data ?? {};
        if (typeof data.orderId === 'string') {
          router.push(`/(customer)/order/${data.orderId}` as any);
        } else if (typeof data.listingId === 'string') {
          router.push(`/(customer)/listing/${data.listingId}` as any);
        } else if (typeof data.merchantId === 'string') {
          router.push(`/(customer)/merchant/${data.merchantId}` as any);
        }
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
              {new Date(notification.createdAt).toLocaleString(i18n.language)}
            </Text>
          </View>
          {!notification.read && <View className="ml-2 h-2.5 w-2.5 rounded-full bg-primary" />}
        </View>
      </Card>
    </PressableScale>
  );
}

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

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  return (
    <Screen scrollable={false} className="bg-background">
      <Header title={t('common.notifications')} />
      {isError || isLoading ? (
        <View className="flex-1 px-6 py-4">
          {isError ? (
            <ErrorState
              title={t('common.error')}
              message="We couldn't load your notifications."
              onRetry={refetch}
              retryLabel={t('common.retry')}
            />
          ) : (
            <>
              <Skeleton width="100%" height={96} className="mb-3 rounded-2xl" />
              <Skeleton width="100%" height={96} className="mb-3 rounded-2xl" />
              <Skeleton width="100%" height={96} className="mb-3 rounded-2xl" />
            </>
          )}
        </View>
      ) : (
        <FlashList
          className="flex-1"
          data={notifications ?? []}
          renderItem={({ item }) => (
            <NotificationCard notification={item} userId={user?.id ?? ''} />
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={96}
          ListEmptyComponent={
            <EmptyState
              icon={<Bell size={32} color={colors.muted} />}
              title="No notifications yet"
              description="We'll notify you about new deals and order updates."
            />
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}
