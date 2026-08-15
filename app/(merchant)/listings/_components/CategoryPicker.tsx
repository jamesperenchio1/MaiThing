import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Controller, type Control } from 'react-hook-form';
import { Text } from '@/src/components/ui/Text';
import { CATEGORIES } from '@/src/lib/constants';
import type { CreateListingForm } from '@/src/features/listings/schemas';
import type { Category } from '@/src/types';
import { ToggleChip } from './ToggleChip';

export function CategoryPicker({
  control,
  categories,
}: {
  control: Control<CreateListingForm>;
  categories: Category[] | undefined;
}) {
  const { t } = useTranslation();

  return (
    <Controller
      control={control}
      name="category"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View className="mb-6">
          <Text variant="h3" className="mb-3">
            {t('merchant.createListing.category')}
          </Text>
          <View className="flex-row flex-wrap">
            {categories?.map((category) => (
              <ToggleChip
                key={category.id}
                testID={`category-${category.id}`}
                label={category.name}
                selected={value === category.id}
                onPress={() => onChange(category.id)}
              />
            ))}
            {!categories &&
              CATEGORIES.map((category) => (
                <ToggleChip
                  key={category.id}
                  testID={`category-${category.id}`}
                  label={category.name}
                  selected={value === category.id}
                  onPress={() => onChange(category.id)}
                />
              ))}
          </View>
          {error && (
            <Text variant="caption" className="mt-1 text-danger">
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  );
}
