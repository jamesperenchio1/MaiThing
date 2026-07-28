import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Image, Alert, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ClipboardList } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/layout/Screen';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { FlashList } from '@shopify/flash-list';
import { useOrders, useUpdateOrderStatus } from '@/src/hooks/useOrders';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { Order } from '@/src/types';

const statusVariantMap: Record<
  Order['status'],
  'default' | 'warning' | 'success' | 'danger' | 'info'
> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  ready: 'success',
  picked_up: 'success',
  completed: 'success',
  cancelled: 'danger',
};

function OrderCard({ order }: { order: Order }) {
  const { t } = useTranslation();
  const updateStatus = useUpdateOrderStatus();

  const nextStatus: Record<Order['status'], Order['status'] | null> = {
    pending: 'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'picked_up',
    picked_up: 'completed',
    completed: null,
    cancelled: null,
  };

  const handleNext = () => {
    const next = nextStatus[order.status];
    if (!next) return;
    const statusLabel = next === 'ready' ? 'ready for pickup' : next.replace(/_/g, ' ');
    Alert.alert('Update order status?', `Mark this order as "${statusLabel}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          updateStatus.mutate({ id: order.id, status: next });
        },
      },
    ]);
  };

  return (
    <Card variant="elevated" className="mb-3">
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text variant="body-sm" className="font-semibold">
            {order.merchantName}
          </Text>
          <Text variant="caption" className="text-muted">
            {new Date(order.createdAt).toLocaleString()}
          </Text>
        </View>
        <Badge variant={statusVariantMap[order.status]}>
          {t(`customer.orders.status.${order.status}`)}
        </Badge>
      </View>

      {order.items.map((item) => (
        <View key={item.listingId} className="mb-2 flex-row items-center">
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              className="mr-3 h-10 w-10 rounded-xl"
              resizeMode="cover"
            />
          )}
          <Text variant="body-sm" className="flex-1 text-muted" numberOfLines={1}>
            {item.quantity}x {item.title}
          </Text>
        </View>
      ))}

      <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
        <Text className="font-semibold">{formatCurrency(order.total)}</Text>
        <Text className="font-mono text-primary">{order.pickupCode}</Text>
      </View>

      {nextStatus[order.status] && (
        <Button size="sm" className="mt-3" onPress={handleNext} loading={updateStatus.isPending}>
          Mark {nextStatus[order.status]}
        </Button>
      )}
    </Card>
  );
}

export default function MerchantOrdersScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const {
    data: orders,
    isLoading,
    isRefetching,
    isError,
    refetch,
    dataUpdatedAt,
  } = useOrders(user?.id ?? '', 'merchant');

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  const listHeader = (
    <View className="pt-4 pb-2">
      <Text testID="orders-title" variant="h1" className="mb-4">
        {t('merchant.orders.title')}
      </Text>
      {lastUpdated && (
        <Text variant="caption" className="mb-2 text-muted">
          Last updated: {lastUpdated}
        </Text>
      )}
    </View>
  );

  return (
    <Screen testID="orders-screen" scrollable={false} className="bg-background">
      {isError || isLoading ? (
        <View className="flex-1 px-6 pb-6">
          {listHeader}
          {isError ? (
            <ErrorState
              title={t('common.error')}
              message="We couldn't load your orders."
              onRetry={refetch}
              retryLabel={t('common.retry')}
            />
          ) : (
            <>
              <Skeleton width="100%" height={180} className="mb-3 rounded-2xl" />
              <Skeleton width="100%" height={180} className="mb-3 rounded-2xl" />
            </>
          )}
        </View>
      ) : (
        <FlashList
          className="flex-1"
          data={orders ?? []}
          renderItem={({ item }) => <OrderCard order={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={168}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              icon={<ClipboardList size={32} color={colors.muted} />}
              title="No orders yet"
              description="Orders will appear here when customers make purchases."
            />
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}
