import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { formatCurrency } from '@/src/lib/utils';
import type { Merchant, MerchantAnalytics } from '@/src/types';

export function RevenueGoalWidget({
  merchant,
  analytics,
}: {
  merchant?: Merchant | null;
  analytics?: MerchantAnalytics;
}) {
  const { t } = useTranslation();

  if (!merchant?.revenueGoal || !analytics) return null;

  const revenueGoal = merchant.revenueGoal;

  return (
    <Card variant="elevated" className="mb-6">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="body-sm" className="font-semibold">
          {t('merchant.dashboard.revenueGoalTitle')}
        </Text>
        <Text variant="caption" className="text-muted">
          {formatCurrency(analytics.totalRevenue)} / {formatCurrency(revenueGoal)}
        </Text>
      </View>
      <View className="h-3 rounded-full bg-muted/20 overflow-hidden">
        <View
          className="h-full rounded-full bg-primary"
          style={{
            width: `${Math.min(100, Math.round((analytics.totalRevenue / revenueGoal) * 100))}%`,
          }}
        />
      </View>
      <Text variant="caption" className="mt-2 text-muted">
        {Math.min(100, Math.round((analytics.totalRevenue / revenueGoal) * 100))}%
        {analytics.totalRevenue >= revenueGoal
          ? t('merchant.dashboard.goalReached')
          : t('merchant.dashboard.goalToGo', {
              amount: formatCurrency(revenueGoal - analytics.totalRevenue),
            })}
      </Text>
    </Card>
  );
}
