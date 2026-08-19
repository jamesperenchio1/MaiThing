import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { BottomSheet } from '@/src/components/ui/BottomSheet';

export function BulkAdjustPriceSheet({
  isOpen,
  onClose,
  selectedCount,
  value,
  onChangeValue,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  value: string;
  onChangeValue: (value: string) => void;
  onApply: () => void;
}) {
  const { t } = useTranslation();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['35%']}>
      <Text variant="h3" className="mb-1">
        {t('merchant.inventory.adjustSalePriceTitle')}
      </Text>
      <Text variant="body-sm" className="mb-4 text-muted">
        {t('merchant.inventory.appliedToSelected', { count: selectedCount })}
      </Text>
      <Input
        placeholder={t('merchant.inventory.newSalePricePlaceholder')}
        value={value}
        onChangeText={onChangeValue}
        keyboardType="numeric"
        containerClassName="mb-4"
      />
      <View className="flex-row gap-3">
        <Button
          variant="ghost"
          className="flex-1"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          className="flex-1"
          onPress={onApply}
          disabled={!value || isNaN(parseFloat(value)) || parseFloat(value) <= 0}
        >
          {t('common.apply')}
        </Button>
      </View>
    </BottomSheet>
  );
}
