import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { TrendingUp, DollarSign } from 'lucide-react-native';

import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { MerchantAnalytics } from '@/src/types';

import { StatCard } from './StatCard';

export function DashboardStats({
  analytics,
  onConversionRatePress,
  onAvgOrderValuePress,
}: {
  analytics?: MerchantAnalytics;
  onConversionRatePress: () => void;
  onAvgOrderValuePress: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <View testID="merchant-stats-row-1" className="mb-6 flex-row space-x-3">
      <StatCard
        testID="merchant-conversion-rate-card"
        label={t('merchant.dashboard.conversionRate')}
        value={`${Math.round(analytics?.conversionRate ?? 0)}%`}
        icon={<TrendingUp size={20} color={colors.success} />}
        iconBg="bg-green-500/10"
        onPress={onConversionRatePress}
      />
      <StatCard
        testID="merchant-avg-order-value-card"
        label={t('merchant.dashboard.avgOrderValue')}
        value={formatCurrency(analytics?.avgOrderValue ?? 0)}
        icon={<DollarSign size={20} color={colors.primary} />}
        iconBg="bg-blue-500/10"
        onPress={onAvgOrderValuePress}
      />
    </View>
  );
}
