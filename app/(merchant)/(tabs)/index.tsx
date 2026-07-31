import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  TrendingUp,
  Package,
  DollarSign,
  QrCode,
  Star,
  ShieldCheck,
  Sparkles,
  Clock,
  AlertTriangle,
  ChevronRight,
  CalendarClock,
} from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/layout/Screen';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useAuthStore } from '@/src/stores/auth';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { useMerchantByOwner } from '@/src/hooks/useMerchants';
import { useMerchantWallet } from '@/src/hooks/usePayouts';
import { useListings } from '@/src/hooks/useListings';
import { useOrders } from '@/src/hooks/useOrders';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency, formatPickupWindow, getInitials } from '@/src/lib/utils';
import type { Listing, Order } from '@/src/types';

type MetricKey =
  | 'todayRevenue'
  | 'todayOrders'
  | 'totalItemsSaved'
  | 'totalRevenue'
  | 'conversionRate'
  | 'avgOrderValue';

const ACTIONABLE_STATUSES = new Set<Order['status']>([
  'pending',
  'confirmed',
  'preparing',
  'ready',
]);

function getTimeOfDay(hour: number): string {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function StatCard({
  label,
  value,
  icon,
  iconBg = 'bg-primary/10',
  onPress,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg?: string;
  onPress?: () => void;
}) {
  return (
    <PressableScale onPress={onPress} className="flex-1" scale={0.98} disabled={!onPress}>
      <Card variant="elevated" className="min-h-[120px] justify-between">
        <View className={`mb-2 rounded-xl p-2 self-start ${iconBg}`}>{icon}</View>
        <View>
          <Text variant="caption" className="mb-1 text-muted">
            {label}
          </Text>
          <Text variant="h3">{value}</Text>
        </View>
      </Card>
    </PressableScale>
  );
}

function OrderPickupRow({ order, onPress }: { order: Order; onPress?: () => void }) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <PressableScale key={order.id} onPress={onPress} scale={0.98}>
      <Card variant="outlined" className="mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="mb-1 flex-row items-center">
              <Text variant="body-sm" className="font-semibold">
                {order.customerName ?? order.customerPhone ?? 'Customer'}
              </Text>
              <Text variant="caption" className="ml-2 text-muted">
                · {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
              </Text>
            </View>
            <Text variant="caption" className="text-muted">
              {formatPickupWindow(order.pickupWindowStart, order.pickupWindowEnd)}
            </Text>
          </View>
          <View className="items-end">
            <Badge variant={order.status === 'ready' ? 'success' : 'warning'}>
              {t(`customer.orders.status.${order.status}`)}
            </Badge>
            <Text className="mt-1 font-mono text-primary">{order.pickupCode}</Text>
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}

function LowStockCard({ listing, onPress }: { listing: Listing; onPress?: () => void }) {
  const colors = useThemeColor();

  return (
    <PressableScale key={listing.id} onPress={onPress} scale={0.98}>
      <Card variant="outlined" className="mb-3">
        <View className="flex-row items-center">
          {listing.images[0] ? (
            <Image source={{ uri: listing.images[0] }} className="mr-3 h-12 w-12 rounded-xl" />
          ) : (
            <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-muted/10">
              <Package size={20} color={colors.muted} />
            </View>
          )}
          <View className="flex-1">
            <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
              {listing.title}
            </Text>
            <Text variant="caption" className="text-muted">
              {formatCurrency(listing.salePrice)}
            </Text>
          </View>
          <Badge variant="danger">{listing.quantityRemaining} left</Badge>
        </View>
      </Card>
    </PressableScale>
  );
}

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();

  const {
    data: merchant,
    isLoading: merchantLoading,
    isRefetching: merchantRefetching,
    isError: merchantError,
    refetch: refetchMerchant,
  } = useMerchantByOwner(user?.id ?? '');

  const merchantId = merchant?.id ?? '';

  const {
    data: analytics,
    isRefetching: analyticsRefetching,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useAnalytics(merchantId);

  const {
    data: orders,
    isRefetching: ordersRefetching,
    isError: ordersError,
    refetch: refetchOrders,
  } = useOrders(user?.id ?? '', 'merchant');

  const {
    data: listings,
    isRefetching: listingsRefetching,
    isError: listingsError,
    refetch: refetchListings,
  } = useListings({ merchantId });

  const {
    data: wallet,
    isRefetching: walletRefetching,
    isError: walletError,
    refetch: refetchWallet,
  } = useMerchantWallet(merchantId);

  const hour = new Date().getHours();
  const firstName = user?.name?.split(' ')[0] ?? 'Partner';

  const actionableOrders = (orders ?? [])
    .filter((o) => ACTIONABLE_STATUSES.has(o.status))
    .sort(
      (a, b) => new Date(a.pickupWindowStart).getTime() - new Date(b.pickupWindowStart).getTime()
    )
    .slice(0, 5);

  const now = Date.now();
  const nowOrders = actionableOrders.filter(
    (o) =>
      new Date(o.pickupWindowStart).getTime() <= now && new Date(o.pickupWindowEnd).getTime() >= now
  );
  const upcomingOrders = actionableOrders.filter(
    (o) => new Date(o.pickupWindowStart).getTime() > now
  );

  const lowStockListings = (listings ?? [])
    .filter((l) => l.status === 'active' && l.quantityRemaining <= 3)
    .sort((a, b) => a.quantityRemaining - b.quantityRemaining)
    .slice(0, 5);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Promise.all([
      refetchMerchant(),
      refetchAnalytics(),
      refetchOrders(),
      refetchListings(),
      refetchWallet(),
    ]);
  };

  const isRefetching =
    merchantRefetching ||
    analyticsRefetching ||
    ordersRefetching ||
    listingsRefetching ||
    walletRefetching;
  const isLoading = merchantLoading;
  const hasError = merchantError || analyticsError || ordersError || listingsError || walletError;

  const quickActions = [
    {
      icon: Plus,
      label: t('merchant.dashboard.createListing'),
      color: colors.primary,
      bg: 'bg-primary/10',
      route: '/(merchant)/listings/new',
    },
    {
      icon: QrCode,
      label: t('merchant.dashboard.scanPickup'),
      color: colors.foreground,
      bg: 'bg-muted/10',
      route: '/(merchant)/scanner',
    },
    {
      icon: Package,
      label: t('merchant.dashboard.manageInventory'),
      color: colors.foreground,
      bg: 'bg-muted/10',
      route: '/(merchant)/(tabs)/inventory',
    },
    {
      icon: TrendingUp,
      label: t('merchant.dashboard.viewAnalytics'),
      color: colors.foreground,
      bg: 'bg-muted/10',
      route: '/(merchant)/analytics',
    },
  ];

  return (
    <Screen
      testID="merchant-dashboard-screen"
      scrollable
      className="bg-background"
      refreshing={isRefetching}
      onRefresh={handleRefresh}
    >
      <View className="px-6 pt-4 pb-2">
        {/* Greeting banner */}
        <View className="mb-6 rounded-3xl bg-primary p-5 overflow-hidden">
          <View className="absolute right-4 top-4 bg-white/10 rounded-2xl px-3 py-1.5">
            <Text variant="caption" className="text-white/80 font-medium">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <Text variant="caption" className="text-white/70 mb-1">
            {t('merchant.dashboard.greeting', { timeOfDay: getTimeOfDay(hour), name: firstName })}
          </Text>
          <Text variant="h2" className="text-white mb-4">
            {formatCurrency(analytics?.todayRevenue ?? 0)}
          </Text>
          <View className="flex-row space-x-4">
            <View>
              <Text variant="caption" className="text-white/60">
                {t('merchant.dashboard.todayOrders')}
              </Text>
              <Text variant="h4" className="text-white">
                {analytics?.todayOrders ?? 0}
              </Text>
            </View>
            <View className="w-px bg-white/20" />
            <View>
              <Text variant="caption" className="text-white/60">
                {t('merchant.dashboard.itemsSaved')}
              </Text>
              <Text variant="h4" className="text-white">
                {analytics?.totalItemsSaved ?? 0}
              </Text>
            </View>
            <View className="w-px bg-white/20" />
            <View>
              <Text variant="caption" className="text-white/60">
                {t('merchant.dashboard.totalRevenue')}
              </Text>
              <Text variant="h4" className="text-white">
                {formatCurrency(analytics?.totalRevenue ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View className="mb-6">
          <Text variant="body-sm" className="mb-3 font-semibold text-muted">
            {t('merchant.dashboard.quickActions')}
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {quickActions.map(({ icon: Icon, label, color, bg, route }) => (
              <PressableScale
                key={label}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(route as Parameters<typeof router.push>[0]);
                }}
                scale={0.95}
                style={{ width: '47%' }}
              >
                <Card variant="elevated" className="items-center py-5">
                  <View className={`rounded-2xl p-3 mb-2 ${bg}`}>
                    <Icon size={22} color={color} />
                  </View>
                  <Text variant="body-sm" className="font-medium text-center">
                    {label}
                  </Text>
                </Card>
              </PressableScale>
            ))}
          </View>
        </View>

        {/* Merchant identity card */}
        {isLoading ? (
          <Skeleton width="100%" height={96} className="mb-6 rounded-3xl" />
        ) : merchant ? (
          <Card variant="elevated" className="mb-6">
            <View className="flex-row items-center">
              {merchant.logoUrl ? (
                <Image source={{ uri: merchant.logoUrl }} className="mr-4 h-14 w-14 rounded-2xl" />
              ) : (
                <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Text className="text-lg font-bold text-primary">
                    {getInitials(merchant.name)}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <Text variant="h3" numberOfLines={1}>
                  {merchant.name}
                </Text>
                <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
                  {merchant.isVerified && (
                    <Badge variant="success">
                      <View className="flex-row items-center">
                        <ShieldCheck size={12} color={colors.success} />
                        <Text className="ml-1 text-xs font-semibold text-green-800">
                          {t('merchant.dashboard.verified')}
                        </Text>
                      </View>
                    </Badge>
                  )}
                  <Badge variant="default">
                    <View className="flex-row items-center">
                      <Star size={12} color={colors.primary} />
                      <Text className="ml-1 text-xs font-semibold text-primary">
                        {merchant.rating.toFixed(1)}
                      </Text>
                    </View>
                  </Badge>
                  {merchant.hygieneRating && (
                    <Badge variant="default">
                      <View className="flex-row items-center">
                        <Sparkles size={12} color={colors.primary} />
                        <Text className="ml-1 text-xs font-semibold text-primary">
                          {t('merchant.dashboard.hygieneRated', { rating: merchant.hygieneRating })}
                        </Text>
                      </View>
                    </Badge>
                  )}
                </View>
              </View>
            </View>
          </Card>
        ) : null}

        {hasError && (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your dashboard."
            onRetry={handleRefresh}
            retryLabel={t('common.retry')}
          />
        )}

        <View testID="merchant-stats-row-1" className="mb-6 flex-row space-x-3">
          <StatCard
            label={t('merchant.dashboard.conversionRate')}
            value={`${Math.round(analytics?.conversionRate ?? 0)}%`}
            icon={<TrendingUp size={20} color={colors.success} />}
            iconBg="bg-green-500/10"
            onPress={() => {
              const metric: MetricKey = 'conversionRate';
              router.push({
                pathname: '/(merchant)/analytics',
                params: { metric },
              });
            }}
          />
          <StatCard
            label={t('merchant.dashboard.avgOrderValue')}
            value={formatCurrency(analytics?.avgOrderValue ?? 0)}
            icon={<DollarSign size={20} color={colors.info} />}
            iconBg="bg-blue-500/10"
            onPress={() => {
              const metric: MetricKey = 'avgOrderValue';
              router.push({
                pathname: '/(merchant)/analytics',
                params: { metric },
              });
            }}
          />
        </View>

        {/* Next payout estimate */}
        <Card variant="elevated" className="mb-6">
          <PressableScale onPress={() => router.push('/(merchant)/payouts' as any)} scale={0.98}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 rounded-xl bg-primary/10 p-2.5">
                  <CalendarClock size={22} color={colors.primary} />
                </View>
                <View>
                  <Text variant="body-sm" className="text-muted">
                    {t('merchant.dashboard.payoutEstimate')}
                  </Text>
                  <Text variant="h3">
                    {wallet ? formatCurrency(wallet.pendingPayout) : formatCurrency(0)}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.muted} />
            </View>
            {wallet?.nextPayoutDate && (
              <Text variant="caption" className="mt-2 text-muted">
                Next payout{' '}
                {new Date(wallet.nextPayoutDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            )}
          </PressableScale>
        </Card>

        {/* Upcoming pickups */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="body-sm" className="font-semibold text-muted">
              {t('merchant.dashboard.upcomingPickups')}
            </Text>
            <PressableScale
              onPress={() => router.push('/(merchant)/(tabs)/orders' as any)}
              scale={0.95}
            >
              <Text variant="caption" className="text-primary">
                {t('common.seeAll')}
              </Text>
            </PressableScale>
          </View>

          {actionableOrders.length === 0 ? (
            <EmptyState
              icon={<Clock size={32} color={colors.muted} />}
              title={t('merchant.dashboard.noUpcomingPickups')}
              description="New orders will appear here when customers make purchases."
            />
          ) : (
            <>
              {nowOrders.length > 0 && (
                <View className="mb-3">
                  <Text
                    variant="caption"
                    className="mb-2 font-semibold uppercase tracking-wider text-muted"
                  >
                    {t('merchant.orders.groupNow')}
                  </Text>
                  {nowOrders.map((order) => (
                    <OrderPickupRow
                      key={order.id}
                      order={order}
                      onPress={() => router.push(`/(merchant)/order/${order.id}` as any)}
                    />
                  ))}
                </View>
              )}
              {upcomingOrders.length > 0 && (
                <View>
                  <Text
                    variant="caption"
                    className="mb-2 font-semibold uppercase tracking-wider text-muted"
                  >
                    {t('merchant.orders.groupUpcoming')}
                  </Text>
                  {upcomingOrders.map((order) => (
                    <OrderPickupRow
                      key={order.id}
                      order={order}
                      onPress={() => router.push(`/(merchant)/order/${order.id}` as any)}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Low stock alerts */}
        {lowStockListings.length > 0 && (
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <AlertTriangle size={16} color={colors.danger} />
                <Text variant="body-sm" className="ml-2 font-semibold text-muted">
                  {t('merchant.dashboard.lowStockAlerts')}
                </Text>
              </View>
              <PressableScale
                onPress={() => router.push('/(merchant)/(tabs)/inventory' as any)}
                scale={0.95}
              >
                <Text variant="caption" className="text-primary">
                  {t('common.seeAll')}
                </Text>
              </PressableScale>
            </View>
            {lowStockListings.map((listing) => (
              <LowStockCard
                key={listing.id}
                listing={listing}
                onPress={() => router.push('/(merchant)/(tabs)/inventory' as any)}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
