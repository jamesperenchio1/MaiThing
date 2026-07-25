import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image } from 'react-native';
import { MapPin, Bell } from 'lucide-react-native';
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
import { useListings } from '@/src/hooks/useListings';
import { useMerchants, useCategories } from '@/src/hooks/useMerchants';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';

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

  const isRefreshing = listingsRefetching || merchantsRefetching;
  const handleRefresh = () => {
    Promise.all([refetchListings(), refetchMerchants()]);
  };

  const hasError = listingsError || merchantsError;

  return (
    <Screen
      testID="customer-home-screen"
      scrollable
      className="bg-background"
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
    >
      <View className="px-6 pt-4 pb-6">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text variant="body-sm" className="text-muted">
              {t('customer.home.greeting', { timeOfDay: 'morning' })}
            </Text>
            <Text variant="h3">{user?.name ?? 'Guest'}</Text>
          </View>
          <Button
            variant="ghost"
            size="icon"
            onPress={() => router.push('/(customer)/notifications' as any)}
          >
            <Bell size={24} color={colors.foreground} />
          </Button>
        </View>

        <Animated.View entering={FadeInUp.duration(500)}>
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
      </View>

      {hasError && (
        <View className="px-6 pb-6">
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your feed. Pull down to try again."
            onRetry={handleRefresh}
            retryLabel={t('common.retry')}
          />
        </View>
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

      <View testID="home-near-you-section" className="px-6 pb-6">
        <SectionHeader
          title={t('customer.home.nearYou')}
          action={t('common.seeAll')}
          onPress={() => router.push('/(customer)/(tabs)/discover' as any)}
        />
        {listingsLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={120} className="mb-3 rounded-3xl" />
            ))
          : nearbyListings.map((listing, index) => (
              <View key={listing.id} testID={index === 0 ? 'first-nearby-listing' : undefined}>
                <ListingCard listing={listing} variant="horizontal" />
              </View>
            ))}
      </View>
    </Screen>
  );
}
