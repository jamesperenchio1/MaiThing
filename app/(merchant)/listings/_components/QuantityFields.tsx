import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Controller, type Control } from 'react-hook-form';
import { Text } from '@/src/components/ui/Text';
import { Input } from '@/src/components/ui/Input';
import type { CreateListingForm } from '@/src/features/listings/schemas';

export function QuantityFields({ control }: { control: Control<CreateListingForm> }) {
  const { t } = useTranslation();

  return (
    <>
      <Controller
        control={control}
        name="quantity"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Input
            testID="quantity-input"
            label={t('merchant.createListing.quantity')}
            placeholder="5"
            keyboardType="number-pad"
            value={value ? String(value) : ''}
            onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="lowStockThreshold"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View className="mb-4">
            <Input
              testID="low-stock-threshold-input"
              label={t('merchant.createListing.lowStockAlert')}
              placeholder="3"
              keyboardType="number-pad"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)}
              error={error?.message}
              maxLength={3}
              containerClassName="mb-1.5"
            />
            {!error && (
              <Text variant="caption" className="ml-1 text-muted">
                {t('merchant.createListing.lowStockAlertHint')}
              </Text>
            )}
          </View>
        )}
      />
    </>
  );
}
