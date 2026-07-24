import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image } from 'react-native';
import { ChevronRight, Package } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/layout/SearchBar';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useOrders } from '@/src/hooks/useOrders';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { Order } from '@/src/types';

const statusVariantMap: Record<Order['status'], 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
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
              <Image source={{ uri: order.merchantLogoUrl }} className="mr-3 h-10 w-10 rounded-xl" />
            )}
            <View className="flex-1">
              <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
                {order.merchantName}
              </Text>
              <Text variant="caption" className="text-muted">
                {new Date(order.createdAt).toLocaleDateString()}
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
      </Card>
    </PressableScale>
  );
}

export default function OrdersScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [search, setSearch] = useState('');
  const { data: orders, isLoading } = useOrders(user?.id ?? '', 'customer');

  const activeStatuses: Order['status'][] = ['pending', 'confirmed', 'preparing', 'ready'];
  const tabOrders =
    tab === 'active'
      ? orders?.filter((o) => activeStatuses.includes(o.status))
      : orders?.filter((o) => !activeStatuses.includes(o.status));

  const filteredOrders = search.trim()
    ? tabOrders?.filter(
        (o) =>
          o.merchantName.toLowerCase().includes(search.toLowerCase()) ||
          o.pickupCode.toLowerCase().includes(search.toLowerCase()) ||
          o.items.some((i) => i.title.toLowerCase().includes(search.toLowerCase()))
      )
    : tabOrders;

  return (
    <Screen testID="orders-screen" scrollable className="bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text testID="orders-title" variant="h1" className="mb-4">
          {t('common.orders')}
        </Text>

        <SearchBar
          placeholder="Search orders..."
          value={search}
          onChangeText={setSearch}
          onSubmit={setSearch}
          className="mb-4"
        />

        <View testID="orders-tabs" className="mb-4 flex-row rounded-2xl bg-muted/10 p-1">
          {(['active', 'history'] as const).map((tabKey) => (
            <PressableScale
              key={tabKey}
              testID={`${tabKey}-orders-tab`}
              onPress={() => setTab(tabKey)}
              className={`flex-1 items-center rounded-xl py-3 ${tab === tabKey ? 'bg-primary' : ''}`}
              scale={0.98}
            >
              <Text
                variant="body-sm"
                className={`text-center font-semibold ${tab === tabKey ? 'text-white' : 'text-muted'}`}
              >
                {tabKey === 'active' ? t('customer.orders.active') : t('customer.orders.history')}
              </Text>
            </PressableScale>
          ))}
        </View>
      </View>

      <View className="px-6 pb-6">
        {isLoading ? (
          <Text variant="body" className="text-muted">
            {t('common.loading')}
          </Text>
        ) : filteredOrders?.length ? (
          filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
        ) : (
          <View className="items-center py-12">
            <Text variant="h3" className="mb-2 text-center">
              {search.trim() ? 'No results found' : `No ${tab} orders`}
            </Text>
            <Text variant="body" className="text-center text-muted">
              {search.trim()
                ? 'Try a different search term'
                : tab === 'active'
                  ? 'You have no active orders right now.'
                  : 'Your completed and cancelled orders will appear here.'}
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
