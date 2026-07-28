import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Modal, TouchableWithoutFeedback, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SlidersHorizontal, X, Clock } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/layout/SearchBar';
import { ListingCard } from '@/src/components/composite/ListingCard';
import { CategoryChip } from '@/src/components/composite/CategoryChip';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useListings, type ListingFilters } from '@/src/hooks/useListings';
import { useCategories } from '@/src/hooks/useMerchants';
import { useRecentSearches } from '@/src/hooks/useRecentSearches';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { DIETARY_TAGS, ALLERGENS } from '@/src/lib/constants';
import { cn } from '@/src/lib/utils';

type SortOption = NonNullable<ListingFilters['sortBy']>;

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'distance', label: 'Nearest' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'discount', label: 'Biggest Discount' },
  { id: 'newest', label: 'Newest' },
];

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

export default function DiscoverScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();
  const { query } = useLocalSearchParams<{ query?: string }>();
  const [searchQuery, setSearchQuery] = useState(query ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(query ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [listingType, setListingType] = useState<'all' | 'mystery_box' | 'fixed_item'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const { recent, addSearch, removeSearch, clearSearches } = useRecentSearches();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filters = useMemo(
    () => ({
      query: debouncedQuery || undefined,
      category: selectedCategory ?? undefined,
      type: listingType === 'all' ? undefined : listingType,
      sortBy,
      dietaryTags: selectedTags.length ? selectedTags : undefined,
      allergens: excludedAllergens.length ? excludedAllergens : undefined,
      maxPrice: maxPrice ?? undefined,
      lat: 13.7462,
      lng: 100.5347,
      radius: 50000,
    }),
    [
      debouncedQuery,
      selectedCategory,
      listingType,
      sortBy,
      selectedTags,
      excludedAllergens,
      maxPrice,
    ]
  );

  const { data: listings, isLoading, isRefetching, isError, refetch } = useListings(filters);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  const { data: categories } = useCategories();

  const handleSubmit = (value: string) => {
    setSearchQuery(value);
    addSearch(value);
  };

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (listingType !== 'all' ? 1 : 0) +
    (sortBy !== 'distance' ? 1 : 0) +
    selectedTags.length +
    excludedAllergens.length +
    (maxPrice ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory(null);
    setListingType('all');
    setSortBy('distance');
    setSelectedTags([]);
    setExcludedAllergens([]);
    setMaxPrice(null);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleAllergen = (allergen: string) => {
    setExcludedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  return (
    <Screen
      testID="discover-screen"
      scrollable
      className="bg-background"
      refreshing={isRefetching}
      onRefresh={handleRefresh}
    >
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
          <View className="flex-1 justify-end bg-black/40">
            <TouchableWithoutFeedback>
              <View className="max-h-[85%] rounded-t-3xl bg-background px-6 pb-10 pt-6">
                <View className="mb-4 flex-row items-center justify-between">
                  <Text variant="h3">{t('common.filter')}</Text>
                  <PressableScale onPress={() => setFilterVisible(false)} scale={0.9}>
                    <View className="rounded-full bg-muted/10 p-2">
                      <X size={20} color={colors.muted} />
                    </View>
                  </PressableScale>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="mb-6">
                    <Text variant="body-sm" className="mb-3 font-semibold">
                      {t('common.sort')}
                    </Text>
                    <View className="flex-row flex-wrap">
                      {SORT_OPTIONS.map((option) => (
                        <FilterChip
                          key={option.id}
                          label={option.label}
                          selected={sortBy === option.id}
                          onPress={() => setSortBy(option.id)}
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
                          onPress={() => setListingType(option.id as typeof listingType)}
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
                          onPress={() => toggleTag(tag.id)}
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
                          onPress={() => toggleAllergen(allergen.id)}
                        />
                      ))}
                    </View>
                  </View>

                  <View className="mb-6">
                    <Text variant="body-sm" className="mb-3 font-semibold">
                      Max price
                    </Text>
                    <View className="flex-row flex-wrap">
                      {[50, 100, 200, 500].map((price) => (
                        <FilterChip
                          key={price}
                          label={`≤ ${price}฿`}
                          selected={maxPrice === price}
                          onPress={() => setMaxPrice((prev) => (prev === price ? null : price))}
                        />
                      ))}
                    </View>
                  </View>
                </ScrollView>

                <View className="mt-4 flex-row space-x-3">
                  <Button variant="outline" className="flex-1" onPress={resetFilters}>
                    {t('common.reset')}
                  </Button>
                  <Button className="flex-1" onPress={() => setFilterVisible(false)}>
                    {t('common.apply')}
                  </Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View className="px-6 pt-4 pb-2">
        <Text testID="discover-title" variant="h1" className="mb-4">
          {t('common.discover')}
        </Text>

        <View className="mb-4 flex-row items-center space-x-3">
          <View className="flex-1">
            <SearchBar
              testID="discover-search-bar"
              placeholder={t('common.search')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmit={handleSubmit}
            />
          </View>
          <PressableScale onPress={() => setFilterVisible(true)} scale={0.95}>
            <View
              className={cn(
                'relative rounded-2xl border border-border bg-card p-3.5',
                activeFilterCount > 0 && 'border-primary bg-primary/10'
              )}
            >
              <SlidersHorizontal
                size={20}
                color={activeFilterCount > 0 ? colors.primary : colors.foreground}
              />
              {activeFilterCount > 0 && (
                <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5">
                  <Text variant="caption" className="text-white">
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </View>
          </PressableScale>
        </View>

        {!searchQuery && recent.length > 0 && (
          <View className="mb-4">
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Clock size={14} color={colors.muted} className="mr-1.5" />
                <Text variant="body-sm" className="text-muted">
                  Recent searches
                </Text>
              </View>
              <Pressable onPress={clearSearches}>
                <Text variant="caption" className="text-primary">
                  Clear
                </Text>
              </Pressable>
            </View>
            <View className="flex-row flex-wrap">
              {recent.map((item) => (
                <PressableScale key={item} onPress={() => setSearchQuery(item)} scale={0.95}>
                  <View className="mr-2 mb-2 flex-row items-center rounded-full bg-muted/10 px-3 py-1.5">
                    <Text variant="body-sm">{item}</Text>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        removeSearch(item);
                      }}
                      className="ml-1.5"
                      hitSlop={8}
                    >
                      <X size={12} color={colors.muted} />
                    </Pressable>
                  </View>
                </PressableScale>
              ))}
            </View>
          </View>
        )}

        <View className="mb-4 flex-row items-center">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            {categories?.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                isActive={selectedCategory === category.id}
                onPress={() =>
                  setSelectedCategory((prev) => (prev === category.id ? null : category.id))
                }
                locale={i18n.language as 'en' | 'th'}
              />
            ))}
          </ScrollView>
        </View>
      </View>

      <View className="px-6 pb-6">
        {isError ? (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load deals right now."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        ) : isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={140} className="mb-3 rounded-3xl" />
          ))
        ) : (
          listings?.map((listing) => (
            <ListingCard key={listing.id} listing={listing} variant="horizontal" />
          ))
        )}

        {!isLoading && !isError && listings?.length === 0 && (
          <View className="items-center py-12">
            <Text variant="h3" className="mb-2 text-center">
              No deals found
            </Text>
            <Text variant="body" className="text-center text-muted">
              Try a different search or category
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
