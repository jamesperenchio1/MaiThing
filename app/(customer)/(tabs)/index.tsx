import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, RefreshControl, Dimensions, StyleSheet } from 'react-native';
import { Image } from '@/src/components/ui/Image';
import * as Haptics from 'expo-haptics';
import { Bell, MapPin } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/layout/SearchBar';
import { ListingCard } from '@/src/components/composite/ListingCard';
import { MerchantCard } from '@/src/components/composite/MerchantCard';
import { CategoryChip } from '@/src/components/composite/CategoryChip';
import { SectionHeader } from '@/src/components/composite/SectionHeader';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { FlashList } from '@shopify/flash-list';
import { useListings } from '@/src/hooks/useListings';
import { useMerchants, useCategories } from '@/src/hooks/useMerchants';
import { useCustomerImpact } from '@/src/hooks/useImpact';
import { useCustomerProfile } from '@/src/hooks/useFavorites';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import { usePersonalityStore } from '@/src/stores/personality';
import { CartButton } from '@/src/components/composite/CartButton';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { useFocusEffect } from 'expo-router';
import { ImpactWidget } from '@/src/components/composite/ImpactWidget';
import { MealTimeShortcuts } from '@/src/components/composite/MealTimeShortcuts';
import { CollectionSection } from '@/src/components/composite/CollectionSection';
import { MapPreviewCard } from '@/src/components/composite/MapPreviewCard';
import { formatCurrency, getMealTimeForHour, cn } from '@/src/lib/utils';
import { useResponsiveScale } from '@/src/lib/responsive';
import { DEFAULT_USER_LOCATION } from '@/src/lib/constants';
import type { MealTimeId } from '@/src/lib/constants';
import type { Listing } from '@/src/types';

function filterListingsByMealTime(listings: Listing[], mealTime: MealTimeId | null) {
  if (!mealTime) return listings;
  return listings.filter((l) => {
    const hour = new Date(l.pickupWindowStart).getHours();
    return getMealTimeForHour(hour) === mealTime;
  });
}

/* Personality key → listing category id */
const CATEGORY_MAP: Record<string, string> = {
  cafes: 'cafe',
  bakeries: 'bakery',
  restaurants: 'restaurant',
  grocery: 'grocery',
  streetFood: 'street_food',
  desserts: 'dessert',
  healthy: 'healthy',
  halal: 'halal',
};

function filterByPersonality(listings: Listing[], personality: ReturnType<typeof usePersonalityStore.getState>) {
  if (!personality.onboardingCompleted) return null;

  return listings.filter((l) => {
    // Category filter
    if (personality.preferredCategories.length > 0) {
      const mapped = personality.preferredCategories.map((k) => CATEGORY_MAP[k] ?? k);
      if (!mapped.includes(l.category)) return false;
    }

    // Price filter
    if (personality.priceRange && personality.priceRange !== 'any') {
      const priceMap: Record<string, [number, number]> = {
        budget: [0, 50],
        mid: [50, 100],
        premium: [100, 200],
        luxury: [200, Infinity],
      };
      const [min, max] = priceMap[personality.priceRange] ?? [0, Infinity];
      if (l.salePrice < min || l.salePrice > max) return false;
    }

    // Discovery style filter
    if (personality.discoveryStyle && personality.discoveryStyle !== 'both') {
      if (personality.discoveryStyle === 'mystery' && l.type !== 'mystery_box') return false;
      if (personality.discoveryStyle === 'fixed' && l.type !== 'fixed_item') return false;
    }

    // Dietary / allergen filter
    const prefs = personality.dietaryPreferences;
    if (prefs.length > 0 && !prefs.includes('noRestrictions')) {
      // Hard exclude: allergen conflicts
      const allergenMap: Record<string, string[]> = {
        nutFree: ['nuts', 'peanuts', 'tree nuts'],
        glutenFree: ['gluten', 'wheat'],
        dairyFree: ['dairy', 'milk'],
      };
      for (const pref of prefs) {
        const forbidden = allergenMap[pref];
        if (forbidden) {
          const hasForbidden = l.allergens.some((a) =>
            forbidden.some((f) => a.toLowerCase().includes(f.toLowerCase()))
          );
          if (hasForbidden) return false;
        }
      }
      // Soft include: lifestyle preferences (vegetarian, vegan, halal)
      const lifestylePrefs = prefs.filter((p) => ['vegetarian', 'vegan', 'halal'].includes(p));
      if (lifestylePrefs.length > 0) {
        const hasMatch = lifestylePrefs.some((pref) =>
          l.dietaryTags.some((tag) => tag.toLowerCase().includes(pref.toLowerCase()))
        );
        if (!hasMatch) return false;
      }
    }

    return true;
  });
}

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { scale } = useResponsiveScale();
  const tabBarExtra = Math.round(72 * scale);
  const listBottomPadding = 24 + tabBarExtra;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMealTime, setSelectedMealTime] = useState<MealTimeId | null>(null);

  const personality = usePersonalityStore();

  const { screenView } = useAnalytics();
  useFocusEffect(() => {
    screenView('customer_home');
  });

  const {
    data: listings,
    isLoading: listingsLoading,
    isRefetching: listingsRefetching,
    isError: listingsError,
    refetch: refetchListings,
  } = useListings({
    category: selectedCategory ?? undefined,
    lat: DEFAULT_USER_LOCATION.latitude,
    lng: DEFAULT_USER_LOCATION.longitude,
    radius: 20000,
  });

  const {
    data: merchants,
    isLoading: merchantsLoading,
    isRefetching: merchantsRefetching,
    isError: merchantsError,
    refetch: refetchMerchants,
  } = useMerchants({
    lat: DEFAULT_USER_LOCATION.latitude,
    lng: DEFAULT_USER_LOCATION.longitude,
    radius: 20000,
  });

  const { data: categories } = useCategories();
  const { data: impact } = useCustomerImpact(user?.id);
  const { data: profile } = useCustomerProfile(user?.id ?? '');

  const favoriteMerchantIds = useMemo(() => new Set(profile?.favorites ?? []), [profile]);

  const filteredListings = useMemo(
    () => filterListingsByMealTime(listings ?? [], selectedMealTime),
    [listings, selectedMealTime]
  );

  const featuredMerchants = merchants?.slice(0, 5) ?? [];
  const nearbyListings = filteredListings.slice(0, 6);

  // Personality-based "For You" section
  const forYouListings = useMemo(() => {
    const filtered = filterByPersonality(listings ?? [], personality);
    if (filtered === null) return [];
    return filtered.slice(0, 6);
  }, [listings, personality]);

  const favoriteListings = useMemo(
    () => (listings ?? []).filter((l) => favoriteMerchantIds.has(l.merchantId)).slice(0, 6),
    [listings, favoriteMerchantIds]
  );

  const under100 = useMemo(
    () => (listings ?? []).filter((l) => l.salePrice <= 100).slice(0, 6),
    [listings]
  );

  // Merges the former "Going Fast" (low stock) and "Ending Soon" (soonest pickup)
  // rails — both are urgency signals already surfaced per-card via UrgencyBadge.
  const almostGone = useMemo(
    () =>
      [...(listings ?? [])]
        .filter(
          (l) =>
            l.status === 'active' &&
            l.quantityRemaining > 0 &&
            new Date(l.pickupWindowEnd).getTime() > Date.now()
        )
        .sort((a, b) => {
          if (a.quantityRemaining !== b.quantityRemaining) {
            return a.quantityRemaining - b.quantityRemaining;
          }
          return new Date(a.pickupWindowEnd).getTime() - new Date(b.pickupWindowEnd).getTime();
        })
        .slice(0, 6),
    [listings]
  );

  const mysteryBoxes = useMemo(
    () => (listings ?? []).filter((l) => l.type === 'mystery_box').slice(0, 6),
    [listings]
  );

  const scrollRef = useRef<ScrollView>(null);
  const currentSlide = useRef(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideWidth, setSlideWidth] = useState(Dimensions.get('window').width);
  const onCarouselLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    setSlideWidth(e.nativeEvent.layout.width);
  }, []);

  const promoListings = useMemo(
    () =>
      [...(listings ?? [])]
        .filter((l) => l.status === 'active')
        .sort((a, b) => 1 - b.salePrice / b.originalPrice - (1 - a.salePrice / a.originalPrice))
        .slice(0, 5),
    [listings]
  );

  useEffect(() => {
    if (promoListings.length <= 1) return;
    const interval = setInterval(() => {
      currentSlide.current = (currentSlide.current + 1) % promoListings.length;
      setActiveSlide(currentSlide.current);
      scrollRef.current?.scrollTo({ x: currentSlide.current * slideWidth, animated: true });
    }, 4000);
    return () => clearInterval(interval);
  }, [promoListings.length, slideWidth]);

  const isRefreshing = listingsRefetching || merchantsRefetching;
  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Promise.all([refetchListings(), refetchMerchants()]);
  };

  const hasError = listingsError || merchantsError;

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  const listHeader = (
    <View className="pt-4 pb-6">
      <View testID="home-hero-title" className="px-5 mb-4 flex-row items-center justify-between">
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <Text variant="body-sm" className="text-muted">
            {t('customer.home.greeting', { timeOfDay })}
          </Text>
          <Text testID="home-hero-subtitle" variant="h3">
            {user?.name ?? 'Guest'}
          </Text>
        </Animated.View>
        <Animated.View
          entering={FadeInRight.duration(400).delay(100).springify()}
          className="flex-row items-center space-x-1"
        >
          <CartButton />
          <Button
            variant="ghost"
            size="icon"
            onPress={() => router.push('/(customer)/notifications' as any)}
          >
            <Bell size={24} color={colors.foreground} />
          </Button>
        </Animated.View>
      </View>

      {impact && (
        <Animated.View entering={ZoomIn.duration(400).delay(80).springify()} className="px-5">
          <ImpactWidget impact={impact} />
        </Animated.View>
      )}

      {/* Full-width promo banner — bleeds edge to edge */}
      <Animated.View entering={FadeInDown.duration(500).delay(150)} className="mb-6">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onLayout={onCarouselLayout}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
            currentSlide.current = index;
            setActiveSlide(index);
          }}
        >
          {promoListings.map((listing) => {
            const merchantName = merchants?.find((m) => m.id === listing.merchantId)?.name ?? '';
            const discount = Math.round((1 - listing.salePrice / listing.originalPrice) * 100);
            return (
              <PressableScale
                key={listing.id}
                onPress={() => router.push(`/(customer)/listing/${listing.id}` as any)}
                scale={0.98}
              >
                <View style={{ width: slideWidth, height: 220 }}>
                  <Image
                    source={{ uri: listing.images[0] }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/10" />
                  <View className="absolute bottom-0 left-0 right-0 h-1/2 bg-black/60" />
                  <View className="absolute top-3 left-5">
                    <Text variant="caption" className="text-white/80">
                      {merchantName}
                    </Text>
                  </View>
                  <View className="absolute bottom-0 left-0 right-0 p-5">
                    <Text
                      variant="body-sm"
                      className="text-white font-semibold mb-1"
                      numberOfLines={2}
                    >
                      {listing.title}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-white text-xl font-bold">
                        {formatCurrency(listing.salePrice)}
                      </Text>
                      <Text className="text-white/70 text-sm line-through ml-2">
                        {formatCurrency(listing.originalPrice)}
                      </Text>
                      <View className="ml-2 bg-white rounded-full px-2 py-0.5">
                        <Text variant="caption" className="text-primary font-bold">
                          -{discount}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
        {promoListings.length > 1 && (
          <View className="flex-row justify-center mt-3 gap-1.5">
            {promoListings.map((_, i) => (
              <View
                key={i}
                className={`h-1.5 rounded-full bg-foreground ${i === activeSlide ? 'w-4' : 'w-1.5 opacity-30'}`}
              />
            ))}
          </View>
        )}
      </Animated.View>

      <SearchBar
        placeholder={t('common.search')}
        className="mb-6 mx-5"
        onSubmit={(query) =>
          router.push({ pathname: '/(customer)/(tabs)/discover', params: { query } })
        }
      />

      <View className="mb-2">
        <SectionHeader title={t('customer.home.categories')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories?.map((category, index) => (
            <CategoryChip
              key={category.id}
              category={category}
              isActive={selectedCategory === category.id}
              onPress={() =>
                setSelectedCategory((prev) => (prev === category.id ? null : category.id))
              }
              locale={i18n.language as 'en' | 'th'}
              className={index === (categories?.length ?? 0) - 1 ? 'mr-0' : 'mr-3'}
            />
          ))}
        </ScrollView>
      </View>

      <View className="px-4">
        <SectionHeader title={t('customer.home.cravingNow')} className="mb-2" />
      </View>
      <MealTimeShortcuts
        selected={selectedMealTime}
        onSelect={setSelectedMealTime}
        locale={i18n.language as 'en' | 'th'}
      />

      {almostGone.length > 0 && (
        <CollectionSection
          title={t('customer.home.almostGone')}
          listings={almostGone}
          variant="featured"
          onSeeAll={() =>
            router.push({
              pathname: '/(customer)/(tabs)/discover',
              params: { sortBy: 'going_fast' },
            })
          }
        />
      )}

      {/* Personality-based "For You" */}
      {forYouListings.length > 0 && (
        <CollectionSection
          title={t('customer.home.forYou')}
          listings={forYouListings}
          onSeeAll={() => router.push('/(customer)/(tabs)/discover' as any)}
        />
      )}

      {favoriteListings.length > 0 && (
        <CollectionSection
          title={t('common.favorites')}
          listings={favoriteListings}
          onSeeAll={() => router.push('/(customer)/favorites' as any)}
        />
      )}

      {under100.length > 0 && (
        <CollectionSection
          title={t('customer.home.under100')}
          listings={under100}
          variant="compact"
          onSeeAll={() => router.push('/(customer)/(tabs)/discover' as any)}
        />
      )}

      {mysteryBoxes.length > 0 && (
        <CollectionSection
          title={t('customer.home.mysteryBoxes')}
          listings={mysteryBoxes}
          variant="compact"
          onSeeAll={() =>
            router.push({
              pathname: '/(customer)/(tabs)/discover',
              params: { type: 'mystery_box' },
            })
          }
        />
      )}

      <View testID="home-featured-section" className="mb-6">
        <View className="px-4">
          <SectionHeader
            title={t('customer.home.featured')}
            action={t('common.seeAll')}
            onPress={() => router.push('/(customer)/(tabs)/discover' as any)}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {merchantsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} width={280} height={160} className="mr-3 rounded-3xl" />
              ))
            : featuredMerchants.map((merchant, index) => (
                <View
                  key={merchant.id}
                  className={cn('w-72', index === featuredMerchants.length - 1 ? '' : 'mr-3')}
                >
                  <MerchantCard
                    merchant={merchant}
                    testID={index === 0 ? 'first-featured-merchant' : undefined}
                  />
                </View>
              ))}
        </ScrollView>
      </View>

      {merchants && merchants.length > 0 && (
        <View className="mb-6">
          <MapPreviewCard
            title={t('customer.home.mapTitle', { count: merchants.length })}
            subtitle={t('customer.home.mapSubtitle')}
            buttonLabel={t('customer.home.openMap')}
            merchants={merchants}
            onPress={() => router.push('/(customer)/(tabs)/map' as any)}
          />
        </View>
      )}

      {hasError && (
        <View className="mb-6">
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your feed. Pull down to try again."
            onRetry={handleRefresh}
            retryLabel={t('common.retry')}
          />
        </View>
      )}

      <View className="px-5">
        <SectionHeader
          title={t('customer.home.nearYou')}
          action={t('common.seeAll')}
          onPress={() => router.push('/(customer)/(tabs)/discover' as any)}
        />
      </View>
    </View>
  );

  const listEmpty = listingsLoading ? (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={120} className="mb-3 rounded-3xl" />
      ))}
    </>
  ) : null;

  return (
    <Screen testID="customer-home-screen" scrollable={false} className="bg-background">
      <FlashList
        className="flex-1"
        data={nearbyListings}
        renderItem={({ item, index }) => (
          <View className="px-5">
            <ListingCard
              listing={item}
              variant="horizontal"
              testID={index === 0 ? 'first-nearby-listing' : undefined}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: listBottomPadding }}
      />
    </Screen>
  );
}
