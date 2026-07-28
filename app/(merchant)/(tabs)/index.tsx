import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus, TrendingUp, Package, DollarSign } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';

type MetricKey =
  | 'todayRevenue'
  | 'todayOrders'
  | 'totalItemsSaved'
  | 'totalRevenue';

function StatCard({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <PressableScale onPress={onPress} className="flex-1" scale={0.98} disabled={!onPress}>
      <Card variant="elevated" className="min-h-[120px] justify-between">
        <View className="mb-2 rounded-xl bg-primary/10 p-2 self-start">{icon}</View>
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

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { data: analytics, isRefetching, isError, refetch } = useAnalytics(user?.id ?? '');

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  return (
    <Screen
      testID="merchant-dashboard-screen"
      scrollable
      className="bg-background"
      refreshing={isRefetching}
      onRefresh={handleRefresh}
    >
      <View className="px-6 pt-4 pb-2">
        <Text testID="merchant-dashboard-title" variant="h1" className="mb-2">
          {t('merchant.dashboard.title')}
        </Text>
        <Text testID="merchant-dashboard-welcome" variant="body" className="mb-6 text-muted">
          Welcome back, {user?.name}
        </Text>

        {isError && (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your dashboard."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        )}

        <View testID="merchant-stats-row-1" className="mb-6 flex-row space-x-3">
          <StatCard
            label={t('merchant.dashboard.todayRevenue')}
            value={formatCurrency(analytics?.todayRevenue ?? 0)}
            icon={<DollarSign size={20} color={colors.primary} />}
            onPress={() => router.push({ pathname: '/(merchant)/analytics', params: { metric: 'todayRevenue' } } as any)}
          />
          <StatCard
            label={t('merchant.dashboard.todayOrders')}
            value={String(analytics?.todayOrders ?? 0)}
            icon={<TrendingUp size={20} color={colors.primary} />}
            onPress={() => router.push({ pathname: '/(merchant)/analytics', params: { metric: 'todayOrders' } } as any)}
          />
        </View>

        <View testID="merchant-stats-row-2" className="mb-6 flex-row space-x-3">
          <StatCard
            label={t('merchant.dashboard.itemsSaved')}
            value={String(analytics?.totalItemsSaved ?? 0)}
            icon={<Package size={20} color={colors.primary} />}
            onPress={() => router.push({ pathname: '/(merchant)/analytics', params: { metric: 'totalItemsSaved' } } as any)}
          />
          <StatCard
            label={t('merchant.dashboard.totalRevenue')}
            value={formatCurrency(analytics?.totalRevenue ?? 0)}
            icon={<DollarSign size={20} color={colors.primary} />}
            onPress={() => router.push({ pathname: '/(merchant)/analytics', params: { metric: 'totalRevenue' } } as any)}
          />
        </View>

        <Button
          testID="create-listing-button"
          fullWidth
          className="mb-3"
          leftIcon={<Plus size={20} color={colors.white} />}
          onPress={() => router.push('/(merchant)/listings/new' as any)}
        >
          {t('merchant.dashboard.createListing')}
        </Button>
        <Button
          testID="manage-inventory-button"
          variant="secondary"
          fullWidth
          onPress={() => router.push('/(merchant)/(tabs)/inventory' as any)}
        >
          {t('merchant.dashboard.manageInventory')}
        </Button>
      </View>
    </Screen>
  );
}
