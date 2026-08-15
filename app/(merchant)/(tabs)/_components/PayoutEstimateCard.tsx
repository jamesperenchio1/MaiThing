import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { CalendarClock, ChevronRight } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { MerchantWallet } from '@/src/types';

export function PayoutEstimateCard({
  wallet,
  onPress,
}: {
  wallet?: MerchantWallet;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();

  return (
    <Card variant="elevated" className="mb-6">
      <PressableScale onPress={onPress} scale={0.98}>
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
            {t('merchant.dashboard.nextPayoutLabel')}{' '}
            {new Date(wallet.nextPayoutDate).toLocaleDateString(i18n.language, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        )}
      </PressableScale>
    </Card>
  );
}
