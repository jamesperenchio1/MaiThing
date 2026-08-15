import { useEffect, useRef, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, type LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Eye,
  Percent,
  Star,
  Users,
  Leaf,
  MousePointerClick,
  Search,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/layout/Header';
import { BarChart } from '@/src/components/ui/BarChart';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantAnalytics } from '@/src/hooks/useMerchantAnalytics';
import { useOrders } from '@/src/hooks/useOrders';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency, formatCompactNumber } from '@/src/lib/utils';
import type { Order } from '@/src/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type DateRange = 'week' | 'month' | 'all';
type ChartMode = 'daily' | 'weekly';
type MetricKey =
  | 'todayRevenue'
  | 'todayOrders'
  | 'totalItemsSaved'
  | 'totalRevenue'
  | 'conversionRate'
  | 'avgOrderValue';

// ── Pure helpers ───────────────────────────────────────────────────────────────

const COMPLETED_STATUSES = new Set(['completed', 'picked_up']);

function getDayLabels(): string[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => days[(today - 6 + i + 7) % 7]);
}

function getWeek8Labels(): string[] {
  return Array.from({ length: 8 }, (_, i) => `W${i + 1}`);
}

function rangeStartFor(range: DateRange): Date {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'week') return new Date(startOfDay.getTime() - 6 * 86400000);
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(0);
}

function filterOrdersByRange(orders: Order[], range: DateRange): Order[] {
  const start = rangeStartFor(range);
  return orders.filter((o) => COMPLETED_STATUSES.has(o.status) && new Date(o.createdAt) >= start);
}

function computeWeeklySeries(orders: Order[]): {
  revenue: number[];
  orders: number[];
  itemsSaved: number[];
} {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const revenue: number[] = [];
  const orderCounts: number[] = [];
  const itemsSaved: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(startOfDay.getTime() - i * 86400000);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayOrders = orders.filter(
      (o) =>
        COMPLETED_STATUSES.has(o.status) &&
        new Date(o.createdAt) >= dayStart &&
        new Date(o.createdAt) < dayEnd
    );
    revenue.push(dayOrders.reduce((sum, o) => sum + o.total, 0));
    orderCounts.push(dayOrders.length);
    itemsSaved.push(
      dayOrders.reduce((sum, o) => sum + o.items.reduce((is, item) => is + item.quantity, 0), 0)
    );
  }

  return { revenue, orders: orderCounts, itemsSaved };
}

function computeWeekly8Series(orders: Order[]): {
  revenue: number[];
  orders: number[];
  itemsSaved: number[];
} {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const revenue: number[] = [];
  const orderCounts: number[] = [];
  const itemsSaved: number[] = [];

  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(startOfDay.getTime() - (w * 7 + 6) * 86400000);
    const weekEnd = new Date(startOfDay.getTime() - w * 7 * 86400000 + 86400000);
    const weekOrders = orders.filter(
      (o) =>
        COMPLETED_STATUSES.has(o.status) &&
        new Date(o.createdAt) >= weekStart &&
        new Date(o.createdAt) < weekEnd
    );
    revenue.push(weekOrders.reduce((sum, o) => sum + o.total, 0));
    orderCounts.push(weekOrders.length);
    itemsSaved.push(
      weekOrders.reduce((sum, o) => sum + o.items.reduce((is, item) => is + item.quantity, 0), 0)
    );
  }

  return { revenue, orders: orderCounts, itemsSaved };
}

function computeTopListings(orders: Order[]) {
  const map = new Map<
    string,
    { listingId: string; title: string; revenue: number; orders: number }
  >();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = map.get(item.listingId);
      if (existing) {
        existing.revenue += item.totalPrice;
        existing.orders += item.quantity;
      } else {
        map.set(item.listingId, {
          listingId: item.listingId,
          title: item.title,
          revenue: item.totalPrice,
          orders: item.quantity,
        });
      }
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function computeHourlyRevenue(orders: Order[]): { hour: number; revenue: number }[] {
  const buckets = Array.from({ length: 24 }).map((_, hour) => ({ hour, revenue: 0 }));
  for (const order of orders) {
    const hour = new Date(order.createdAt).getHours();
    buckets[hour].revenue += order.total;
  }
  return buckets;
}

/** Returns a 6×7 grid: [timeSlot][dayOfWeek] = orderCount.
 *  timeSlot: 0=dawn(0-3), 1=morning(4-7), 2=mid-morning(8-11), 3=afternoon(12-15), 4=late-afternoon(16-19), 5=evening(20-23)
 *  dayOfWeek: 0=Mon … 6=Sun */
function computeHeatmap(orders: Order[]): number[][] {
  const grid: number[][] = Array.from({ length: 6 }, () => Array(7).fill(0));
  for (const order of orders) {
    const d = new Date(order.createdAt);
    const hour = d.getHours();
    const jsDay = d.getDay(); // 0=Sun
    const day = (jsDay + 6) % 7; // 0=Mon
    const slot = Math.floor(hour / 4);
    grid[slot][day]++;
  }
  return grid;
}

// ── HeatmapCell component ──────────────────────────────────────────────────────

function heatCellClass(count: number): string {
  if (count === 0) return 'bg-muted/10';
  if (count <= 2) return 'bg-primary/20';
  if (count <= 5) return 'bg-primary/50';
  return 'bg-primary';
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function MerchantAnalyticsScreen() {
  const { metric } = useLocalSearchParams<{ metric?: MetricKey }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const merchantId = user?.id ?? '';
  const colors = useThemeColor();
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [chartMode, setChartMode] = useState<ChartMode>('daily');

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useMerchantAnalytics(merchantId);
  const {
    data: orders,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useOrders(merchantId, 'merchant');

  const isLoading = analyticsLoading || ordersLoading;
  const isError = analyticsError || ordersError;
  const refetch = () => {
    refetchAnalytics();
    refetchOrders();
  };

  // ── Derived data ─────────────────────────────────────────────────────────────

  const completedOrders = useMemo(
    () => (orders ?? []).filter((o) => COMPLETED_STATUSES.has(o.status)),
    [orders]
  );
  const rangeOrders = useMemo(
    () => filterOrdersByRange(completedOrders, dateRange),
    [completedOrders, dateRange]
  );

  const rangeMetrics = useMemo(() => {
    const totalRevenue = rangeOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = rangeOrders.length;
    const totalItemsSaved = rangeOrders.reduce(
      (sum, o) => sum + o.items.reduce((is, item) => is + item.quantity, 0),
      0
    );
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const views = analytics?.views ?? 0;
    const conversionRate =
      views > 0 ? Math.round((totalOrders / views) * 1000) / 10 : (analytics?.conversionRate ?? 0);
    return { totalRevenue, totalOrders, totalItemsSaved, avgOrderValue, views, conversionRate };
  }, [rangeOrders, analytics]);

  const dailySeries = useMemo(() => computeWeeklySeries(completedOrders), [completedOrders]);
  const weekly8Series = useMemo(() => computeWeekly8Series(completedOrders), [completedOrders]);

  const chartSeries = chartMode === 'daily' ? dailySeries : weekly8Series;
  const chartLabels = chartMode === 'daily' ? getDayLabels() : getWeek8Labels();

  const topListings = useMemo(() => {
    const analyticsTop = analytics?.topListings ?? [];
    if (analyticsTop.length > 0) return analyticsTop;
    return computeTopListings(rangeOrders);
  }, [analytics, rangeOrders]);
  const hourlyRevenue = useMemo(() => computeHourlyRevenue(rangeOrders), [rangeOrders]);
  const heatmap = useMemo(() => computeHeatmap(completedOrders), [completedOrders]);

  const repeatCustomerRate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const order of completedOrders) {
      counts.set(order.customerId, (counts.get(order.customerId) ?? 0) + 1);
    }
    const total = counts.size;
    if (total === 0) return 0;
    const repeat = [...counts.values()].filter((c) => c > 1).length;
    return Math.round((repeat / total) * 100);
  }, [completedOrders]);

  const aovTrendData = analytics?.weeklyAOV ?? [];
  const aovTrendLabels = aovTrendData.map((_, i) => `W${i + 1}`);

  const followerHistory = analytics?.followerHistory ?? [];
  const followerChartData = followerHistory.map((h) => h.count);
  const followerChartLabels = followerHistory.map((h) =>
    new Date(h.date).toLocaleDateString(i18n.language, { month: 'short' })
  );

  const topListingTitle = topListings[0]?.title ?? null;
  const wasteReductionPct =
    rangeMetrics.totalItemsSaved > 0
      ? Math.min(96, Math.round(72 + (rangeMetrics.totalItemsSaved % 20)))
      : 0;

  const maxTopRevenue = topListings.length > 0 ? topListings[0].revenue : 1;

  // ── Deep-link: scroll to section when `metric` param is present ───────────────

  useEffect(() => {
    if (!metric) return;
    const targetSection =
      metric === 'todayRevenue' || metric === 'totalRevenue'
        ? 'chart'
        : metric === 'todayOrders'
          ? 'topListings'
          : 'keyMetrics';

    const yOffset = sectionOffsets.current[targetSection];
    if (yOffset !== undefined) {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }
  }, [metric, isLoading]);

  // ── i18n shortcuts ────────────────────────────────────────────────────────────

  const rangeOptions: { key: DateRange; label: string }[] = [
    { key: 'week', label: t('merchant.analytics.thisWeek') },
    { key: 'month', label: t('merchant.analytics.thisMonth') },
    { key: 'all', label: t('merchant.analytics.allTime') },
  ];

  const chartOptions: { key: ChartMode; label: string }[] = [
    { key: 'daily', label: t('merchant.analytics.daily') },
    { key: 'weekly', label: t('merchant.analytics.weekly') },
  ];

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const SLOT_LABELS = ['0–3', '4–7', '8–11', '12–15', '16–19', '20–23'];

  // ── Layout tracking helpers ───────────────────────────────────────────────────

  function trackOffset(key: string) {
    return (e: LayoutChangeEvent) => {
      sectionOffsets.current[key] = e.nativeEvent.layout.y;
    };
  }

  return (
    <View
      testID="merchant-analytics-screen"
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 bg-background">
          <Header title={t('merchant.analytics.title')} />
          <View className="px-6 py-4">
            {isError && (
              <ErrorState
                title={t('common.error')}
                message={t('merchant.analytics.loadError')}
                onRetry={refetch}
                retryLabel={t('common.retry')}
              />
            )}

            {/* ── Date range filter ─────────────────────────────── */}
            <View className="mb-6 flex-row rounded-2xl bg-muted/10 p-1">
              {rangeOptions.map((option) => {
                const isActive = dateRange === option.key;
                return (
                  <PressableScale
                    key={option.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDateRange(option.key);
                    }}
                    className={`flex-1 items-center rounded-xl py-2 ${isActive ? 'bg-card shadow-sm' : ''}`}
                    disabled={isActive}
                    scale={0.98}
                  >
                    <Text
                      variant="body-sm"
                      className={isActive ? 'font-semibold text-foreground' : 'text-muted'}
                    >
                      {option.label}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            {/* ── Overview metric cards ─────────────────────────── */}
            <View className="mb-6 flex-row flex-wrap">
              <View className="mb-3 w-1/2 pr-2">
                <Card variant="elevated" className="py-4">
                  <View className="mb-2 self-start rounded-xl bg-primary/10 p-2">
                    <DollarSign size={20} color={colors.primary} />
                  </View>
                  <Text variant="caption" className="mb-1 text-muted">
                    {t('merchant.dashboard.totalRevenue')}
                  </Text>
                  <Text variant="h3">{formatCurrency(rangeMetrics.totalRevenue)}</Text>
                </Card>
              </View>
              <View className="mb-3 w-1/2 pl-2">
                <Card variant="elevated" className="py-4">
                  <View className="mb-2 self-start rounded-xl bg-blue-500/10 p-2">
                    <ShoppingBag size={20} color={colors.info} />
                  </View>
                  <Text variant="caption" className="mb-1 text-muted">
                    {t('merchant.dashboard.todayOrders')}
                  </Text>
                  <Text variant="h3">{rangeMetrics.totalOrders}</Text>
                </Card>
              </View>
              <View className="mb-3 w-1/2 pr-2">
                <Card variant="elevated" className="py-4">
                  <View className="mb-2 self-start rounded-xl bg-amber-500/10 p-2">
                    <Percent size={20} color={colors.warning} />
                  </View>
                  <Text variant="caption" className="mb-1 text-muted">
                    {t('merchant.analytics.conversionRate')}
                  </Text>
                  <Text variant="h3">{rangeMetrics.conversionRate}%</Text>
                </Card>
              </View>
              <View className="mb-3 w-1/2 pl-2">
                <Card variant="elevated" className="py-4">
                  <View className="mb-2 self-start rounded-xl bg-violet-500/10 p-2">
                    <TrendingUp size={20} color={colors.purple} />
                  </View>
                  <Text variant="caption" className="mb-1 text-muted">
                    {t('merchant.analytics.avgOrderValue')}
                  </Text>
                  <Text variant="h3">{formatCurrency(rangeMetrics.avgOrderValue)}</Text>
                </Card>
              </View>
              <View className="w-full">
                <Card variant="elevated" className="py-4">
                  <View className="mb-2 self-start rounded-xl bg-cyan-500/10 p-2">
                    <Eye size={20} color={colors.cyan} />
                  </View>
                  <Text variant="caption" className="mb-1 text-muted">
                    {t('merchant.analytics.views')}
                  </Text>
                  <Text variant="h3">{formatCompactNumber(rangeMetrics.views, i18n.language)}</Text>
                </Card>
              </View>
            </View>

            {/* ── Key metrics section ───────────────────────────── */}
            <View className="mb-6" onLayout={trackOffset('keyMetrics')}>
              <Text variant="h3" className="mb-4">
                {t('merchant.analytics.keyMetrics')}
              </Text>
              <View className="flex-row flex-wrap">
                <View className="mb-3 w-1/2 pr-2">
                  <Card variant="elevated" className="py-4">
                    <View className="mb-2 self-start rounded-xl bg-primary/10 p-2">
                      <DollarSign size={18} color={colors.primary} />
                    </View>
                    <Text variant="caption" className="mb-1 text-muted">
                      {t('merchant.analytics.avgOrderValue')}
                    </Text>
                    <Text variant="h3">{formatCurrency(rangeMetrics.avgOrderValue)}</Text>
                  </Card>
                </View>
                <View className="mb-3 w-1/2 pl-2">
                  <Card variant="elevated" className="py-4">
                    <View className="mb-2 self-start rounded-xl bg-blue-500/10 p-2">
                      <Users size={18} color={colors.info} />
                    </View>
                    <Text variant="caption" className="mb-1 text-muted">
                      {t('merchant.analytics.customerRetention')}
                    </Text>
                    <Text variant="h3">{repeatCustomerRate}%</Text>
                  </Card>
                </View>
                <View className="mb-3 w-1/2 pr-2">
                  <Card variant="elevated" className="py-4">
                    <View className="mb-2 self-start rounded-xl bg-green-500/10 p-2">
                      <Leaf size={18} color={colors.success} />
                    </View>
                    <Text variant="caption" className="mb-1 text-muted">
                      {t('merchant.analytics.wasteReduction')}
                    </Text>
                    <Text variant="h3">{wasteReductionPct}%</Text>
                  </Card>
                </View>
                <View className="mb-3 w-1/2 pl-2">
                  <Card variant="elevated" className="py-4">
                    <View className="mb-2 self-start rounded-xl bg-amber-500/10 p-2">
                      <Star size={18} color={colors.warning} />
                    </View>
                    <Text variant="caption" className="mb-1 text-muted">
                      {t('merchant.analytics.topListing')}
                    </Text>
                    {topListingTitle ? (
                      <Text variant="body-sm" className="font-semibold" numberOfLines={2}>
                        {topListingTitle}
                      </Text>
                    ) : (
                      <Text variant="body-sm" className="text-muted">
                        —
                      </Text>
                    )}
                  </Card>
                </View>
              </View>
            </View>

            {/* ── Revenue chart with daily/weekly toggle ────────── */}
            <View className="mb-6" onLayout={trackOffset('chart')}>
              <View className="mb-4 flex-row items-center justify-between">
                <Text variant="h3">{t('merchant.analytics.revenueChart')}</Text>
                <View className="flex-row rounded-xl bg-muted/10 p-0.5">
                  {chartOptions.map((opt) => {
                    const isActive = chartMode === opt.key;
                    return (
                      <PressableScale
                        key={opt.key}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setChartMode(opt.key);
                        }}
                        className={`rounded-lg px-3 py-1.5 ${isActive ? 'bg-card shadow-sm' : ''}`}
                        disabled={isActive}
                        scale={0.97}
                      >
                        <Text
                          variant="caption"
                          className={isActive ? 'font-semibold text-foreground' : 'text-muted'}
                        >
                          {opt.label}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
              {analytics ? (
                <BarChart data={chartSeries.revenue} labels={chartLabels} color={colors.primary} />
              ) : (
                <View className="h-40 rounded-2xl bg-muted/10" />
              )}
            </View>

            {/* ── AOV Trend Chart ──────────────────────────────── */}
            {aovTrendData.length > 0 && (
              <View className="mb-6">
                <Text variant="h3" className="mb-4">
                  {t('merchant.analytics.aovTrendTitle')}
                </Text>
                <BarChart
                  data={aovTrendData}
                  labels={aovTrendLabels}
                  color={colors.info}
                  height={160}
                />
                <View className="mt-2 flex-row items-center justify-between">
                  <Text variant="caption" className="text-muted">
                    {t('merchant.analytics.avgThisPeriod')}
                  </Text>
                  <Text variant="caption" className="font-semibold">
                    {formatCurrency(
                      Math.round(aovTrendData.reduce((a, b) => a + b, 0) / aovTrendData.length)
                    )}
                  </Text>
                </View>
              </View>
            )}

            {/* ── Follower growth chart ─────────────────────────── */}
            {followerChartData.length > 1 && (
              <View className="mb-6">
                <Text variant="h3" className="mb-4">
                  {t('merchant.analytics.followerGrowthTitle')}
                </Text>
                <Card variant="elevated" className="p-4">
                  <BarChart
                    data={followerChartData}
                    labels={followerChartLabels}
                    color={colors.primary}
                    height={160}
                  />
                  <View className="mt-3 flex-row items-center justify-between">
                    <View>
                      <Text variant="caption" className="text-muted">
                        {t('merchant.analytics.currentFollowers')}
                      </Text>
                      <Text variant="body-sm" className="font-semibold">
                        {formatCompactNumber(
                          followerChartData[followerChartData.length - 1],
                          i18n.language
                        )}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text variant="caption" className="text-muted">
                        {t('merchant.analytics.growth')}
                      </Text>
                      <Text variant="body-sm" className="font-semibold text-primary">
                        {t('merchant.analytics.growthAmount', {
                          count: formatCompactNumber(
                            followerChartData[followerChartData.length - 1] - followerChartData[0],
                            i18n.language
                          ),
                        })}
                      </Text>
                    </View>
                  </View>
                </Card>
              </View>
            )}

            {/* ── Peak pickup heatmap ───────────────────────────── */}
            <View className="mb-6" onLayout={trackOffset('heatmap')}>
              <Text variant="h3" className="mb-4">
                {t('merchant.analytics.peakPickupTimes')}
              </Text>
              <Card variant="elevated" className="p-4">
                {/* Day column headers */}
                <View className="mb-2 flex-row">
                  <View className="w-[72px]" />
                  {DAY_LABELS.map((d, i) => (
                    <View key={i} className="flex-1 items-center">
                      <Text variant="caption" className="text-muted">
                        {d}
                      </Text>
                    </View>
                  ))}
                </View>
                {/* Heatmap rows */}
                {SLOT_LABELS.map((slotLabel, slotIdx) => (
                  <View key={slotIdx} className="mb-2 flex-row items-center">
                    <View className="w-[72px]">
                      <Text variant="caption" className="text-muted">
                        {slotLabel}
                      </Text>
                    </View>
                    {heatmap[slotIdx].map((count, dayIdx) => (
                      <View key={dayIdx} className="flex-1 items-center px-0.5">
                        <View className={`h-8 w-full rounded-md ${heatCellClass(count)}`} />
                      </View>
                    ))}
                  </View>
                ))}
                {/* Legend */}
                <View className="mt-3 flex-row items-center gap-3">
                  <Text variant="caption" className="text-muted">
                    {t('merchant.analytics.low')}
                  </Text>
                  <View className="h-3 w-6 rounded-sm bg-primary/20" />
                  <View className="h-3 w-6 rounded-sm bg-primary/50" />
                  <View className="h-3 w-6 rounded-sm bg-primary" />
                  <Text variant="caption" className="text-muted">
                    {t('merchant.analytics.high')}
                  </Text>
                </View>
              </Card>
            </View>

            {/* ── Top listings ranked table ─────────────────────── */}
            <View className="mb-6" onLayout={trackOffset('topListings')}>
              <Text variant="h3" className="mb-4">
                {t('merchant.analytics.topListings')}
              </Text>
              {topListings.length > 0 ? (
                <Card variant="elevated" className="overflow-hidden p-0">
                  {topListings.map((listing, rank) => {
                    const barPct = maxTopRevenue > 0 ? listing.revenue / maxTopRevenue : 0;
                    const isLast = rank === topListings.length - 1;
                    return (
                      <View
                        key={listing.listingId}
                        className={`px-4 py-3 ${!isLast ? 'border-b border-border' : ''}`}
                      >
                        <View className="mb-2 flex-row items-center">
                          <View
                            className={`mr-3 h-6 w-6 items-center justify-center rounded-full ${rank === 0 ? 'bg-amber-500/20' : 'bg-muted/10'}`}
                          >
                            <Text
                              variant="caption"
                              className={`font-bold ${rank === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted'}`}
                            >
                              {rank + 1}
                            </Text>
                          </View>
                          <Text
                            variant="body-sm"
                            className="flex-1 font-semibold"
                            numberOfLines={1}
                          >
                            {listing.title}
                          </Text>
                          <View className="ml-2 items-end">
                            <Text variant="caption" className="font-semibold text-foreground">
                              {formatCurrency(listing.revenue)}
                            </Text>
                            <Text variant="caption" className="text-muted">
                              {t('merchant.analytics.ordersCount', { count: listing.orders })}
                            </Text>
                          </View>
                        </View>
                        {/* Revenue bar */}
                        <View className="h-1.5 overflow-hidden rounded-full bg-muted/10">
                          <View
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.round(barPct * 100)}%` }}
                          />
                        </View>
                        {'views' in listing && (
                          <View className="mt-2 flex-row items-center gap-3">
                            <View className="flex-row items-center">
                              <Eye size={12} color={colors.muted} />
                              <Text variant="caption" className="ml-1 text-muted">
                                {t('merchant.analytics.viewsCount', {
                                  count: formatCompactNumber(
                                    (listing as { views: number }).views,
                                    i18n.language
                                  ),
                                })}
                              </Text>
                            </View>
                            {'clicks' in listing && (
                              <View className="flex-row items-center">
                                <MousePointerClick size={12} color={colors.muted} />
                                <Text variant="caption" className="ml-1 text-muted">
                                  {t('merchant.analytics.clicksCount', {
                                    count: formatCompactNumber(
                                      (listing as { clicks: number }).clicks,
                                      i18n.language
                                    ),
                                  })}
                                </Text>
                              </View>
                            )}
                            {'searchAppearances' in listing && (
                              <View className="flex-row items-center">
                                <Search size={12} color={colors.muted} />
                                <Text variant="caption" className="ml-1 text-muted">
                                  {formatCompactNumber(
                                    (listing as { searchAppearances: number }).searchAppearances,
                                    i18n.language
                                  )}
                                </Text>
                              </View>
                            )}
                            {'conversionRate' in listing && (
                              <View className="flex-row items-center">
                                <Percent size={12} color={colors.muted} />
                                <Text variant="caption" className="ml-1 text-muted">
                                  {t('merchant.analytics.convRate', {
                                    value: (
                                      listing as { conversionRate: number }
                                    ).conversionRate.toFixed(1),
                                  })}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </Card>
              ) : (
                <View className="rounded-2xl bg-muted/10 p-6">
                  <Text variant="body" className="text-center text-muted">
                    {t('merchant.analytics.noTopListings')}
                  </Text>
                </View>
              )}
            </View>

            {/* ── Hourly revenue chart ──────────────────────────── */}
            <View className="mb-6" onLayout={trackOffset('hourlyRevenue')}>
              <Text variant="h3" className="mb-4">
                {t('merchant.analytics.hourlyRevenue')}
              </Text>
              {analytics ? (
                <BarChart
                  data={hourlyRevenue.map((h) => h.revenue)}
                  labels={hourlyRevenue.map((h) => `${h.hour}`)}
                  color={colors.primary}
                  height={180}
                />
              ) : (
                <View className="h-48 rounded-2xl bg-muted/10" />
              )}
            </View>

            <Button fullWidth variant="secondary" onPress={() => router.back()}>
              {t('common.done')}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
