import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { formatCurrency } from '@/src/lib/utils';
import type { Merchant, MerchantAnalytics } from '@/src/types';

import { getTimeOfDay } from './utils';

export function DashboardHeader({
  merchant,
  isClosed,
  closedUntilFormatted,
  onStatusPillPress,
  hour,
  firstName,
  analytics,
}: {
  merchant?: Merchant | null;
  isClosed: boolean;
  closedUntilFormatted: string;
  onStatusPillPress: () => void;
  hour: number;
  firstName: string;
  analytics?: MerchantAnalytics;
}) {
  const { t, i18n } = useTranslation();

  return (
    <View className="mb-6 rounded-3xl bg-primary p-5 overflow-hidden">
      {/* Open/Closed status pill — top left */}
      {merchant && (
        <View className="absolute left-4 top-4 z-10">
          <PressableScale onPress={onStatusPillPress} scale={0.95}>
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
                {isClosed
                  ? t('merchant.dashboard.closedUntilLabel', { date: closedUntilFormatted })
                  : t('merchant.dashboard.openLabel')}
              </Text>
            </View>
          </PressableScale>
        </View>
      )}

      {/* Date chip — top right */}
      <View className="absolute right-4 top-4 bg-white/10 rounded-2xl px-3 py-1.5">
        <Text variant="caption" className="text-white/80 font-medium">
          {new Date().toLocaleDateString(i18n.language, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Content — mt-6 clears the absolute-positioned pills row */}
      <Text testID="merchant-dashboard-title" variant="caption" className="text-white/70 mb-1 mt-6">
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
  );
}
