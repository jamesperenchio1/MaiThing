import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  View,
  ScrollView,
  Image,
  Modal,
  Switch,
  Pressable,
  PanResponder,
  RefreshControl,
} from 'react-native';
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
import { FlashList } from '@shopify/flash-list';
import { useListings, type ListingFilters } from '@/src/hooks/useListings';
import { useCategories, useMerchants } from '@/src/hooks/useMerchants';
import { useRecentSearches } from '@/src/hooks/useRecentSearches';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { CartButton } from '@/src/components/composite/CartButton';
import { DIETARY_TAGS, ALLERGENS } from '@/src/lib/constants';
import { cn, formatCurrency } from '@/src/lib/utils';

type SortOption = NonNullable<ListingFilters['sortBy']>;

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'distance', label: 'Nearest' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'discount', label: 'Biggest Discount' },
  { id: 'newest', label: 'Newest' },
  { id: 'top_rated', label: 'Top Rated' },
  { id: 'going_fast', label: 'Going Fast' },
];

const QUICK_SORT: { id: SortOption; label: string }[] = [
  { id: 'distance', label: 'Nearest' },
  { id: 'top_rated', label: 'Top Rated' },
  { id: 'going_fast', label: 'Going Fast' },
  { id: 'newest', label: 'New' },
];

const RATING_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Any' },
  { value: 3, label: '3★+' },
  { value: 4, label: '4★+' },
  { value: 4.5, label: '4.5★+' },
];

const PRICE_MIN = 0;
const PRICE_MAX = 500;
const PRICE_STEP = 10;

function PriceRangeSlider({
  values,
  onChange,
}: {
  values: [number, number];
  onChange: (range: [number, number]) => void;
}) {
  const colors = useThemeColor();
  const sliderWidthRef = useRef(0);
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const minStartRef = useRef(0);
  const maxStartRef = useRef(0);

  const minPR = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        minStartRef.current = valuesRef.current[0];
      },
      onPanResponderMove: (_, gs) => {
        const sw = sliderWidthRef.current;
        if (sw <= 0) return;
        const raw = minStartRef.current + (gs.dx / sw) * (PRICE_MAX - PRICE_MIN);
        const v =
          Math.round(
            Math.max(PRICE_MIN, Math.min(valuesRef.current[1] - PRICE_STEP, raw)) / PRICE_STEP
          ) * PRICE_STEP;
        if (v !== valuesRef.current[0]) onChangeRef.current([v, valuesRef.current[1]]);
      },
    })
  ).current;

  const maxPR = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        maxStartRef.current = valuesRef.current[1];
      },
      onPanResponderMove: (_, gs) => {
        const sw = sliderWidthRef.current;
        if (sw <= 0) return;
        const raw = maxStartRef.current + (gs.dx / sw) * (PRICE_MAX - PRICE_MIN);
        const v =
          Math.round(
            Math.max(valuesRef.current[0] + PRICE_STEP, Math.min(PRICE_MAX, raw)) / PRICE_STEP
          ) * PRICE_STEP;
        if (v !== valuesRef.current[1]) onChangeRef.current([valuesRef.current[0], v]);
      },
    })
  ).current;

  const minPct = (values[0] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN);
  const maxPct = (values[1] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN);

  return (
    <View className="mb-2">
      <View className="flex-row justify-between mb-3">
        <View className="rounded-xl bg-primary/10 px-3 py-1.5">
          <Text variant="body-sm" className="text-primary font-semibold">
            ฿{values[0]}
          </Text>
        </View>
        <View className="rounded-xl bg-primary/10 px-3 py-1.5">
          <Text variant="body-sm" className="text-primary font-semibold">
            ฿{values[1]}{values[1] >= PRICE_MAX ? '+' : ''}
          </Text>
        </View>
      </View>

      <View
        style={{ paddingHorizontal: 12, paddingVertical: 12 }}
        onLayout={(e) => {
          sliderWidthRef.current = e.nativeEvent.layout.width - 24;
        }}
      >
        <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
          {/* Active track */}
          <View
            style={{
              position: 'absolute',
              height: 4,
              left: `${minPct * 100}%`,
              right: `${(1 - maxPct) * 100}%`,
              backgroundColor: colors.primary,
              borderRadius: 2,
            }}
          />
          {/* Min thumb */}
          <View
            {...minPR.panHandlers}
            style={{
              position: 'absolute',
              left: `${minPct * 100}%`,
              transform: [{ translateX: -12 }, { translateY: -10 }],
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#fff',
              borderWidth: 2.5,
              borderColor: colors.primary,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.18,
              shadowRadius: 4,
              elevation: 4,
            }}
          />
          {/* Max thumb */}
          <View
            {...maxPR.panHandlers}
            style={{
              position: 'absolute',
              left: `${maxPct * 100}%`,
              transform: [{ translateX: -12 }, { translateY: -10 }],
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#fff',
              borderWidth: 2.5,
              borderColor: colors.primary,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.18,
              shadowRadius: 4,
              elevation: 4,
            }}
          />
        </View>
      </View>

      <View className="flex-row justify-between px-1">
        <Text variant="caption" className="text-muted">฿{PRICE_MIN}</Text>
        <Text variant="caption" className="text-muted">฿{PRICE_MAX}+</Text>
      </View>
    </View>
  );
}

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
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [priceEnabled, setPriceEnabled] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
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

  const handleSubmit = (value: string) => {
    setSearchQuery(value);
    addSearch(value);
  };

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
      <View className="mb-4 flex-row items-center gap-3 px-4">
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

      {/* Quick sort chips — bleed to edges */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 24 }}
      >
        {QUICK_SORT.map((opt) => (
          <PressableScale
            key={opt.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSortBy(opt.id);
            }}
            scale={0.95}
            className="mr-2"
          >
            <View
              className={cn(
                'rounded-full border px-5 py-2',
                sortBy === opt.id ? 'border-primary bg-primary' : 'border-border bg-card'
              )}
            >
              <Text
                variant="body-sm"
                className={sortBy === opt.id ? 'text-white font-semibold' : 'text-foreground'}
              >
                {opt.label}
              </Text>
            </View>
          </PressableScale>
        ))}
      </ScrollView>

      {/* Deal of the Day — full bleed */}
      {!searchQuery &&
        listings &&
        listings.length > 0 &&
        (() => {
          const featured = [...listings].sort(
            (a, b) => 1 - b.salePrice / b.originalPrice - (1 - a.salePrice / a.originalPrice)
          )[0];
          const discount = Math.round((1 - featured.salePrice / featured.originalPrice) * 100);
          return (
            <PressableScale
              onPress={() => router.push(`/(customer)/listing/${featured.id}` as any)}
              scale={0.99}
              className="mb-3"
            >
              <View className="h-44 overflow-hidden">
                <Image
                  source={{ uri: featured.images[0] }}
                  className="absolute inset-0 h-full w-full"
                  resizeMode="cover"
                />
                <View className="absolute inset-0 bg-black/40" />
                <View
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: '60%', backgroundColor: 'rgba(0,0,0,0.35)' }}
                />
                <View className="absolute inset-0 p-4 justify-between">
                  <View className="self-start bg-primary rounded-full px-3 py-1">
                    <Text variant="caption" className="text-white font-bold tracking-wide">
                      Deal of the Day
                    </Text>
                  </View>
                  <View>
                    <Text variant="h3" className="text-white mb-1" numberOfLines={1}>
                      {featured.title}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-white text-xl font-bold">
                        {formatCurrency(featured.salePrice)}
                      </Text>
                      <Text className="text-white/60 text-sm line-through ml-2">
                        {formatCurrency(featured.originalPrice)}
                      </Text>
                      <View className="ml-2 bg-white/90 rounded-full px-2.5 py-0.5">
                        <Text variant="caption" className="text-primary font-bold">
                          -{discount}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </PressableScale>
          );
        })()}

      {/* Top Rated Shops — wide photo cards */}
      {topRatedMerchants.length > 0 && !searchQuery && (
        <View className="mb-3">
          <View className="mb-3 flex-row items-center justify-between px-4">
            <Text variant="h3">Top Rated Shops</Text>
            <PressableScale
              onPress={() => router.push('/(customer)/(tabs)/map' as any)}
              scale={0.95}
            >
              <Text variant="caption" className="text-primary font-medium">
                See on map
              </Text>
            </PressableScale>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 24 }}
          >
            {topRatedMerchants.map((merchant) => (
              <PressableScale
                key={merchant.id}
                onPress={() => router.push(`/(customer)/merchant/${merchant.id}` as any)}
                scale={0.97}
                className="mr-3"
              >
                <View
                  style={{ width: 140, height: 100 }}
                  className="rounded-2xl overflow-hidden"
                >
                  <Image
                    source={{ uri: merchant.coverUrl ?? merchant.logoUrl }}
                    style={{ width: 140, height: 100 }}
                    resizeMode="cover"
                  />
                  {/* gradient overlay */}
                  <View className="absolute inset-0 bg-black/30" />
                  <View
                    className="absolute bottom-0 left-0 right-0"
                    style={{ height: '65%', backgroundColor: 'rgba(0,0,0,0.35)' }}
                  />
                  <View className="absolute bottom-0 left-0 right-0 p-2.5">
                    <Text
                      variant="caption"
                      className="text-white font-semibold"
                      numberOfLines={1}
                    >
                      {merchant.name}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <Text style={{ color: '#FBBF24', fontSize: 10 }}>★</Text>
                      <Text
                        style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, marginLeft: 2 }}
                      >
                        {merchant.rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent searches */}
      {!searchQuery && recent.length > 0 && (
        <View className="mb-2 px-4">
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

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-2"
        contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 24 }}
      >
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
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
            onPress={() => setFilterVisible(false)}
          />
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
                      Min Rating
                    </Text>
                    <View className="flex-row flex-wrap">
                      {RATING_OPTIONS.map((opt) => (
                        <FilterChip
                          key={opt.value}
                          label={opt.label}
                          selected={minRating === opt.value}
                          onPress={() => setMinRating(opt.value)}
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
                        onValueChange={(v) => setPriceEnabled(v)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#fff"
                      />
                    </View>
                    {priceEnabled && (
                      <PriceRangeSlider
                        values={priceRange}
                        onChange={(range) => setPriceRange(range)}
                      />
                    )}
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
        </View>
      </Modal>

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
          renderItem={({ item }) => <ListingCard listing={item} variant="horizontal" />}
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
