import { View, ScrollView, Modal, Switch, Pressable } from 'react-native';
import { X } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { DIETARY_TAGS, ALLERGENS } from '@/src/lib/constants';
import { cn } from '@/src/lib/utils';
import { PriceRangeSlider } from './PriceRangeSlider';
import { SORT_OPTIONS, RATING_OPTIONS, type SortOption } from './constants';

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} scale={0.95}>
      <View
        className={cn(
          'mr-2 mb-2 rounded-full border px-4 py-2',
          selected ? 'border-primary bg-primary' : 'border-border bg-card'
        )}
      >
        <Text variant="body-sm" className={selected ? 'text-white' : 'text-foreground'}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filterLabel: string;
  sortLabel: string;
  resetLabel: string;
  applyLabel: string;
  sortBy: SortOption;
  onSortByChange: (id: SortOption) => void;
  listingType: 'all' | 'mystery_box' | 'fixed_item';
  onListingTypeChange: (type: 'all' | 'mystery_box' | 'fixed_item') => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  excludedAllergens: string[];
  onToggleAllergen: (allergen: string) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  priceEnabled: boolean;
  onPriceEnabledChange: (enabled: boolean) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onReset: () => void;
}

export function FilterSheet({
  visible,
  onClose,
  filterLabel,
  sortLabel,
  resetLabel,
  applyLabel,
  sortBy,
  onSortByChange,
  listingType,
  onListingTypeChange,
  selectedTags,
  onToggleTag,
  excludedAllergens,
  onToggleAllergen,
  minRating,
  onMinRatingChange,
  priceEnabled,
  onPriceEnabledChange,
  priceRange,
  onPriceRangeChange,
  onReset,
}: FilterSheetProps) {
  const colors = useThemeColor();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
          onPress={onClose}
        />
        <View className="max-h-[85%] rounded-t-3xl bg-background px-6 pb-10 pt-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text variant="h3">{filterLabel}</Text>
            <PressableScale onPress={onClose} scale={0.9}>
              <View className="rounded-full bg-muted/10 p-2">
                <X size={20} color={colors.muted} />
              </View>
            </PressableScale>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-6">
              <Text variant="body-sm" className="mb-3 font-semibold">
                {sortLabel}
              </Text>
              <View className="flex-row flex-wrap">
                {SORT_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.id}
                    label={option.label}
                    selected={sortBy === option.id}
                    onPress={() => onSortByChange(option.id)}
                  />
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text variant="body-sm" className="mb-3 font-semibold">
                Type
              </Text>
              <View className="flex-row flex-wrap">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'mystery_box', label: 'Mystery Box' },
                  { id: 'fixed_item', label: 'Fixed Item' },
                ].map((option) => (
                  <FilterChip
                    key={option.id}
                    label={option.label}
                    selected={listingType === option.id}
                    onPress={() => onListingTypeChange(option.id as typeof listingType)}
                  />
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text variant="body-sm" className="mb-3 font-semibold">
                Dietary
              </Text>
              <View className="flex-row flex-wrap">
                {DIETARY_TAGS.map((tag) => (
                  <FilterChip
                    key={tag.id}
                    label={tag.name}
                    selected={selectedTags.includes(tag.id)}
                    onPress={() => onToggleTag(tag.id)}
                  />
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text variant="body-sm" className="mb-3 font-semibold">
                Exclude allergens
              </Text>
              <View className="flex-row flex-wrap">
                {ALLERGENS.map((allergen) => (
                  <FilterChip
                    key={allergen.id}
                    label={allergen.name}
                    selected={excludedAllergens.includes(allergen.id)}
                    onPress={() => onToggleAllergen(allergen.id)}
                  />
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text variant="body-sm" className="mb-3 font-semibold">
                Min Rating
              </Text>
              <View className="flex-row flex-wrap">
                {RATING_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    selected={minRating === opt.value}
                    onPress={() => onMinRatingChange(opt.value)}
                  />
                ))}
              </View>
            </View>

            <View className="mb-6">
              <View className="mb-3 flex-row items-center justify-between">
                <Text variant="body-sm" className="font-semibold">
                  Price range
                </Text>
                <Switch
                  value={priceEnabled}
                  onValueChange={(v) => onPriceEnabledChange(v)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              {priceEnabled && (
                <PriceRangeSlider
                  values={priceRange}
                  onChange={(range) => onPriceRangeChange(range)}
                />
              )}
            </View>
          </ScrollView>

          <View className="mt-4 flex-row space-x-3">
            <Button variant="outline" className="flex-1" onPress={onReset}>
              {resetLabel}
            </Button>
            <Button className="flex-1" onPress={onClose}>
              {applyLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
