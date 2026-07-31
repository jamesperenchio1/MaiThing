import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Image, RefreshControl, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ClipboardList, Check, QrCode } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/layout/SearchBar';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { Avatar } from '@/src/components/ui/Avatar';
import { FlashList } from '@shopify/flash-list';
import { useOrders, useUpdateOrderStatus } from '@/src/hooks/useOrders';
import { useMerchantByOwner } from '@/src/hooks/useMerchants';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency, formatPickupWindow } from '@/src/lib/utils';
import { mockRepositories } from '@/src/repositories/mock';
import type { Order, OrderStatus } from '@/src/types';

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

const nextStatusMap: Record<Order['status'], Order['status'] | null> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'picked_up',
  picked_up: 'completed',
  completed: null,
  cancelled: null,
};

const statusFilters: { key: OrderStatus | 'all'; labelKey: string }[] = [
  { key: 'all', labelKey: 'merchant.orders.all' },
  { key: 'pending', labelKey: 'customer.orders.status.pending' },
  { key: 'confirmed', labelKey: 'customer.orders.status.confirmed' },
  { key: 'preparing', labelKey: 'customer.orders.status.preparing' },
  { key: 'ready', labelKey: 'customer.orders.status.ready' },
  { key: 'completed', labelKey: 'customer.orders.status.completed' },
  { key: 'cancelled', labelKey: 'customer.orders.status.cancelled' },
];

function getGroupKey(start: string) {
  const now = Date.now();
  const startTime = new Date(start).getTime();
  const diffHours = (startTime - now) / 3600000;
  if (diffHours <= 1) return 'now';
  if (diffHours <= 3) return 'upcoming';
  return 'later';
}

type ListItem = { type: 'header'; key: string; title: string } | { type: 'order'; order: Order };

function OrderCard({
  order,
  selectionMode = false,
  isSelected = false,
  onSelect,
  onLongPress,
}: {
  order: Order;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onLongPress?: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColor();
  const updateStatus = useUpdateOrderStatus();
  const [confirming, setConfirming] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = nextStatusMap[order.status];

  const handleAdvance = () => {
    if (!next) return;
    if (!confirming) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConfirming(true);
      timeoutRef.current = setTimeout(() => setConfirming(false), 3000);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setConfirming(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      updateStatus.mutate({ id: order.id, status: next });
    }
  };

  const handleOpenDetail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(merchant)/order/[id]' as const, params: { id: order.id } });
  };

  const handlePress = () => {
    if (selectionMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect?.();
    } else {
      handleOpenDetail();
    }
  };

  return (
    <PressableScale
      onPress={handlePress}
      onLongPress={!selectionMode ? onLongPress : undefined}
      scale={0.98}
    >
      <View className={selectionMode ? 'mb-3 flex-row items-center' : ''}>
        {selectionMode && (
          <View className="mr-3 items-center justify-center">
            {isSelected ? (
              <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
                <Check size={14} color={colors.white} />
              </View>
            ) : (
              <View className="h-6 w-6 rounded-full border-2 border-primary" />
            )}
          </View>
        )}
        <View className="flex-1">
          <Card variant="elevated" className={selectionMode ? '' : 'mb-3'}>
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Avatar
                  uri={order.customerAvatarUrl}
                  name={order.customerName ?? t('merchant.orders.customer')}
                  size="sm"
                  className="mr-3"
                />
                <View>
                  <Text variant="body-sm" className="font-semibold">
                    {order.customerName ?? t('merchant.orders.customer')}
                  </Text>
                  <Text variant="caption" className="text-muted">
                    {order.customerPhone ?? order.pickupCode}
                  </Text>
                </View>
              </View>
              <Badge variant={statusVariantMap[order.status]}>
                {t(`customer.orders.status.${order.status}`)}
              </Badge>
            </View>

            {order.items.map((item) => (
              <View key={item.listingId} className="mb-2 flex-row items-center">
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="mr-3 h-10 w-10 rounded-xl"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="mr-3 h-10 w-10 rounded-xl bg-muted/20" />
                )}
                <Text variant="body-sm" className="flex-1 text-muted" numberOfLines={1}>
                  {item.quantity}x {item.title}
                </Text>
              </View>
            ))}

            <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
              <View>
                <Text className="font-semibold">{formatCurrency(order.total)}</Text>
                <Text variant="caption" className="text-muted">
                  {formatPickupWindow(order.pickupWindowStart, order.pickupWindowEnd)}
                </Text>
              </View>
              <Text className="font-mono text-primary">{order.pickupCode}</Text>
            </View>

            {!selectionMode && next && (
              <Button
                size="sm"
                className={confirming ? 'mt-3 bg-primary' : 'mt-3'}
                onPress={handleAdvance}
                loading={updateStatus.isPending}
                leftIcon={confirming ? <Check size={15} color={colors.white} /> : undefined}
              >
                {confirming
                  ? `${t('common.confirm')} → ${t(`customer.orders.status.${next}`)}`
                  : `Mark as ${t(`customer.orders.status.${next}`)}`}
              </Button>
            )}
          </Card>
        </View>
      </View>
    </PressableScale>
  );
}

export default function MerchantOrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [showWebScanner, setShowWebScanner] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: merchant } = useMerchantByOwner(user?.id ?? '');
  const bulkUpdate = useUpdateOrderStatus();

  const {
    data: orders,
    isLoading,
    isRefetching,
    isError,
    refetch,
    dataUpdatedAt,
  } = useOrders(user?.id ?? '', 'merchant');

  const filtered = useMemo(() => {
    const list = orders ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((order) => {
      const matchesQuery =
        !q ||
        order.pickupCode.toLowerCase().includes(q) ||
        (order.customerName?.toLowerCase().includes(q) ?? false);
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'completed'
            ? order.status === 'completed' || order.status === 'picked_up'
            : order.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const groupedData = useMemo<ListItem[]>(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.pickupWindowStart).getTime() - new Date(b.pickupWindowStart).getTime()
    );

    const groups: Record<string, Order[]> = {};
    for (const order of sorted) {
      const key = getGroupKey(order.pickupWindowStart);
      groups[key] ??= [];
      groups[key].push(order);
    }

    const orderKeys: Array<keyof typeof groups> = ['now', 'upcoming', 'later'];
    const groupTitles: Record<string, string> = {
      now: t('merchant.orders.groupNow'),
      upcoming: t('merchant.orders.groupUpcoming'),
      later: t('merchant.orders.groupLater'),
    };

    const result: ListItem[] = [];
    for (const key of orderKeys) {
      const groupOrders = groups[key];
      if (!groupOrders || groupOrders.length === 0) continue;
      result.push({ type: 'header', key: `header-${key}`, title: groupTitles[key] });
      for (const order of groupOrders) {
        result.push({ type: 'order', order });
      }
    }
    return result;
  }, [filtered, t]);

  const stickyHeaderIndices = useMemo(
    () =>
      groupedData.map((item, index) => (item.type === 'header' ? index : -1)).filter((i) => i >= 0),
    [groupedData]
  );

  const selectedOrders = useMemo(
    () => filtered.filter((o) => selectedIds.has(o.id)),
    [filtered, selectedIds]
  );

  const canConfirmAll = selectedOrders.some((o) => o.status === 'pending');
  const canMarkReady = selectedOrders.some(
    (o) => o.status === 'confirmed' || o.status === 'preparing'
  );

  const enterSelectionMode = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) {
          setSelectionMode(false);
          return new Set();
        }
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exitSelectionMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleConfirmAll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toConfirm = selectedOrders.filter((o) => o.status === 'pending');
    await Promise.all(
      toConfirm.map((o) => bulkUpdate.mutateAsync({ id: o.id, status: 'confirmed' }))
    );
    exitSelectionMode();
  };

  const handleMarkReady = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toReady = selectedOrders.filter(
      (o) => o.status === 'confirmed' || o.status === 'preparing'
    );
    await Promise.all(
      toReady.map((o) => bulkUpdate.mutateAsync({ id: o.id, status: 'ready' }))
    );
    exitSelectionMode();
  };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  const handleScanPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS !== 'web') {
      router.push({ pathname: '/(merchant)/scanner' as const });
    } else {
      setShowWebScanner((prev) => !prev);
      setPickupCode('');
      setCodeError(null);
    }
  };

  const handleWebLookup = async () => {
    const code = pickupCode.toUpperCase().trim();
    if (!code || !merchant?.id) return;
    const order = await mockRepositories.orders.getOrderByPickupCode(merchant.id, code);
    if (order) {
      router.push({ pathname: '/(merchant)/order/[id]' as const, params: { id: order.id } });
      setShowWebScanner(false);
    } else {
      setCodeError('Code not found');
      setTimeout(() => setCodeError(null), 3000);
    }
  };

  const listHeader = (
    <View className="pb-2 pt-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text testID="orders-title" variant="h1">
          {t('merchant.orders.title')}
        </Text>
        <PressableScale scale={0.9} onPress={handleScanPress}>
          <QrCode size={22} color={colors.primary} />
        </PressableScale>
      </View>
      {Platform.OS === 'web' && showWebScanner && (
        <View className="mb-4">
          <View className="flex-row gap-2">
            <Input
              value={pickupCode}
              onChangeText={(text) => {
                setPickupCode(text);
                setCodeError(null);
              }}
              placeholder="Enter pickup code"
              maxLength={6}
              autoCapitalize="characters"
              className="flex-1"
            />
            <Button size="sm" onPress={handleWebLookup}>
              Look up
            </Button>
          </View>
          {codeError !== null && (
            <Text variant="caption" className="mt-1 text-destructive">
              {codeError}
            </Text>
          )}
        </View>
      )}
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('merchant.orders.search')}
        className="mb-4"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 24 }}
        className="mb-2"
      >
        {statusFilters.map((filter) => {
          const active = statusFilter === filter.key;
          return (
            <PressableScale
              key={filter.key}
              onPress={() => setStatusFilter(filter.key)}
              scale={0.95}
            >
              <View
                className={`mr-2 rounded-full px-4 py-2 ${active ? 'bg-primary' : 'bg-muted/10'}`}
              >
                <Text
                  variant="body-sm"
                  className={`font-semibold ${active ? 'text-white' : 'text-foreground'}`}
                >
                  {t(filter.labelKey)}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>
      {lastUpdated && (
        <Text variant="caption" className="mb-2 text-muted">
          Last updated: {lastUpdated}
        </Text>
      )}
    </View>
  );

  return (
    <Screen testID="orders-screen" scrollable={false} className="bg-background">
      <View className="flex-1">
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
          <FlashList<ListItem>
            className="flex-1"
            data={groupedData}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <View className="bg-background py-2">
                    <Text variant="label">{item.title}</Text>
                  </View>
                );
              }
              return (
                <OrderCard
                  order={item.order}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(item.order.id)}
                  onSelect={() => toggleSelection(item.order.id)}
                  onLongPress={() => enterSelectionMode(item.order.id)}
                />
              );
            }}
            keyExtractor={(item) => (item.type === 'header' ? item.key : item.order.id)}
            getItemType={(item) => item.type}
            stickyHeaderIndices={stickyHeaderIndices}
            estimatedItemSize={168}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <EmptyState
                icon={<ClipboardList size={32} color={colors.muted} />}
                title={t('merchant.orders.noOrders')}
                description="Orders will appear here when customers make purchases."
              />
            }
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          />
        )}
      </View>
      {selectionMode && selectedIds.size > 0 && (
        <View className="flex-row items-center gap-2 border-t border-border bg-card px-4 py-3">
          <View className="flex-row gap-2">
            {canConfirmAll && (
              <Button size="sm" onPress={handleConfirmAll} loading={bulkUpdate.isPending}>
                Confirm all
              </Button>
            )}
            {canMarkReady && (
              <Button size="sm" onPress={handleMarkReady} loading={bulkUpdate.isPending}>
                Mark ready
              </Button>
            )}
          </View>
          <Text variant="body-sm" className="flex-1 text-center text-muted">
            {selectedIds.size} selected
          </Text>
          <PressableScale onPress={exitSelectionMode} scale={0.95}>
            <Text variant="body-sm" className="font-semibold text-primary">
              Cancel
            </Text>
          </PressableScale>
        </View>
      )}
    </Screen>
  );
}
