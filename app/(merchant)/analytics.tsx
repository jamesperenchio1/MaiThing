import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Eye,
  Percent,
  Star,
} from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { BarChart } from '@/src/components/ui/BarChart';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { useOrders } from '@/src/hooks/useOrders';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { Order, MerchantAnalytics } from '@/src/types';

type DateRange = 'week' | 'month' | 'all';
type MetricKey = 'todayRevenue' | 'todayOrders' | 'totalItemsSaved' | 'totalRevenue';

interface MetricConfig {
  key: Exclude<MetricKey, 'totalRevenue'>;
  label: string;
  value: string;
  icon: React.ReactNode;
}

const COMPLETED_STATUSES = new Set(['completed', 'picked_up']);

function getDayLabels(): string[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => days[(today - 6 + i + 7) % 7]);
}

function rangeStartFor(range: DateRange): Date {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'week') {
    return new Date(startOfDay.getTime() - 6 * 86400000);
  }
  if (range === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
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

export default function MerchantAnalyticsScreen() {
  const { metric } = useLocalSearchParams<{ metric?: MetricKey }>();
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const merchantId = user?.id ?? '';
  const colors = useThemeColor();
  const [dateRange, setDateRange] = useState<DateRange>('week');

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useAnalytics(merchantId);
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
    return {
      totalRevenue,
      totalOrders,
      totalItemsSaved,
      avgOrderValue,
      views,
      conversionRate,
    };
  }, [rangeOrders, analytics]);

  const weeklySeries = useMemo(
    () => computeWeeklySeries(dateRange === 'week' ? rangeOrders : completedOrders),
    [rangeOrders, completedOrders, dateRange]
  );
  const topListings = useMemo(() => computeTopListings(rangeOrders), [rangeOrders]);
  const hourlyRevenue = useMemo(() => computeHourlyRevenue(rangeOrders), [rangeOrders]);

  const rangeOptions: { key: DateRange; label: string }[] = [
    { key: 'week', label: t('merchant.analytics.thisWeek') },
    { key: 'month', label: t('merchant.analytics.thisMonth') },
    { key: 'all', label: t('merchant.analytics.allTime') },
  ];

  const metricConfigs: Record<Exclude<MetricKey, 'totalRevenue'>, MetricConfig> = {
    todayRevenue: {
      key: 'todayRevenue',
      label: t('merchant.dashboard.todayRevenue'),
      value: formatCurrency(rangeMetrics.totalRevenue),
      icon: <DollarSign size={20} color={colors.primary} />,
    },
    todayOrders: {
      key: 'todayOrders',
      label: t('merchant.dashboard.todayOrders'),
      value: String(rangeMetrics.totalOrders),
      icon: <ShoppingBag size={20} color="#3B82F6" />,
    },
    totalItemsSaved: {
      key: 'totalItemsSaved',
      label: t('merchant.dashboard.itemsSaved'),
      value: String(rangeMetrics.totalItemsSaved),
      icon: <Package size={20} color="#F59E0B" />,
    },
  };

  const activeMetric: Exclude<MetricKey, 'totalRevenue'> =
    metric === 'todayRevenue' || metric === 'todayOrders' || metric === 'totalItemsSaved'
      ? metric
      : 'todayRevenue';
  const activeConfig = metricConfigs[activeMetric];
  const labels = getDayLabels();

  const chartColor =
    activeMetric === 'todayRevenue'
      ? colors.primary
      : activeMetric === 'todayOrders'
        ? '#3B82F6'
        : '#F59E0B';

  return (
    <Screen testID="merchant-analytics-screen" scrollable className="bg-background">
      <Header title={t('merchant.analytics.title')} />
      <View className="px-6 py-4">
        {isError && (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your analytics."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        )}

        <View className="mb-6 flex-row rounded-2xl bg-muted/10 p-1">
          {rangeOptions.map((option) => {
            const isActive = dateRange === option.key;
            return (
              <PressableScale
                key={option.key}
                onPress={() => setDateRange(option.key)}
                className={`flex-1 items-center rounded-xl py-2 ${
                  isActive ? 'bg-card shadow-sm' : ''
                }`}
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

        <View className="mb-6 flex-row flex-wrap">
          <View className="mb-3 w-1/2 pr-2">
            <Card variant="elevated" className="py-4">
              <View className="mb-2 rounded-xl bg-primary/10 p-2 self-start">
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
              <View className="mb-2 rounded-xl bg-blue-500/10 p-2 self-start">
                <ShoppingBag size={20} color="#3B82F6" />
              </View>
              <Text variant="caption" className="mb-1 text-muted">
                {t('merchant.dashboard.todayOrders')}
              </Text>
              <Text variant="h3">{rangeMetrics.totalOrders}</Text>
            </Card>
          </View>
          <View className="mb-3 w-1/2 pr-2">
            <Card variant="elevated" className="py-4">
              <View className="mb-2 rounded-xl bg-amber-500/10 p-2 self-start">
                <Percent size={20} color="#F59E0B" />
              </View>
              <Text variant="caption" className="mb-1 text-muted">
                {t('merchant.analytics.conversionRate')}
              </Text>
              <Text variant="h3">{rangeMetrics.conversionRate}%</Text>
            </Card>
          </View>
          <View className="mb-3 w-1/2 pl-2">
            <Card variant="elevated" className="py-4">
              <View className="mb-2 rounded-xl bg-violet-500/10 p-2 self-start">
                <TrendingUp size={20} color="#8B5CF6" />
              </View>
              <Text variant="caption" className="mb-1 text-muted">
                {t('merchant.analytics.avgOrderValue')}
              </Text>
              <Text variant="h3">{formatCurrency(rangeMetrics.avgOrderValue)}</Text>
            </Card>
          </View>
          <View className="w-full">
            <Card variant="elevated" className="py-4">
              <View className="mb-2 rounded-xl bg-cyan-500/10 p-2 self-start">
                <Eye size={20} color="#06B6D4" />
              </View>
              <Text variant="caption" className="mb-1 text-muted">
                {t('merchant.analytics.views')}
              </Text>
              <Text variant="h3">{rangeMetrics.views.toLocaleString()}</Text>
            </Card>
          </View>
        </View>

        <View className="mb-6">
          <Text variant="h3" className="mb-4">
            {activeConfig.label}
          </Text>
          {analytics ? (
            <BarChart
              data={
                activeMetric === 'todayRevenue'
                  ? weeklySeries.revenue
                  : activeMetric === 'todayOrders'
                    ? weeklySeries.orders
                    : weeklySeries.itemsSaved
              }
              labels={labels}
              color={chartColor}
            />
          ) : (
            <View className="h-40 rounded-2xl bg-muted/10" />
          )}
        </View>

        <View className="mb-6">
          <Text variant="h3" className="mb-4">
            {t('merchant.analytics.topListings')}
          </Text>
          {topListings.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topListings.map((listing) => (
                <Card key={listing.listingId} variant="outlined" className="mr-3 w-56 p-4">
                  <View className="mb-2 rounded-xl bg-primary/10 p-2 self-start">
                    <Star size={18} color={colors.primary} />
                  </View>
                  <Text variant="body" className="mb-1 font-semibold" numberOfLines={2}>
                    {listing.title}
                  </Text>
                  <Text variant="body-sm" className="text-muted">
                    {formatCurrency(listing.revenue)} · {listing.orders}{' '}
                    {listing.orders === 1 ? 'order' : 'orders'}
                  </Text>
                </Card>
              ))}
            </ScrollView>
          ) : (
            <View className="rounded-2xl bg-muted/10 p-6">
              <Text variant="body" className="text-center text-muted">
                No top listings for this range
              </Text>
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text variant="h3" className="mb-4">
            {t('merchant.analytics.hourlyRevenue')}
          </Text>
          {analytics ? (
            <BarChart
              data={hourlyRevenue.map((h) => h.revenue)}
              labels={hourlyRevenue.map((h) => `${h.hour}:00`)}
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
    </Screen>
  );
}
