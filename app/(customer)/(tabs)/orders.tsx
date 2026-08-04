import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Image, ScrollView, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Package, SearchX } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/layout/SearchBar';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { FlashList } from '@shopify/flash-list';
import { useOrders } from '@/src/hooks/useOrders';
import { ReviewNudgeBanner } from '@/src/components/composite/ReviewNudgeBanner';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency, formatPickupWindow } from '@/src/lib/utils';
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
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <PressableScale
      onPress={() => router.push(`/(customer)/order/${order.id}` as any)}
      scale={0.98}
    >
      <Card variant="elevated" className="mb-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-2">
            {order.merchantLogoUrl && (
              <Image
                source={{ uri: order.merchantLogoUrl }}
                className="mr-3 h-10 w-10 rounded-xl"
                resizeMode="cover"
              />
            )}
            <View className="flex-1">
              <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
                {order.merchantName}
              </Text>
              <Text variant="caption" className="text-muted">
                {formatPickupWindow(order.pickupWindowStart, order.pickupWindowEnd)}
              </Text>
            </View>
          </View>
          <Badge variant={statusVariantMap[order.status]}>
            {t(`customer.orders.status.${order.status}`)}
          </Badge>
        </View>

        <View className="mb-3">
          {order.items.map((item) => (
            <View key={item.listingId} className="mb-1 flex-row justify-between">
              <Text variant="body-sm" className="flex-1 text-muted" numberOfLines={1}>
                {item.quantity}x {item.title}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-row items-center justify-between border-t border-border pt-3">
          <View className="flex-row items-center">
            <Package size={14} color={colors.muted} className="mr-1.5" />
            <Text variant="caption" className="text-muted">
              {t('customer.orders.pickupCode')}
            </Text>
            <Text className="ml-1.5 font-mono font-semibold text-primary">{order.pickupCode}</Text>
          </View>
          <Text className="font-semibold">{formatCurrency(order.total)}</Text>
        </View>

        {(order.status === 'completed' || order.status === 'picked_up') &&
          order.items.length > 0 && (
            <View className="mt-3 border-t border-border pt-3">
              <Button
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/(customer)/listing/${order.items[0].listingId}`);
                }}
                variant="outline"
                size="sm"
              >
                {t('customer.orders.orderAgain')}
              </Button>
            </View>
          )}
      </Card>
    </PressableScale>
  );
}

type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled';

const ACTIVE_STATUSES = new Set<Order['status']>(['pending', 'confirmed', 'preparing', 'ready']);
const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'completed', 'cancelled'];

export default function OrdersScreen() {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const {
    data: orders,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useOrders(user?.id ?? '', 'customer');

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  const filteredOrders = useMemo(() => {
    let result = orders ?? [];
    if (statusFilter === 'active') {
      result = result.filter((o) => ACTIVE_STATUSES.has(o.status));
    } else if (statusFilter === 'completed') {
      result = result.filter((o) => o.status === 'completed' || o.status === 'picked_up');
    } else if (statusFilter === 'cancelled') {
      result = result.filter((o) => o.status === 'cancelled');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.merchantName.toLowerCase().includes(q) ||
          o.pickupCode.toLowerCase().includes(q) ||
          o.items.some((i) => i.title.toLowerCase().includes(q))
      );
    }
    return result;
  }, [orders, statusFilter, search]);

  const listHeader = (
    <View className="pt-6 pb-2">
      <View className="mb-5 flex-row items-center">
        <View className="flex-1">
          <Text testID="orders-title" variant="h1" className="mb-0.5">
            My Orders
          </Text>
          <Text variant="body-sm" className="text-muted">
            Track your rescues and pickups
          </Text>
        </View>
        {!isLoading && !isError && (
          <View
            className="min-w-[40px] items-center justify-center rounded-full px-3 py-1"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <Text variant="body-sm" className="font-semibold" style={{ color: colors.primary }}>
              {filteredOrders.length}
            </Text>
          </View>
        )}
      </View>

      <SearchBar
        placeholder="Search orders..."
        value={search}
        onChangeText={setSearch}
        onSubmit={setSearch}
        className="mb-3"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 12, gap: 8 }}
      >
        {STATUS_FILTERS.map((filter) => {
          const active = statusFilter === filter;
          return (
            <PressableScale
              key={filter}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStatusFilter(filter);
              }}
              scale={0.94}
            >
              <View
                testID={`orders-filter-${filter}`}
                className="rounded-full px-4 py-2"
                style={{
                  backgroundColor: active ? colors.primary : `${colors.primary}15`,
                }}
              >
                <Text
                  variant="body-sm"
                  className="font-semibold"
                  style={{ color: active ? '#fff' : colors.primary }}
                >
                  {t(`customer.orders.statusFilter.${filter}`)}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      {orders && orders.length > 0 && <ReviewNudgeBanner orders={orders} />}
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
              <Skeleton width="100%" height={168} className="mb-4 rounded-2xl" />
              <Skeleton width="100%" height={168} className="mb-4 rounded-2xl" />
            </>
          )}
        </View>
      ) : (
        <FlashList
          className="flex-1"
          data={filteredOrders}
          renderItem={({ item }) => <OrderCard order={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={168}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              icon={
                search.trim() ? (
                  <SearchX size={32} color={colors.muted} />
                ) : (
                  <Package size={32} color={colors.muted} />
                )
              }
              title={search.trim() ? 'No results found' : 'No orders'}
              description={
                search.trim()
                  ? 'Try a different search term'
                  : statusFilter === 'all'
                    ? 'Your orders will appear here once you place one.'
                    : `No ${t(`customer.orders.statusFilter.${statusFilter}`).toLowerCase()} orders yet.`
              }
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
