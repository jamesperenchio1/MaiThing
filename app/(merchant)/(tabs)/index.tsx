import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus, TrendingUp, Package, QrCode, Megaphone } from 'lucide-react-native';

import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantAnalytics } from '@/src/hooks/useMerchantAnalytics';
import { useMerchantByOwner, useSetStoreClosure } from '@/src/hooks/useMerchants';
import { useMerchantWallet } from '@/src/hooks/usePayouts';
import { useListings } from '@/src/hooks/useListings';
import { useOrders } from '@/src/hooks/useOrders';
import { useConversations } from '@/src/hooks/useMessages';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useNetworkState } from '@/src/hooks/useNetworkState';
import type { Listing, Order, MerchantMessage } from '@/src/types';

import {
  OfflineBanner,
  DashboardHeader,
  VerificationProgressCard,
  MessagesPreviewWidget,
  QuickActionsGrid,
  MerchantIdentityCard,
  DashboardStats,
  RevenueGoalWidget,
  FollowerMilestoneBanner,
  PayoutEstimateCard,
  UpcomingPickups,
  LowStockAlerts,
  ClosureBottomSheet,
  ReopenConfirmSheet,
} from './_components';
import type { QuickAction, ClosureOption } from './_components';

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

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { isOffline } = useNetworkState();
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
  } = useMerchantAnalytics(merchantId);

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
    ? t('merchant.dashboard.atMidnight', {
        date: new Date(merchant.closedUntil).toLocaleDateString(i18n.language, {
          month: 'short',
          day: 'numeric',
        }),
      })
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

  const handleCloseClosureSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setClosureSheetVisible(false);
  };

  const handleCloseReopenSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReopenConfirmVisible(false);
  };

  const handleDecrementCustomDays = () => setCustomDays((d) => Math.max(1, d - 1));
  const handleIncrementCustomDays = () => setCustomDays((d) => Math.min(30, d + 1));

  const handleVerificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(merchant)/verification' });
  };

  const handleMerchantIdentityPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(merchant)/(tabs)/settings' });
  };

  const handleMessagesSeeAll = () => {
    router.push({ pathname: '/(merchant)/(tabs)/messages' });
  };

  const handleConversationPress = (conversation: MerchantMessage) => {
    router.push({
      pathname: '/(merchant)/messages/[customerId]' as const,
      params: { customerId: conversation.customerId },
    });
  };

  const handleQuickActionPress = (route: string) => {
    router.push(route as Parameters<typeof router.push>[0]);
  };

  const handleConversionRatePress = () => {
    const metric: MetricKey = 'conversionRate';
    router.push({
      pathname: '/(merchant)/analytics',
      params: { metric },
    });
  };

  const handleAvgOrderValuePress = () => {
    const metric: MetricKey = 'avgOrderValue';
    router.push({
      pathname: '/(merchant)/analytics',
      params: { metric },
    });
  };

  const handlePayoutPress = () => router.push('/(merchant)/payouts' as any);

  const handleUpcomingPickupsSeeAll = () => router.push('/(merchant)/(tabs)/orders' as any);

  const handleOrderPress = (order: Order) => router.push(`/(merchant)/order/${order.id}` as any);

  const handleOrderScan = (order: Order) =>
    router.push({
      pathname: '/(merchant)/scanner',
      params: { preloadCode: order.pickupCode },
    } as any);

  const handleLowStockSeeAll = () => router.push('/(merchant)/(tabs)/inventory' as any);

  const handleLowStockListingPress = (_listing: Listing) =>
    router.push('/(merchant)/(tabs)/inventory' as any);

  const isRefetching =
    merchantRefetching ||
    analyticsRefetching ||
    ordersRefetching ||
    listingsRefetching ||
    walletRefetching;
  const isLoading = merchantLoading;
  const hasError = merchantError || analyticsError || ordersError || listingsError || walletError;

  const quickActions: QuickAction[] = [
    {
      icon: Plus,
      label: t('merchant.dashboard.createListing'),
      color: colors.primary,
      bg: 'bg-primary/10',
      route: '/(merchant)/listings/new',
      testID: 'create-listing-button',
    },
    {
      icon: QrCode,
      label: t('merchant.dashboard.scanPickup'),
      color: colors.foreground,
      bg: 'bg-muted/10',
      route: '/(merchant)/scanner',
      testID: 'scan-pickup-button',
    },
    {
      icon: Package,
      label: t('merchant.dashboard.manageInventory'),
      color: colors.foreground,
      bg: 'bg-muted/10',
      route: '/(merchant)/(tabs)/inventory',
      testID: 'manage-inventory-button',
    },
    {
      icon: TrendingUp,
      label: t('merchant.dashboard.viewAnalytics'),
      color: colors.foreground,
      bg: 'bg-muted/10',
      route: '/(merchant)/analytics',
      testID: 'view-analytics-button',
    },
    {
      icon: Megaphone,
      label: t('merchant.dashboard.broadcast'),
      color: colors.foreground,
      bg: 'bg-muted/10',
      route: '/(merchant)/broadcast',
      testID: 'broadcast-button',
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
      <Header title={t('merchant.dashboard.title')} />
      <View className="px-6 pt-4 pb-2">
        {/* Offline warning banner */}
        {isOffline && <OfflineBanner />}

        {/* Greeting banner */}
        <DashboardHeader
          merchant={merchant}
          isClosed={isClosed}
          closedUntilFormatted={closedUntilFormatted}
          onStatusPillPress={handleStatusPillPress}
          hour={hour}
          firstName={firstName}
          analytics={analytics}
        />

        {/* Verification progress card — shown when merchant is not yet verified */}
        {merchant && merchant.verificationStatus !== 'verified' && (
          <VerificationProgressCard merchant={merchant} onPress={handleVerificationPress} />
        )}

        {/* Messages preview widget — shown when there are unread conversations */}
        <MessagesPreviewWidget
          conversations={unreadConversations}
          onSeeAll={handleMessagesSeeAll}
          onConversationPress={handleConversationPress}
        />

        {/* Quick Actions Grid */}
        <QuickActionsGrid quickActions={quickActions} onActionPress={handleQuickActionPress} />

        {/* Merchant identity card — tappable to access Settings */}
        <MerchantIdentityCard
          isLoading={isLoading}
          merchant={merchant}
          onPress={handleMerchantIdentityPress}
        />

        {hasError && (
          <ErrorState
            title={t('common.error')}
            message={t('merchant.dashboard.loadError')}
            onRetry={handleRefresh}
            retryLabel={t('common.retry')}
          />
        )}

        <DashboardStats
          analytics={analytics}
          onConversionRatePress={handleConversionRatePress}
          onAvgOrderValuePress={handleAvgOrderValuePress}
        />

        {/* Revenue Goal Widget */}
        <RevenueGoalWidget merchant={merchant} analytics={analytics} />

        {/* Follower Milestone Celebration */}
        <FollowerMilestoneBanner merchant={merchant} />

        {/* Next payout estimate */}
        <PayoutEstimateCard wallet={wallet} onPress={handlePayoutPress} />

        {/* Upcoming pickups */}
        <UpcomingPickups
          actionableOrders={actionableOrders}
          nowOrders={nowOrders}
          upcomingOrders={upcomingOrders}
          onSeeAll={handleUpcomingPickupsSeeAll}
          onOrderPress={handleOrderPress}
          onOrderScan={handleOrderScan}
        />

        {/* Low stock alerts */}
        <LowStockAlerts
          lowStockListings={lowStockListings}
          onSeeAll={handleLowStockSeeAll}
          onListingPress={handleLowStockListingPress}
        />
      </View>

      {/* ── Closure Duration Bottom Sheet ── */}
      <ClosureBottomSheet
        isOpen={closureSheetVisible}
        onClose={handleCloseClosureSheet}
        selectedOption={selectedOption}
        onSelectOption={setSelectedOption}
        customDays={customDays}
        customDate={customDate}
        onDecrementDays={handleDecrementCustomDays}
        onIncrementDays={handleIncrementCustomDays}
        onConfirm={handleConfirmClosure}
        isPending={setStoreClosure.isPending}
      />

      {/* ── Reopen Confirmation Modal ── */}
      <ReopenConfirmSheet
        isOpen={reopenConfirmVisible}
        onClose={handleCloseReopenSheet}
        closedUntilFormatted={closedUntilFormatted}
        onReopen={handleReopen}
        isPending={setStoreClosure.isPending}
      />
    </Screen>
  );
}
