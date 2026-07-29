import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image, RefreshControl, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MapPin, Bell } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

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
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import { CartButton } from '@/src/components/composite/CartButton';
import { formatCurrency } from '@/src/lib/utils';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    data: listings,
    isLoading: listingsLoading,
    isRefetching: listingsRefetching,
    isError: listingsError,
    refetch: refetchListings,
  } = useListings({
    category: selectedCategory ?? undefined,
    lat: 13.7462,
    lng: 100.5347,
    radius: 20000,
  });

  const {
    data: merchants,
    isLoading: merchantsLoading,
    isRefetching: merchantsRefetching,
    isError: merchantsError,
    refetch: refetchMerchants,
  } = useMerchants({
    lat: 13.7462,
    lng: 100.5347,
    radius: 20000,
  });

  const { data: categories } = useCategories();

  const featuredMerchants = merchants?.slice(0, 5) ?? [];
  const nearbyListings = listings?.slice(0, 6) ?? [];

  const scrollRef = useRef<ScrollView>(null);
  const currentSlide = useRef(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const slideWidth = Dimensions.get('window').width - 48;

  const promoListings = useMemo(
    () =>
      [...(listings ?? [])]
        .filter((l) => l.status === 'active')
        .sort(
          (a, b) =>
            1 - b.salePrice / b.originalPrice - (1 - a.salePrice / a.originalPrice)
        )
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

      <Animated.View entering={FadeInUp.duration(500)} className="mb-6">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
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
                <View
                  style={{ width: slideWidth, height: 200 }}
                  className="rounded-3xl overflow-hidden"
                >
                  <Image
                    source={{ uri: listing.images[0] }}
                    className="absolute inset-0 w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/10" />
                  <View className="absolute bottom-0 left-0 right-0 h-1/2 bg-black/60" />
                  <View className="absolute top-3 left-4">
                    <Text variant="caption" className="text-white/80">
                      {merchantName}
                    </Text>
                  </View>
                  <View className="absolute bottom-0 left-0 right-0 p-4">
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
          <View className="flex-row justify-center mt-3 space-x-1.5">
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
        className="mb-6"
        onSubmit={(query) =>
          router.push({ pathname: '/(customer)/(tabs)/discover', params: { query } })
        }
      />

      <View className="mb-2">
        <SectionHeader title={t('customer.home.categories')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
