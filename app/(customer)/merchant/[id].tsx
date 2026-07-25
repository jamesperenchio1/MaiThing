import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image } from 'react-native';
import { MapPin, Star, Clock, Phone, Navigation, AlertCircle } from 'lucide-react-native';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { ListingCard } from '@/src/components/composite/ListingCard';
import { FavoriteButton } from '@/src/components/composite/FavoriteButton';
import { MerchantMap } from '@/src/components/map/MerchantMap';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useMerchant } from '@/src/hooks/useMerchants';
import { useListings } from '@/src/hooks/useListings';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatDistance, calculateDistance, formatCategory } from '@/src/lib/utils';
import { openDirections } from '@/src/lib/maps';
import { DEFAULT_USER_LOCATION } from '@/src/lib/constants';

export default function MerchantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { data: merchant, isLoading } = useMerchant(id);
  const { data: listings } = useListings({ merchantId: id });

  if (isLoading || !merchant) {
    return (
      <Screen>
        <Header />
        <View className="flex-1 items-center justify-center">
          <Text variant="body" className="text-muted">
            {t('common.loading')}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="merchant-detail-screen" scrollable={false}>
      <Header testID="merchant-detail-header" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="relative h-48 w-full">
          <Image source={{ uri: merchant.coverUrl }} className="h-full w-full" resizeMode="cover" />
          <View className="absolute inset-0 bg-black/20" />
        </View>

        <View className="-mt-8 rounded-t-3xl bg-background px-6 pt-6">
          <View className="mb-4 flex-row items-start">
            <Image
              source={{ uri: merchant.logoUrl }}
              className="mr-4 h-20 w-20 rounded-2xl"
              resizeMode="cover"
            />
            <View className="flex-1">
              <Text variant="h2" className="mb-1">
                {merchant.name}
              </Text>
              <View className="flex-row items-center">
                <Star size={16} color={colors.warning} fill={colors.warning} />
                <Text variant="body-sm" className="ml-1">
                  {merchant.rating.toFixed(1)} · {merchant.reviewCount} reviews
                </Text>
              </View>
            </View>
            <FavoriteButton merchantId={merchant.id} />
          </View>

          <View className="mb-4 flex-row items-center">
            <MapPin size={16} color={colors.muted} />
            <Text variant="body-sm" className="ml-2 flex-1 text-muted">
              {merchant.address.street}, {merchant.address.district}, {merchant.address.province}
            </Text>
          </View>

          <View className="mb-4 flex-row items-center">
            <Navigation size={16} color={colors.primary} />
            <Text variant="body-sm" className="ml-2 text-primary">
              {formatDistance(calculateDistance(DEFAULT_USER_LOCATION, merchant.coordinates))} away
            </Text>
          </View>

          <View className="mb-4 flex-row items-center">
            <Phone size={16} color={colors.muted} />
            <Text variant="body-sm" className="ml-2 text-muted">
              {merchant.phone}
            </Text>
          </View>

          <Button
            variant="secondary"
            className="mb-6"
            leftIcon={<Navigation size={18} color={colors.primary} />}
            onPress={() => openDirections(merchant.coordinates, merchant.name)}
          >
            {t('customer.map.directions')}
          </Button>

          <View className="mb-6 flex-row flex-wrap">
            {merchant.categories.map((cat) => (
              <Badge key={cat} variant="muted" className="mr-2 mb-2">
                {formatCategory(cat)}
              </Badge>
            ))}
          </View>

          <View testID="merchant-map-section" className="mb-6 overflow-hidden rounded-3xl bg-card">
            <MerchantMap merchant={merchant} />
          </View>

          <View testID="merchant-hours-section" className="mb-6">
            <Text testID="merchant-hours-title" variant="h3" className="mb-2">
              Business Hours
            </Text>
            <Card variant="outlined">
              {merchant.businessHours.map((hours, index) => {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return (
                  <View
                    key={hours.day}
                    className={`flex-row items-center justify-between py-2 ${index !== merchant.businessHours.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <Text
                      variant="body-sm"
                      className={
                        hours.day === new Date().getDay()
                          ? 'font-semibold text-foreground'
                          : 'text-muted'
                      }
                    >
                      {days[hours.day]}
                    </Text>
                    <Text
                      variant="body-sm"
                      className={
                        hours.day === new Date().getDay()
                          ? 'font-semibold text-foreground'
                          : 'text-muted'
                      }
                    >
                      {hours.open} - {hours.close}
                    </Text>
                  </View>
                );
              })}
            </Card>
          </View>

          <View testID="merchant-pickup-section" className="mb-6 rounded-2xl bg-primary/10 p-4">
            <View className="mb-2 flex-row items-center">
              <AlertCircle size={18} color={colors.primary} className="mr-3" />
              <Text variant="body-sm" className="font-semibold text-foreground">
                Pickup Information
              </Text>
            </View>
            <Text testID="merchant-pickup-text" variant="body-sm" className="text-muted">
              {merchant.pickupInstructions}
            </Text>
          </View>

          <View testID="merchant-about-section" className="mb-6">
            <Text testID="merchant-about-title" variant="h3" className="mb-2">
              About
            </Text>
            <Text testID="merchant-about-text" variant="body" className="text-muted">
              {merchant.description}
            </Text>
          </View>

          <View testID="merchant-listings-section" className="mb-6">
            <Text testID="merchant-listings-title" variant="h3" className="mb-2">
              Available Listings
            </Text>
            {listings?.map((listing) => (
              <ListingCard key={listing.id} listing={listing} variant="horizontal" />
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
