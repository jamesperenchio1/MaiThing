import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { Listing } from '@/src/types';

import { LowStockCard } from './LowStockCard';

export function LowStockAlerts({
  lowStockListings,
  onSeeAll,
  onListingPress,
}: {
  lowStockListings: Listing[];
  onSeeAll: () => void;
  onListingPress: (listing: Listing) => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  if (lowStockListings.length === 0) return null;

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <AlertTriangle size={16} color={colors.danger} />
          <Text variant="body-sm" className="ml-2 font-semibold text-muted">
            {t('merchant.dashboard.lowStockAlerts')}
          </Text>
        </View>
        <PressableScale onPress={onSeeAll} scale={0.95}>
          <Text variant="caption" className="text-primary">
            {t('common.seeAll')}
          </Text>
        </PressableScale>
      </View>
      {lowStockListings.map((listing) => (
        <LowStockCard key={listing.id} listing={listing} onPress={() => onListingPress(listing)} />
      ))}
    </View>
  );
}
