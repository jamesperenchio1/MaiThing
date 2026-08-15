import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Controller, type Control } from 'react-hook-form';
import { Text } from '@/src/components/ui/Text';
import { DateTimePickerField } from '@/src/components/ui/DateTimePickerField';
import type { CreateListingForm } from '@/src/features/listings/schemas';

export function PickupWindowFields({ control }: { control: Control<CreateListingForm> }) {
  const { t } = useTranslation();

  return (
    <View className="mb-6">
      <Text variant="h3" className="mb-3">
        {t('merchant.createListing.pickupWindow')}
      </Text>
      <View className="flex-row space-x-3">
        <Controller
          control={control}
          name="pickupWindowStart"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View className="flex-1">
              <DateTimePickerField
                testID="start-time-input"
                label={t('merchant.createListing.startLabel')}
                value={value}
                onChange={onChange}
                minimumDate={new Date()}
                error={error?.message}
              />
            </View>
          )}
        />
        <Controller
          control={control}
          name="pickupWindowEnd"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View className="flex-1">
              <DateTimePickerField
                testID="end-time-input"
                label={t('merchant.createListing.endLabel')}
                value={value}
                onChange={onChange}
                minimumDate={value}
                error={error?.message}
              />
            </View>
          )}
        />
      </View>
    </View>
  );
}
