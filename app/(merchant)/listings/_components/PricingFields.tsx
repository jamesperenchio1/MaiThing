import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Controller, type Control } from 'react-hook-form';
import { Input } from '@/src/components/ui/Input';
import { formatCurrency } from '@/src/lib/utils';
import type { CreateListingForm } from '@/src/features/listings/schemas';

export function PricingFields({
  control,
  isOriginalPriceFocused,
  setIsOriginalPriceFocused,
  isSalePriceFocused,
  setIsSalePriceFocused,
}: {
  control: Control<CreateListingForm>;
  isOriginalPriceFocused: boolean;
  setIsOriginalPriceFocused: (value: boolean) => void;
  isSalePriceFocused: boolean;
  setIsSalePriceFocused: (value: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="mb-6 flex-row space-x-3">
      <Controller
        control={control}
        name="originalPrice"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Input
            containerClassName="flex-1"
            testID="original-price-input"
            label={t('merchant.createListing.originalPrice')}
            placeholder="300"
            keyboardType="number-pad"
            value={value ? (isOriginalPriceFocused ? String(value) : formatCurrency(value)) : ''}
            onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)}
            onFocus={() => setIsOriginalPriceFocused(true)}
            onBlur={() => setIsOriginalPriceFocused(false)}
            error={error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="salePrice"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Input
            containerClassName="flex-1"
            testID="sale-price-input"
            label={t('merchant.createListing.salePrice')}
            placeholder="99"
            keyboardType="number-pad"
            value={value ? (isSalePriceFocused ? String(value) : formatCurrency(value)) : ''}
            onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)}
            onFocus={() => setIsSalePriceFocused(true)}
            onBlur={() => setIsSalePriceFocused(false)}
            error={error?.message}
          />
        )}
      />
    </View>
  );
}
