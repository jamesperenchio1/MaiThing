import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Share, Linking, ScrollView } from 'react-native';
import { Image } from '@/src/components/ui/Image';
import { useRouter } from 'expo-router';
import {
  LocateFixed,
  LocateOff,
  Star,
  MapPin,
  X,
  Phone,
  Navigation,
  Share2,
  Store,
} from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/layout/SearchBar';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { FavoriteButton } from '@/src/components/composite/FavoriteButton';
import { CategoryChip } from '@/src/components/composite/CategoryChip';
import { Map } from '@/src/components/map/Map';
import { useMerchants, useCategories } from '@/src/hooks/useMerchants';
import { useListings } from '@/src/hooks/useListings';
import { useUserLocation } from '@/src/hooks/useUserLocation';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import {
  calculateDistance,
  formatDistance,
  getMerchantOpenStatus,
  cn,
  formatCurrency,
} from '@/src/lib/utils';
import { openDirections } from '@/src/lib/maps';
import { openLocationSettings } from '@/src/lib/settings';

function FilterChip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <PressableScale onPress={onPress} scale={0.95}>
      <View
        testID={testID}
        className={cn(
          'mr-2 rounded-full border px-4 py-2',
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

export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colors = useThemeColor();
  const [query, setQuery] = useState('');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | undefined>();
  const { location, status, request } = useUserLocation();

  const { data: merchants, isLoading } = useMerchants({
    query: query || undefined,
    lat: location.latitude,
    lng: location.longitude,
    radius: 50000,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const { data: categories } = useCategories();

  const filteredMerchants = useMemo(() => {
    if (!merchants) return [];
    let result = merchants;
    if (selectedCategories.length > 0) {
      result = result.filter((m) => m.categories.some((c) => selectedCategories.includes(c)));
    }
    if (openNowOnly) {
      result = result.filter((m) => getMerchantOpenStatus(m, i18n.language).isOpen);
    }
    if (nearbyOnly) {
      result = result.filter((m) => (m.distance ?? Infinity) <= 5000);
    }
    return result;
  }, [merchants, selectedCategories, openNowOnly, nearbyOnly, i18n.language]);

  const { data: merchantListings } = useListings(
    selectedMerchantId
      ? { merchantId: selectedMerchantId, lat: location.latitude, lng: location.longitude }
      : undefined
  );
  const activeListings = merchantListings?.filter((l) => l.status === 'active') ?? [];

  const selectedMerchant = filteredMerchants.find((m) => m.id === selectedMerchantId);
  const openStatus = selectedMerchant
    ? getMerchantOpenStatus(selectedMerchant, i18n.language)
    : null;
  const locationDenied = status === 'denied';

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <Screen testID="map-screen" scrollable={false}>
      {/* Search header — sits above the map in normal flow so MapView can't intercept touches */}
      <View className="px-4 pt-2 pb-2">
        <Text testID="map-title" className="mb-2 text-2xl font-bold text-foreground">
          {t('common.map')}
        </Text>
        <View
          className="rounded-2xl bg-background"
          // eslint-disable-next-line react-native/no-color-literals -- shadow is deliberately black in both themes
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          }}
        >
          <SearchBar
            placeholder={t('customer.map.searchPlaceholder')}
            value={query}
            onChangeText={setQuery}
            onSubmit={setQuery}
          />
        </View>
      </View>

      {/* Filter chips */}
      <View className="px-4 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories?.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              isActive={selectedCategories.includes(category.id)}
              onPress={() => toggleCategory(category.id)}
              locale={i18n.language as 'en' | 'th'}
            />
          ))}
          <FilterChip
            testID="map-filter-chip-open-now"
            label={t('customer.map.openNow')}
            selected={openNowOnly}
            onPress={() => setOpenNowOnly((prev) => !prev)}
          />
          <FilterChip
            testID="map-filter-chip-nearby"
            label={t('common.nearby')}
            selected={nearbyOnly}
            onPress={() => setNearbyOnly((prev) => !prev)}
          />
        </ScrollView>
      </View>

      {/* Map fills remaining space; floating controls are absolute within this container */}
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Skeleton width={200} height={24} className="rounded-xl" />
          </View>
        ) : (
          <Map
            merchants={filteredMerchants}
            userLocation={location}
            locationGranted={status === 'granted'}
            selectedMerchantId={selectedMerchantId}
            onSelectMerchant={(merchant) => setSelectedMerchantId(merchant?.id ?? undefined)}
          />
        )}

        <View className="absolute bottom-4 right-4 z-10">
          <Button
            variant="secondary"
            size="icon"
            onPress={request}
            accessibilityLabel={t('customer.map.myLocation')}
            accessibilityHint={t('customer.map.myLocationHint')}
          >
            {locationDenied ? (
              <LocateOff size={20} color={colors.muted} />
            ) : (
              <LocateFixed size={20} color={colors.primary} />
            )}
          </Button>
        </View>

        {selectedMerchant && (
          <View className="absolute bottom-20 left-4 right-4 z-10">
            <Card variant="elevated" className="p-4">
              <View className="flex-row items-start">
                <Image
                  source={{ uri: selectedMerchant.logoUrl }}
                  className="h-14 w-14 rounded-xl bg-muted"
                  resizeMode="cover"
                />
                <View className="ml-3 flex-1">
                  <View className="mb-1 flex-row items-center justify-between">
                    <Text variant="body-sm" className="flex-1 font-semibold" numberOfLines={1}>
                      {selectedMerchant.name}
                    </Text>
                    <FavoriteButton merchantId={selectedMerchant.id} size={18} className="ml-2" />
                    <PressableScale
                      onPress={() => setSelectedMerchantId(undefined)}
                      className="ml-2 rounded-full bg-muted/20 p-1.5"
                      scale={0.9}
                      accessibilityRole="button"
                      accessibilityLabel={t('customer.map.closeMerchantPreview')}
                      accessibilityHint={t('customer.map.closeMerchantPreviewHint')}
                      hitSlop={8}
                    >
                      <X size={14} color={colors.muted} />
                    </PressableScale>
                  </View>

                  <View className="mb-1 flex-row items-center">
                    <Star size={14} color={colors.warning} fill={colors.warning} />
                    <Text variant="caption" className="ml-1">
                      {selectedMerchant.rating.toFixed(1)} ({selectedMerchant.reviewCount})
                    </Text>
                    <MapPin size={14} color={colors.muted} className="ml-3" />
                    <Text variant="caption" className="ml-1 text-muted">
                      {formatDistance(calculateDistance(location, selectedMerchant.coordinates))}
                    </Text>
                  </View>

                  {openStatus && (
                    <Badge variant={openStatus.isOpen ? 'success' : 'muted'} className="self-start">
                      {openStatus.isOpen
                        ? t('customer.merchant.openUntil', { time: openStatus.closeTime })
                        : openStatus.openTime
                          ? t('customer.merchant.opensAt', { time: openStatus.openTime })
                          : t('customer.merchant.closed')}
                    </Badge>
                  )}
                </View>
              </View>

              {activeListings.length > 0 && (
                <View className="mt-3">
                  <Text variant="caption" className="mb-2 font-semibold text-muted">
                    Available now
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                    {activeListings.slice(0, 5).map((listing) => {
                      const discount = Math.round(
                        (1 - listing.salePrice / listing.originalPrice) * 100
                      );
                      return (
                        <PressableScale
                          key={listing.id}
                          onPress={() => router.push(`/(customer)/listing/${listing.id}` as any)}
                          scale={0.97}
                          className="mx-1"
                        >
                          <View className="w-28 rounded-2xl overflow-hidden bg-muted">
                            <Image
                              source={{ uri: listing.images[0] }}
                              className="w-full h-20"
                              resizeMode="cover"
                            />
                            <View className="p-2">
                              <Text variant="caption" className="font-semibold" numberOfLines={1}>
                                {listing.title}
                              </Text>
                              <View className="flex-row items-center mt-0.5">
                                <Text variant="caption" className="text-primary font-bold">
                                  {formatCurrency(listing.salePrice)}
                                </Text>
                                <Text
                                  variant="caption"
                                  className="ml-1.5 bg-primary/10 text-primary rounded-full px-1.5 font-semibold"
                                >
                                  -{discount}%
                                </Text>
                              </View>
                            </View>
                          </View>
                        </PressableScale>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View className="mt-3 flex-row items-center justify-between">
                <PressableScale
                  onPress={() =>
                    openDirections(selectedMerchant.coordinates, selectedMerchant.name)
                  }
                  className="flex-1 items-center rounded-xl bg-primary/10 py-2"
                  scale={0.97}
                >
                  <Navigation size={18} color={colors.primary} />
                  <Text variant="caption" className="mt-1 font-medium text-primary">
                    {t('customer.map.navigate')}
                  </Text>
                </PressableScale>
                <View className="w-2" />
                <PressableScale
                  onPress={() => Linking.openURL(`tel:${selectedMerchant.phone}`)}
                  className="flex-1 items-center rounded-xl bg-muted/10 py-2"
                  scale={0.97}
                >
                  <Phone size={18} color={colors.foreground} />
                  <Text variant="caption" className="mt-1 font-medium text-foreground">
                    {t('customer.map.call')}
                  </Text>
                </PressableScale>
                <View className="w-2" />
                <PressableScale
                  onPress={() =>
                    Share.share({
                      title: selectedMerchant.name,
                      message: `Check out ${selectedMerchant.name} on Maithing!`,
                    })
                  }
                  className="flex-1 items-center rounded-xl bg-muted/10 py-2"
                  scale={0.97}
                >
                  <Share2 size={18} color={colors.foreground} />
                  <Text variant="caption" className="mt-1 font-medium text-foreground">
                    {t('customer.map.share')}
                  </Text>
                </PressableScale>
              </View>

              <Button
                className="mt-3"
                fullWidth
                size="sm"
                variant="secondary"
                leftIcon={<Store size={16} color={colors.primary} />}
                onPress={() => router.push(`/(customer)/merchant/${selectedMerchant.id}` as any)}
              >
                {t('customer.map.viewShop')}
              </Button>
            </Card>
          </View>
        )}

        {locationDenied && !selectedMerchant && (
          <View className="absolute bottom-20 left-4 right-4 z-10 rounded-2xl bg-card p-4 shadow-sm">
            <Text variant="body-sm" className="mb-1 font-semibold">
              {t('customer.map.locationDeniedTitle')}
            </Text>
            <Text variant="caption" className="mb-3 text-muted">
              {t('customer.map.locationDeniedBody')}
            </Text>
            <Button size="sm" fullWidth onPress={openLocationSettings}>
              {t('customer.map.openSettings')}
            </Button>
          </View>
        )}
      </View>
    </Screen>
  );
}
