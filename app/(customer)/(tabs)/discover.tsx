import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Screen } from '@/src/components/layout/Screen';
import { ListingCard } from '@/src/components/composite/ListingCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { FlashList } from '@shopify/flash-list';
import { useListings } from '@/src/hooks/useListings';
import { useCategories, useMerchants } from '@/src/hooks/useMerchants';
import { useRecentSearches } from '@/src/hooks/useRecentSearches';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { useFocusEffect } from 'expo-router';
import { CartButton } from '@/src/components/composite/CartButton';

import { SearchHeader } from './_components/SearchHeader';
import { QuickSortChips } from './_components/QuickSortChips';
import { DealOfTheDayCard } from './_components/DealOfTheDayCard';
import { TopRatedShopsRow } from './_components/TopRatedShopsRow';
import { RecentSearchesRow } from './_components/RecentSearchesRow';
import { CategoryChipsRow } from './_components/CategoryChipsRow';
import { FilterSheet } from './_components/FilterSheet';
import { PRICE_MIN, PRICE_MAX, type SortOption } from './_components/constants';

export default function DiscoverScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { query } = useLocalSearchParams<{ query?: string }>();
  const [searchQuery, setSearchQuery] = useState(query ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(query ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [listingType, setListingType] = useState<'all' | 'mystery_box' | 'fixed_item'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [priceEnabled, setPriceEnabled] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const { recent, addSearch, removeSearch, clearSearches } = useRecentSearches();

  const { screenView } = useAnalytics();
  useFocusEffect(() => {
    screenView('customer_discover');
  });

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
      minPrice: priceEnabled && priceRange[0] > PRICE_MIN ? priceRange[0] : undefined,
      maxPrice: priceEnabled && priceRange[1] < PRICE_MAX ? priceRange[1] : undefined,
      minMerchantRating: minRating > 0 ? minRating : undefined,
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
      priceRange,
      priceEnabled,
      minRating,
    ]
  );

  const { data: listings, isLoading, isRefetching, isError, refetch } = useListings(filters);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  const { data: categories } = useCategories();
  const { data: merchants } = useMerchants({ lat: 13.7462, lng: 100.5347, radius: 50000 });
  const topRatedMerchants = useMemo(
    () => [...(merchants ?? [])].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [merchants]
  );

  const handleSubmit = useCallback(
    (value: string) => {
      setSearchQuery(value);
      addSearch(value);
    },
    [addSearch]
  );

  const featuredDeal = useMemo(() => {
    if (searchQuery || !listings || listings.length === 0) return null;
    return [...listings].sort(
      (a, b) => 1 - b.salePrice / b.originalPrice - (1 - a.salePrice / a.originalPrice)
    )[0];
  }, [searchQuery, listings]);

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (listingType !== 'all' ? 1 : 0) +
    selectedTags.length +
    excludedAllergens.length +
    (priceEnabled ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory(null);
    setListingType('all');
    setSortBy('distance');
    setSelectedTags([]);
    setExcludedAllergens([]);
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setPriceEnabled(false);
    setMinRating(0);
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

  const handleCategorySelect = useCallback((id: string) => {
    setSelectedCategory((prev) => (prev === id ? null : id));
  }, []);

  const listHeader = (
    <View className="pt-4 pb-2">
      {/* Title + cart */}
      <View className="mb-4 flex-row items-center justify-between px-4">
        <Text testID="discover-title" variant="h1">
          {t('common.discover')}
        </Text>
        <CartButton />
      </View>

      {/* Search + filter */}
      <SearchHeader
        searchQuery={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={handleSubmit}
        onFilterPress={() => setFilterVisible(true)}
        activeFilterCount={activeFilterCount}
        searchPlaceholder={t('common.search')}
        filterAccessibilityLabel={t('common.filter')}
      />

      {/* Quick sort chips — bleed to edges */}
      <QuickSortChips sortBy={sortBy} onChange={setSortBy} />

      {/* Deal of the Day — full bleed */}
      {featuredDeal && (
        <DealOfTheDayCard
          deal={featuredDeal}
          onPress={() => router.push(`/(customer)/listing/${featuredDeal.id}` as any)}
        />
      )}

      {/* Top Rated Shops — wide photo cards */}
      {topRatedMerchants.length > 0 && !searchQuery && (
        <TopRatedShopsRow
          merchants={topRatedMerchants}
          onSeeMap={() => router.push('/(customer)/(tabs)/map' as any)}
          onMerchantPress={(id) => router.push(`/(customer)/merchant/${id}` as any)}
        />
      )}

      {/* Recent searches */}
      {!searchQuery && recent.length > 0 && (
        <RecentSearchesRow
          recent={recent}
          onSelect={setSearchQuery}
          onRemove={removeSearch}
          onClear={clearSearches}
        />
      )}

      {/* Category chips */}
      <CategoryChipsRow
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={handleCategorySelect}
        locale={i18n.language as 'en' | 'th'}
      />
    </View>
  );

  const listEmpty = (
    <View className="items-center py-12">
      <Text variant="h3" className="mb-2 text-center">
        No deals found
      </Text>
      <Text variant="body" className="text-center text-muted">
        Try a different search or category
      </Text>
    </View>
  );

  return (
    <Screen testID="discover-screen" scrollable={false} className="bg-background">
      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filterLabel={t('common.filter')}
        sortLabel={t('common.sort')}
        resetLabel={t('common.reset')}
        applyLabel={t('common.apply')}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        listingType={listingType}
        onListingTypeChange={setListingType}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        excludedAllergens={excludedAllergens}
        onToggleAllergen={toggleAllergen}
        minRating={minRating}
        onMinRatingChange={setMinRating}
        priceEnabled={priceEnabled}
        onPriceEnabledChange={setPriceEnabled}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        onReset={resetFilters}
      />

      {isError || isLoading ? (
        <View className="flex-1 pb-6">
          {listHeader}
          {isError ? (
            <ErrorState
              title={t('common.error')}
              message="We couldn't load deals right now."
              onRetry={refetch}
              retryLabel={t('common.retry')}
            />
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={140} className="mb-3 rounded-3xl" />
            ))
          )}
        </View>
      ) : (
        <FlashList
          className="flex-1"
          data={listings ?? []}
          renderItem={({ item, index }) => (
            <ListingCard listing={item} variant="horizontal" testID={`listing-card-${index}`} />
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={140}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}
