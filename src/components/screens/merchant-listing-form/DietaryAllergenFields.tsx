import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/src/components/ui/Text';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { DIETARY_TAGS, ALLERGENS } from '@/src/lib/constants';
import { ToggleChip } from './ToggleChip';

export function DietaryAllergenFields({
  dietaryTags,
  allergens,
  customTagInput,
  setCustomTagInput,
  customAllergenInput,
  setCustomAllergenInput,
  onToggleArray,
  onAddCustomTag,
  onAddCustomAllergen,
}: {
  dietaryTags: string[];
  allergens: string[];
  customTagInput: string;
  setCustomTagInput: (value: string) => void;
  customAllergenInput: string;
  setCustomAllergenInput: (value: string) => void;
  onToggleArray: (field: 'dietaryTags' | 'allergens', value: string) => void;
  onAddCustomTag: () => void;
  onAddCustomAllergen: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <View className="mb-6">
        <Text variant="h3" className="mb-3">
          {t('merchant.createListing.tags')}
        </Text>
        <View className="flex-row flex-wrap">
          {DIETARY_TAGS.map((tag) => (
            <ToggleChip
              key={tag.id}
              label={tag.name}
              selected={dietaryTags.includes(tag.id)}
              onPress={() => onToggleArray('dietaryTags', tag.id)}
            />
          ))}
          {dietaryTags
            .filter((id) => !DIETARY_TAGS.some((t) => t.id === id))
            .map((tag) => (
              <ToggleChip
                key={tag}
                label={tag}
                selected
                onPress={() => onToggleArray('dietaryTags', tag)}
              />
            ))}
        </View>
        <View className="mt-3 flex-row items-center space-x-2">
          <Input
            containerClassName="flex-1"
            testID="custom-tag-input"
            placeholder={t('merchant.createListing.customTag')}
            value={customTagInput}
            onChangeText={setCustomTagInput}
            onSubmitEditing={onAddCustomTag}
          />
          <Button
            testID="add-custom-tag-button"
            variant="secondary"
            size="sm"
            onPress={onAddCustomTag}
            disabled={!customTagInput.trim()}
          >
            {t('common.add')}
          </Button>
        </View>
      </View>

      <View className="mb-6">
        <Text variant="h3" className="mb-3">
          {t('merchant.createListing.allergens')}
        </Text>
        <View className="flex-row flex-wrap">
          {ALLERGENS.map((allergen) => (
            <ToggleChip
              key={allergen.id}
              label={allergen.name}
              selected={allergens.includes(allergen.id)}
              onPress={() => onToggleArray('allergens', allergen.id)}
            />
          ))}
          {allergens
            .filter((id) => !ALLERGENS.some((a) => a.id === id))
            .map((allergen) => (
              <ToggleChip
                key={allergen}
                label={allergen}
                selected
                onPress={() => onToggleArray('allergens', allergen)}
              />
            ))}
        </View>
        <View className="mt-3 flex-row items-center space-x-2">
          <Input
            containerClassName="flex-1"
            testID="custom-allergen-input"
            placeholder={t('merchant.createListing.customAllergen')}
            value={customAllergenInput}
            onChangeText={setCustomAllergenInput}
            onSubmitEditing={onAddCustomAllergen}
          />
          <Button
            testID="add-custom-allergen-button"
            variant="secondary"
            size="sm"
            onPress={onAddCustomAllergen}
            disabled={!customAllergenInput.trim()}
          >
            {t('common.add')}
          </Button>
        </View>
      </View>
    </>
  );
}
