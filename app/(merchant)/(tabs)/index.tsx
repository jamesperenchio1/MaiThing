import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Image, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  TrendingUp,
  Package,
  DollarSign,
  QrCode,
  Star,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Clock,
  AlertTriangle,
  ChevronRight,
  CalendarClock,
  CheckCircle2,
  Minus,
  X,
  MessageSquare,
  Settings,
  Megaphone,
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
import { useMerchantByOwner, useSetStoreClosure } from '@/src/hooks/useMerchants';
import { useMerchantWallet } from '@/src/hooks/usePayouts';
import { useListings } from '@/src/hooks/useListings';
import { useOrders } from '@/src/hooks/useOrders';
import { useConversations } from '@/src/hooks/useMessages';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency, formatPickupWindow, getInitials, formatRelativeTime } from '@/src/lib/utils';
import type { Listing, Order } from '@/src/types';

type MetricKey =
  | 'todayRevenue'
  | 'todayOrders'
  | 'totalItemsSaved'
  | 'totalRevenue'
  | 'conversionRate'
  | 'avgOrderValue';

type ClosureOption = 'tonight' | 'tomorrow' | 'custom';

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

  // Closure sheet state
  const [closureSheetVisible, setClosureSheetVisible] = useState(false);
  const [reopenConfirmVisible, setReopenConfirmVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ClosureOption | null>(null);
  const [customDays, setCustomDays] = useState(1);

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

  const { data: conversations } = useConversations(user?.id ?? '');

  const setStoreClosure = useSetStoreClosure(merchantId, user?.id ?? '');

  const hour = new Date().getHours();
  const firstName = user?.name?.split(' ')[0] ?? 'Partner';

  // Determine closed status
  const isClosed = !!(merchant?.closedUntil && new Date(merchant.closedUntil) > new Date());

  // Compute dates for closure options
  const tonight = new Date();
  tonight.setHours(23, 59, 59, 0);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 0);

  const customDate = new Date();
  customDate.setDate(customDate.getDate() + customDays);
  customDate.setHours(23, 59, 59, 0);

  const closedUntilFormatted = merchant?.closedUntil
    ? `${new Date(merchant.closedUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at midnight`
    : '';

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
    .filter((l) => l.status === 'active' && l.quantityRemaining <= (l.lowStockThreshold ?? 3))
    .sort((a, b) => a.quantityRemaining - b.quantityRemaining)
    .slice(0, 5);

  // Unread conversations for dashboard widget (up to 2 most recent, unread from customer)
  const unreadConversations = (conversations ?? [])
    .filter((c) => !c.read && c.sentBy === 'customer')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);

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

  const handleStatusPillPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isClosed) {
      setReopenConfirmVisible(true);
    } else {
      setSelectedOption(null);
      setCustomDays(1);
      setClosureSheetVisible(true);
    }
  };

  const handleConfirmClosure = () => {
    if (!selectedOption) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let closedUntil: string;
    if (selectedOption === 'tonight') {
      closedUntil = tonight.toISOString();
    } else if (selectedOption === 'tomorrow') {
      closedUntil = tomorrow.toISOString();
    } else {
      closedUntil = customDate.toISOString();
    }
    setStoreClosure.mutate(closedUntil);
    setClosureSheetVisible(false);
  };

  const handleReopen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStoreClosure.mutate(null);
    setReopenConfirmVisible(false);
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
    {
      icon: Megaphone,
      label: t('merchant.dashboard.broadcast'),
      color: colors.foreground,
      bg: 'bg-muted/10',
      route: '/(merchant)/broadcast',
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
          {/* Open/Closed status pill — top left */}
          {merchant && (
            <View className="absolute left-4 top-4 z-10">
              <PressableScale onPress={handleStatusPillPress} scale={0.95}>
                <View
                  className={`flex-row items-center rounded-2xl px-3 py-1.5 ${
                    isClosed ? 'bg-red-500/30' : 'bg-white/10'
                  }`}
                >
                  <View
                    className={`mr-1.5 h-2 w-2 rounded-full ${
                      isClosed ? 'bg-red-400' : 'bg-green-300'
                    }`}
                  />
                  <Text
                    variant="caption"
                    className={`font-semibold ${isClosed ? 'text-red-200' : 'text-white'}`}
                  >
                    {isClosed ? `Closed · ${closedUntilFormatted}` : 'Open'}
                  </Text>
                </View>
              </PressableScale>
            </View>
          )}

          {/* Date chip — top right */}
          <View className="absolute right-4 top-4 bg-white/10 rounded-2xl px-3 py-1.5">
            <Text variant="caption" className="text-white/80 font-medium">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Content — mt-6 clears the absolute-positioned pills row */}
          <Text variant="caption" className="text-white/70 mb-1 mt-6">
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

        {/* Verification progress card — shown when merchant is not yet verified */}
        {merchant && merchant.verificationStatus !== 'verified' && (
          <PressableScale
            scale={0.98}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(merchant)/verification' as any);
            }}
            className="mb-6"
          >
            <Card variant="elevated">
              <View className="flex-row items-center">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <ShieldAlert size={22} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text variant="body-sm" className="font-semibold">
                    Get Verified
                  </Text>
                  {(() => {
                    const completedOrders = merchant.completedOrders ?? 0;
                    const doneCount = [
                      completedOrders >= 10,
                      merchant.rating >= 4.0,
                      (merchant.refundDisputes ?? 0) === 0,
                    ].filter(Boolean).length;
                    return (
                      <View className="mt-1.5 flex-row items-center">
                        {[
                          completedOrders >= 10,
                          merchant.rating >= 4.0,
                          (merchant.refundDisputes ?? 0) === 0,
                        ].map((done, i) => (
                          <View
                            key={i}
                            className={`mr-1 h-2 w-2 rounded-full ${done ? 'bg-primary' : 'bg-muted/30'}`}
                          />
                        ))}
                        <Text variant="caption" className="ml-1.5 text-muted">
                          {doneCount}/3 steps complete
                        </Text>
                      </View>
                    );
                  })()}
                </View>
                <View className="flex-row items-center">
                  <Text variant="caption" className="mr-1 font-semibold text-primary">
                    Get verified →
                  </Text>
                </View>
              </View>
            </Card>
          </PressableScale>
        )}

        {/* Messages preview widget — shown when there are unread conversations */}
        {unreadConversations.length > 0 && (
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <MessageSquare size={16} color={colors.primary} />
                <Text variant="body-sm" className="ml-2 font-semibold text-muted">
                  Unread Messages
                </Text>
              </View>
              <PressableScale
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(merchant)/(tabs)/messages' as any);
                }}
                scale={0.95}
              >
                <Text variant="caption" className="text-primary">
                  {t('common.seeAll')}
                </Text>
              </PressableScale>
            </View>
            {unreadConversations.map((conversation) => (
              <PressableScale
                key={conversation.customerId}
                scale={0.98}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: '/(merchant)/messages/[customerId]',
                    params: { customerId: conversation.customerId },
                  } as any);
                }}
              >
                <Card variant="outlined" className="mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <Text variant="body-sm" className="font-semibold">
                        {conversation.customerName}
                      </Text>
                      <Text variant="caption" className="text-muted mt-0.5" numberOfLines={1}>
                        {conversation.content}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text variant="caption" className="text-muted mb-1">
                        {formatRelativeTime(conversation.createdAt)}
                      </Text>
                      <Text variant="caption" className="text-primary font-semibold">
                        Tap to reply
                      </Text>
                    </View>
                  </View>
                </Card>
              </PressableScale>
            ))}
          </View>
        )}

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
                <Card variant="elevated" className="items-center py-4">
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

        {/* Merchant identity card — tappable to access Settings */}
        {isLoading ? (
          <Skeleton width="100%" height={96} className="mb-6 rounded-3xl" />
        ) : merchant ? (
          <PressableScale
            scale={0.98}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(merchant)/(tabs)/settings' as any);
            }}
            className="mb-6"
          >
            <Card variant="elevated">
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
                  <Text variant="caption" className="mt-1.5 text-muted">
                    Tap to manage settings
                  </Text>
                </View>
                <Settings size={18} color={colors.muted} />
              </View>
            </Card>
          </PressableScale>
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
            icon={<DollarSign size={20} color={colors.primary} />}
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

      {/* ── Closure Duration Bottom Sheet ── */}
      <Modal
        visible={closureSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setClosureSheetVisible(false);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-background px-6 pt-6 pb-10">
            {/* Sheet header */}
            <View className="mb-6 flex-row items-center justify-between">
              <Text variant="h3">Temporarily close your store</Text>
              <PressableScale
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setClosureSheetVisible(false);
                }}
                scale={0.9}
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-muted/10">
                  <X size={18} color={colors.muted} />
                </View>
              </PressableScale>
            </View>

            {/* Option: Tonight */}
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedOption('tonight');
              }}
              scale={0.98}
              className="mb-3"
            >
              <View
                className={`rounded-2xl border p-4 ${
                  selectedOption === 'tonight'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <Text variant="body-sm" className="font-semibold">
                  Tonight
                </Text>
                <Text variant="caption" className="mt-0.5 text-muted">
                  Until today at 11:59 PM
                </Text>
              </View>
            </PressableScale>

            {/* Option: Tomorrow */}
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedOption('tomorrow');
              }}
              scale={0.98}
              className="mb-3"
            >
              <View
                className={`rounded-2xl border p-4 ${
                  selectedOption === 'tomorrow'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <Text variant="body-sm" className="font-semibold">
                  Tomorrow
                </Text>
                <Text variant="caption" className="mt-0.5 text-muted">
                  Until tomorrow at 11:59 PM
                </Text>
              </View>
            </PressableScale>

            {/* Option: Custom date */}
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedOption('custom');
              }}
              scale={0.98}
              className={selectedOption === 'custom' ? 'mb-0' : 'mb-6'}
            >
              <View
                className={`border p-4 ${
                  selectedOption === 'custom'
                    ? 'rounded-t-2xl border-b-0 border-primary bg-primary/5'
                    : 'rounded-2xl border-border bg-card'
                }`}
              >
                <Text variant="body-sm" className="font-semibold">
                  Custom date…
                </Text>
                {selectedOption !== 'custom' && (
                  <Text variant="caption" className="mt-0.5 text-muted">
                    Pick how many days to close
                  </Text>
                )}
              </View>
            </PressableScale>

            {/* Custom day counter (shown below when custom selected) */}
            {selectedOption === 'custom' && (
              <View className="mb-6 rounded-b-2xl border border-t-0 border-primary bg-primary/5 px-4 pb-4 pt-3">
                <View className="flex-row items-center justify-between">
                  <PressableScale
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCustomDays((d) => Math.max(1, d - 1));
                    }}
                    scale={0.9}
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-background">
                      <Minus size={16} color={colors.primary} />
                    </View>
                  </PressableScale>
                  <View className="items-center">
                    <Text variant="body-sm" className="font-semibold">
                      {customDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text variant="caption" className="text-muted">
                      {customDays} day{customDays !== 1 ? 's' : ''} from now
                    </Text>
                  </View>
                  <PressableScale
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCustomDays((d) => Math.min(30, d + 1));
                    }}
                    scale={0.9}
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-background">
                      <Plus size={16} color={colors.primary} />
                    </View>
                  </PressableScale>
                </View>
              </View>
            )}

            {/* Actions */}
            <Button
              variant="primary"
              onPress={handleConfirmClosure}
              disabled={!selectedOption || setStoreClosure.isPending}
              className="mb-2"
            >
              Close Store
            </Button>
            <Button
              variant="ghost"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setClosureSheetVisible(false);
              }}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* ── Reopen Confirmation Modal ── */}
      <Modal
        visible={reopenConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setReopenConfirmVisible(false);
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full rounded-3xl bg-background p-6">
            <Text variant="h3" className="mb-2 text-center">
              Reopen your store?
            </Text>
            <Text variant="body-sm" className="mb-2 text-center text-muted">
              Currently closed until {closedUntilFormatted}.
            </Text>
            <Text variant="body-sm" className="mb-6 text-center text-muted">
              Your store will be visible to customers again immediately.
            </Text>
            <Button
              variant="primary"
              onPress={handleReopen}
              disabled={setStoreClosure.isPending}
              className="mb-2"
            >
              Reopen now
            </Button>
            <Button
              variant="ghost"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setReopenConfirmVisible(false);
              }}
            >
              Keep closed
            </Button>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
