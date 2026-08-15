import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { Listing } from '@/src/types';

export function DuplicatePickupSheet({
  isOpen,
  onClose,
  duplicateListing,
  onSameTimeToday,
  onChooseNewWindow,
}: {
  isOpen: boolean;
  onClose: () => void;
  duplicateListing: Listing | null;
  onSameTimeToday: () => void;
  onChooseNewWindow: () => void;
}) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['40%']}>
      <Text variant="h3" className="mb-5">
        {t('merchant.inventory.whenIsPickup')}
      </Text>

      {duplicateListing && (
        <>
          <PressableScale onPress={onSameTimeToday} scale={0.98} className="mb-3">
            <View className="flex-row items-center border-l-4 border-primary rounded-lg bg-primary/5 p-4">
              <View className="flex-1">
                <Text variant="body-sm" className="font-semibold text-foreground">
                  {t('merchant.inventory.sameTimeToday')}
                </Text>
                <Text variant="caption" className="mt-1 text-muted">
                  {new Date(duplicateListing.pickupWindowStart).toLocaleTimeString(i18n.language, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  –{' '}
                  {new Date(duplicateListing.pickupWindowEnd).toLocaleTimeString(i18n.language, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  {t('merchant.inventory.todaySuffix')}
                </Text>
              </View>
              <Check size={20} color={colors.primary} />
            </View>
          </PressableScale>

          <PressableScale onPress={onChooseNewWindow} scale={0.98} className="mb-6">
            <View className="flex-row items-center rounded-lg border border-border p-4">
              <View className="flex-1">
                <Text variant="body-sm" className="font-semibold text-foreground">
                  {t('merchant.inventory.chooseNewWindow')}
                </Text>
                <Text variant="caption" className="mt-1 text-muted">
                  {t('merchant.inventory.setDifferentPickupTime')}
                </Text>
              </View>
            </View>
          </PressableScale>
        </>
      )}

      <Button variant="ghost" className="w-full" onPress={onClose}>
        {t('common.cancel')}
      </Button>
    </BottomSheet>
  );
}
