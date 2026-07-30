import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Bell, MapPin } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
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
import { getMealTimeForHour, cn } from '@/src/lib/utils';
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
        .sort((a, b) => new Date(a.pickupWindowEnd).getTime() - new Date(b.pickupWindowEnd).getTime())
        .slice(0, 6),
    [listings]
  );

  const under100 = useMemo(
    () => (listings ?? []).filter((l) => l.salePrice <= 100).slice(0, 6),
    [listings]
  );

  const mysteryBoxes = useMemo(
    () => (listings ?? []).filter((l) => l.type === 'mystery_box').slice(0, 6),
    [listings]
  );

  const isRefreshing = listingsRefetching || merchantsRefetching;
  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Promise.all([refetchListings(), refetchMerchants()]);
  };

  const hasError = listingsError || merchantsError;

  const listHeader = (
    <View className="pt-4 pb-6">
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text variant="body-sm" className="text-muted">
            {t('customer.home.greeting', { timeOfDay: 'morning' })}
          </Text>
          <Text variant="h3">{user?.name ?? 'Guest'}</Text>
        </View>
        <View className="flex-row items-center space-x-1">
          <CartButton />
          <Button
            variant="ghost"
            size="icon"
            onPress={() => router.push('/(customer)/notifications' as any)}
          >
            <Bell size={24} color={colors.foreground} />
          </Button>
        </View>
      </View>

      {impact && (
        <Animated.View entering={FadeInUp.duration(500)}>
          <ImpactWidget impact={impact} />
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.duration(500).delay(100)}>
        <View testID="home-hero-card" className="mb-6 rounded-3xl bg-primary p-6">
          <Text testID="home-hero-title" variant="h2" className="mb-2 text-white">
            {t('customer.home.heroTitle')}
          </Text>
          <Text testID="home-hero-subtitle" variant="body" className="mb-4 text-white/80">
            {t('customer.home.heroSubtitle')}
          </Text>
          <Button
            variant="secondary"
            className="self-start bg-white"
            textClassName="text-primary"
            onPress={() => router.push('/(customer)/(tabs)/discover' as any)}
          >
            {t('common.discover')}
          </Button>
        </View>
      </Animated.View>

      <SearchBar
        placeholder={t('common.search')}
        className="mb-6"
        onSubmit={(query) =>
          router.push({ pathname: '/(customer)/(tabs)/discover', params: { query } })
        }
      />

      <View className="mb-2">
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

      <SectionHeader title={t('customer.home.cravingNow')} className="mb-2" />
      <MealTimeShortcuts
        selected={selectedMealTime}
        onSelect={setSelectedMealTime}
        locale={i18n.language as 'en' | 'th'}
      />

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
            router.push({ pathname: '/(customer)/(tabs)/discover', params: { type: 'mystery_box' } })
          }
        />
      )}

      <View testID="home-featured-section" className="mb-6">
        <SectionHeader
          title={t('customer.home.featured')}
          action={t('common.seeAll')}
          onPress={() => router.push('/(customer)/(tabs)/discover' as any)}
        />
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

      <SectionHeader
        title={t('customer.home.nearYou')}
        action={t('common.seeAll')}
        onPress={() => router.push('/(customer)/(tabs)/discover' as any)}
      />
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
          <ListingCard
            listing={item}
            variant="horizontal"
            testID={index === 0 ? 'first-nearby-listing' : undefined}
          />
        )}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
      />
    </Screen>
  );
}
