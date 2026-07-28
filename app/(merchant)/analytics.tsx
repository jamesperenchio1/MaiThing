import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
import { TrendingUp, DollarSign, Package, ShoppingBag } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { BarChart } from '@/src/components/ui/BarChart';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useAuthStore } from '@/src/stores/auth';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { MerchantAnalytics } from '@/src/types';

type MetricKey =
  | 'todayRevenue'
  | 'todayOrders'
  | 'totalItemsSaved'
  | 'totalRevenue';

interface MetricConfig {
  key: MetricKey;
  label: string;
  value: (a: MerchantAnalytics) => string;
  series: (a: MerchantAnalytics) => number[];
  color: string;
  icon: React.ReactNode;
}

function getDayLabels(): string[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => days[(today - 6 + i + 7) % 7]);
}

export default function MerchantAnalyticsScreen() {
  const { metric } = useLocalSearchParams<{ metric?: MetricKey }>();
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { data, isLoading, isError, refetch } = useAnalytics(user?.id ?? '');

  const configs: Record<MetricKey, MetricConfig> = useMemo(
    () => ({
      todayRevenue: {
        key: 'todayRevenue',
        label: t('merchant.dashboard.todayRevenue'),
        value: (a) => formatCurrency(a.todayRevenue),
        series: (a) => a.weeklyRevenue,
        color: colors.primary,
        icon: <DollarSign size={20} color={colors.primary} />,
      },
      todayOrders: {
        key: 'todayOrders',
        label: t('merchant.dashboard.todayOrders'),
        value: (a) => String(a.todayOrders),
        series: (a) => a.weeklyOrders,
        color: '#3B82F6',
        icon: <ShoppingBag size={20} color="#3B82F6" />,
      },
      totalItemsSaved: {
        key: 'totalItemsSaved',
        label: t('merchant.dashboard.itemsSaved'),
        value: (a) => String(a.totalItemsSaved),
        series: (a) => a.weeklyItemsSaved,
        color: '#F59E0B',
        icon: <Package size={20} color="#F59E0B" />,
      },
      totalRevenue: {
        key: 'totalRevenue',
        label: t('merchant.dashboard.totalRevenue'),
        value: (a) => formatCurrency(a.totalRevenue),
        series: (a) => a.weeklyRevenue,
        color: colors.primary,
        icon: <DollarSign size={20} color={colors.primary} />,
      },
    }),
    [t, colors.primary]
  );

  const activeMetric: MetricKey = configs[metric as MetricKey] ? (metric as MetricKey) : 'todayRevenue';
  const config = configs[activeMetric];
  const labels = getDayLabels();

  return (
    <Screen testID="merchant-analytics-screen" scrollable className="bg-background">
      <Header title={config.label} />
      <View className="px-6 py-4">
        {isError && (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your analytics."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        )}

        <Card variant="elevated" className="mb-6 items-center py-8">
          <View className="mb-4 rounded-2xl bg-primary/10 p-3">{config.icon}</View>
          <Text variant="caption" className="mb-1 text-muted uppercase tracking-wide">
            {config.label}
          </Text>
          <Text variant="h1" className="text-4xl">
            {data ? config.value(data) : isLoading ? '—' : '0'}
          </Text>
        </Card>

        <View className="mb-4">
          <Text variant="h3" className="mb-4">
            Last 7 days
          </Text>
          {data ? (
            <BarChart data={config.series(data)} labels={labels} color={config.color} />
          ) : (
            <View className="h-40 rounded-2xl bg-muted/10" />
          )}
        </View>

        <View className="mb-6 flex-row flex-wrap">
          {(Object.keys(configs) as MetricKey[]).map((key) => {
            const c = configs[key];
            const isActive = key === activeMetric;
            return (
              <View key={key} className="mb-3 w-1/2 pr-2">
                <Card
                  variant={isActive ? 'elevated' : 'outlined'}
                  className={`py-4 ${isActive ? 'border-primary' : ''}`}
                >
                  <View className="mb-2 rounded-xl bg-muted/10 p-2 self-start">{c.icon}</View>
                  <Text variant="caption" className="mb-1 text-muted">
                    {c.label}
                  </Text>
                  <Text variant="h3">{data ? c.value(data) : '—'}</Text>
                </Card>
              </View>
            );
          })}
        </View>

        <Button fullWidth variant="secondary" onPress={() => router.back()}>
          {t('common.done')}
        </Button>
      </View>
    </Screen>
  );
}
