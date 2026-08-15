import { View, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Controller, type Control } from 'react-hook-form';
import { Text } from '@/src/components/ui/Text';
import { Input } from '@/src/components/ui/Input';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { cn } from '@/src/lib/utils';
import type { CreateListingForm } from '@/src/features/listings/schemas';

export function TitleDescriptionFields({ control }: { control: Control<CreateListingForm> }) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Input
            testID="listing-title-input"
            label={t('merchant.createListing.listingDetails')}
            placeholder={t('merchant.createListing.titlePlaceholder')}
            value={value}
            onChangeText={onChange}
            onEndEditing={(e) => onChange(e.nativeEvent.text)}
            error={error?.message}
            maxLength={60}
            showCharacterCount
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value }, fieldState: { error } }) => {
          const descriptionLength = value?.length ?? 0;
          const descriptionNearLimit = descriptionLength >= 150;
          const descriptionAtLimit = descriptionLength >= 300;
          return (
            <View className="mb-4">
              <Text testID="listing-description-label" variant="label" className="mb-2 ml-1">
                {t('customer.listing.description')}
              </Text>
              <TextInput
                testID="listing-description-input"
                className="min-h-[100] rounded-2xl border border-border bg-card p-4 text-base text-foreground"
                placeholder={t('merchant.createListing.descriptionPlaceholder')}
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                value={value}
                onChangeText={onChange}
                onEndEditing={(e) => onChange(e.nativeEvent.text)}
                maxLength={300}
              />
              <View className="mt-1.5 ml-1 flex-row justify-between">
                {error ? (
                  <Text variant="caption" className="text-danger">
                    {error.message}
                  </Text>
                ) : (
                  <View />
                )}
                <Text
                  variant="caption"
                  className={cn(
                    'text-right',
                    descriptionAtLimit
                      ? 'text-danger'
                      : descriptionNearLimit
                        ? 'text-amber-500'
                        : 'text-muted'
                  )}
                >
                  {descriptionLength}/300
                </Text>
              </View>
            </View>
          );
        }}
      />
    </>
  );
}
