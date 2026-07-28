import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Image, Share, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { LocateFixed, LocateOff, Star, MapPin, X, Phone, Navigation, Share2, Store } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/layout/SearchBar';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { FavoriteButton } from '@/src/components/composite/FavoriteButton';
import { Map } from '@/src/components/map/Map';
import { useMerchants } from '@/src/hooks/useMerchants';
import { useUserLocation } from '@/src/hooks/useUserLocation';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { calculateDistance, formatDistance, getMerchantOpenStatus } from '@/src/lib/utils';
import { openDirections } from '@/src/lib/maps';
import { openLocationSettings } from '@/src/lib/settings';

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

  const selectedMerchant = merchants?.find((m) => m.id === selectedMerchantId);
  const openStatus = selectedMerchant
    ? getMerchantOpenStatus(selectedMerchant, i18n.language)
    : null;
  const locationDenied = status === 'denied';

  return (
    <Screen testID="map-screen" scrollable={false}>
      {/* Search header — sits above the map in normal flow so MapView can't intercept touches */}
      <View className="px-4 pt-2 pb-2">
        <Text testID="map-title" className="mb-2 text-2xl font-bold text-foreground">
          {t('common.map')}
        </Text>
        <View
          className="rounded-2xl bg-background"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          }}
        >
          <SearchBar
            placeholder="Search shops nearby..."
            value={query}
            onChangeText={setQuery}
            onSubmit={setQuery}
          />
        </View>
      </View>

      {/* Map fills remaining space; floating controls are absolute within this container */}
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Skeleton width={200} height={24} className="rounded-xl" />
          </View>
        ) : (
          <Map
            merchants={merchants ?? []}
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
                      accessibilityLabel="Close merchant preview"
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

              <View className="mt-3 flex-row items-center justify-between">
                <PressableScale
                  onPress={() => openDirections(selectedMerchant.coordinates, selectedMerchant.name)}
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
