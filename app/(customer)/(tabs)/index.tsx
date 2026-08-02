import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image, RefreshControl, Dimensions, StyleSheet } from 'react-native';
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
import { CartButton } from '@/src/components/composite/CartButton';
import { ImpactWidget } from '@/src/components/composite/ImpactWidget';
import { MealTimeShortcuts } from '@/src/components/composite/MealTimeShortcuts';
import { CollectionSection } from '@/src/components/composite/CollectionSection';
import { MapPreviewCard } from '@/src/components/composite/MapPreviewCard';
import { formatCurrency, getMealTimeForHour } from '@/src/lib/utils';
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

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMealTime, setSelectedMealTime] = useState<MealTimeId | null>(null);

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

  const favoriteListings = useMemo(
    () => (listings ?? []).filter((l) => favoriteMerchantIds.has(l.merchantId)).slice(0, 6),
    [listings, favoriteMerchantIds]
  );

  const endingSoon = useMemo(
    () =>
      [...(listings ?? [])]
        .filter((l) => new Date(l.pickupWindowEnd).getTime() > Date.now())
        .sort(
          (a, b) => new Date(a.pickupWindowEnd).getTime() - new Date(b.pickupWindowEnd).getTime()
        )
        .slice(0, 6),
    [listings]
  );

  const under100 = useMemo(
    () => (listings ?? []).filter((l) => l.salePrice <= 100).slice(0, 6),
    [listings]
  );

  const goingFast = useMemo(
    () =>
      [...(listings ?? [])]
        .filter((l) => l.status === 'active' && l.quantityRemaining > 0 && l.quantityRemaining <= 3)
        .sort((a, b) => a.quantityRemaining - b.quantityRemaining)
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
      <View className="px-5 mb-4 flex-row items-center justify-between">
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <Text variant="body-sm" className="text-muted">
            {t('customer.home.greeting', { timeOfDay })}
          </Text>
          <Text variant="h3">{user?.name ?? 'Guest'}</Text>
        </Animated.View>
        <Animated.View entering={FadeInRight.duration(400).delay(100).springify()} className="flex-row items-center space-x-1">
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

      <View className="mb-2 px-4">
        <SectionHeader title={t('customer.home.categories')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
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

      <View className="px-4">
      <SectionHeader title={t('customer.home.cravingNow')} className="mb-2" />
      </View>
      <MealTimeShortcuts
        selected={selectedMealTime}
        onSelect={setSelectedMealTime}
        locale={i18n.language as 'en' | 'th'}
      />

      {goingFast.length > 0 && (
        <CollectionSection
          title="Going Fast"
          listings={goingFast}
          onSeeAll={() =>
            router.push({
              pathname: '/(customer)/(tabs)/discover',
              params: { sortBy: 'going_fast' },
            })
          }
        />
      )}

      {favoriteListings.length > 0 && (
        <CollectionSection
          title={t('customer.home.forYou')}
          listings={favoriteListings}
          onSeeAll={() => router.push('/(customer)/favorites' as any)}
        />
      )}

      {endingSoon.length > 0 && (
        <CollectionSection
          title={t('customer.home.endingSoon')}
          listings={endingSoon}
          onSeeAll={() => router.push('/(customer)/(tabs)/discover' as any)}
        />
      )}

      {under100.length > 0 && (
        <CollectionSection
          title={t('customer.home.under100')}
          listings={under100}
          onSeeAll={() => router.push('/(customer)/(tabs)/discover' as any)}
        />
      )}

      {mysteryBoxes.length > 0 && (
        <CollectionSection
          title={t('customer.home.mysteryBoxes')}
          listings={mysteryBoxes}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {merchantsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} width={280} height={160} className="mr-3 rounded-3xl" />
              ))
            : featuredMerchants.map((merchant, index) => (
                <View key={merchant.id} className="mr-3 w-72">
                  <MerchantCard
                    merchant={merchant}
                    testID={index === 0 ? 'first-featured-merchant' : undefined}
                  />
                </View>
              ))}
        </ScrollView>
      </View>

      {merchants && merchants.length > 0 && (
        <MapPreviewCard
          title={t('customer.home.mapTitle', { count: merchants.length })}
          subtitle={t('customer.home.mapSubtitle')}
          buttonLabel={t('customer.home.openMap')}
          merchants={merchants}
          onPress={() => router.push('/(customer)/(tabs)/map' as any)}
        />
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
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Screen>
  );
}
