import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Controller, type Control } from 'react-hook-form';
import { Camera } from 'lucide-react-native';
import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { BOX_SIZES } from '@/src/lib/constants';
import type { CreateListingForm } from '@/src/features/listings/schemas';
import { ToggleChip } from './ToggleChip';

export function ListingTypeSection({
  control,
  type,
}: {
  control: Control<CreateListingForm>;
  type: CreateListingForm['type'];
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <>
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <View className="mb-6 flex-row gap-3">
            {(['mystery_box', 'fixed_item'] as const).map((item) => (
              <PressableScale
                key={item}
                testID={item === 'mystery_box' ? 'mystery-box-option' : 'fixed-item-option'}
                onPress={() => onChange(item)}
                scale={0.98}
                className="flex-1"
              >
                <Card
                  variant={value === item ? 'elevated' : 'outlined'}
                  className="items-center p-4"
                  style={
                    value === item ? { borderWidth: 2, borderColor: colors.primary } : undefined
                  }
                >
                  <View className="mb-2 rounded-full bg-primary/10 p-3">
                    <Camera size={24} color={colors.primary} />
                  </View>
                  <Text variant="body-sm" className="font-semibold">
                    {item === 'mystery_box'
                      ? t('merchant.createListing.mysteryBox')
                      : t('merchant.createListing.fixedItem')}
                  </Text>
                  <Text variant="caption" className="text-center text-muted">
                    {item === 'mystery_box'
                      ? t('merchant.createListing.mysteryBoxDesc')
                      : t('merchant.createListing.fixedItemDesc')}
                  </Text>
                </Card>
              </PressableScale>
            ))}
          </View>
        )}
      />

      {type === 'mystery_box' && (
        <Controller
          control={control}
          name="boxSize"
          render={({ field: { onChange, value } }) => (
            <View className="mb-6">
              <Text variant="h3" className="mb-3">
                {t('merchant.createListing.boxSize')}
              </Text>
              <View className="flex-row flex-wrap">
                {BOX_SIZES.map((size) => (
                  <ToggleChip
                    key={size.id}
                    testID={`box-size-${size.id}`}
                    label={size.name}
                    selected={value === size.id}
                    onPress={() => onChange(size.id)}
                  />
                ))}
              </View>
            </View>
          )}
        />
      )}
    </>
  );
}
