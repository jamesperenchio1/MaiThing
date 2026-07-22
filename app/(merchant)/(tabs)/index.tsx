import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Plus, TrendingUp, Package, DollarSign } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { useAuthStore } from '@/src/stores/auth';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card variant="elevated" className="flex-1">
      <View className="mb-2 rounded-xl bg-primary/10 p-2 self-start">
        {icon}
      </View>
      <Text variant="caption" className="mb-1 text-muted">
        {label}
      </Text>
      <Text variant="h3">{value}</Text>
    </Card>
  );
}

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { data: analytics } = useAnalytics(user?.id ?? '');

  return (
    <Screen testID="merchant-dashboard-screen" scrollable className="bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text testID="merchant-dashboard-title" variant="h1" className="mb-2">
          {t('merchant.dashboard.title')}
        </Text>
        <Text testID="merchant-dashboard-welcome" variant="body" className="mb-6 text-muted">
          Welcome back, {user?.name}
        </Text>

        <View testID="merchant-stats-row-1" className="mb-6 flex-row space-x-3">
          <StatCard
            label={t('merchant.dashboard.todayRevenue')}
            value={formatCurrency(analytics?.todayRevenue ?? 0)}
            icon={<DollarSign size={20} color={colors.primary} />}
          />
          <StatCard
            label={t('merchant.dashboard.todayOrders')}
            value={String(analytics?.todayOrders ?? 0)}
            icon={<TrendingUp size={20} color={colors.primary} />}
          />
        </View>

        <View testID="merchant-stats-row-2" className="mb-6 flex-row space-x-3">
          <StatCard
            label={t('merchant.dashboard.itemsSaved')}
            value={String(analytics?.totalItemsSaved ?? 0)}
            icon={<Package size={20} color={colors.primary} />}
          />
          <StatCard
            label={t('merchant.dashboard.totalRevenue')}
            value={formatCurrency(analytics?.totalRevenue ?? 0)}
            icon={<DollarSign size={20} color={colors.primary} />}
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
          onPress={() => router.push('/(merchant)/inventory' as any)}
        >
          {t('merchant.dashboard.manageInventory')}
        </Button>
      </View>
    </Screen>
  );
}
