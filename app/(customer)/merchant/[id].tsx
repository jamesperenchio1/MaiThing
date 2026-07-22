import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image } from 'react-native';
import { Heart, MapPin, Star, Clock } from 'lucide-react-native';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { ListingCard } from '@/src/components/composite/ListingCard';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useMerchant } from '@/src/hooks/useMerchants';
import { useListings } from '@/src/hooks/useListings';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export default function MerchantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
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
            <PressableScale
              onPress={() => {}}
              className="rounded-full bg-muted/10 p-3"
              scale={0.9}
            >
              <Heart size={20} color={colors.foreground} />
            </PressableScale>
          </View>

          <View className="mb-4 flex-row items-center">
            <MapPin size={16} color={colors.muted} />
            <Text variant="body-sm" className="ml-2 flex-1 text-muted">
              {merchant.address.street}, {merchant.address.district}, {merchant.address.province}
            </Text>
          </View>

          <View className="mb-6 flex-row flex-wrap">
            {merchant.categories.map((cat) => (
              <Badge key={cat} variant="muted" className="mr-2 mb-2">
                {cat}
              </Badge>
            ))}
          </View>

          <View testID="merchant-about-section" className="mb-6">
            <Text testID="merchant-about-title" variant="h3" className="mb-2">
              About
            </Text>
            <Text testID="merchant-about-text" variant="body" className="text-muted">
              {merchant.description}
            </Text>
          </View>

          <View testID="merchant-pickup-section" className="mb-6">
            <Text testID="merchant-pickup-title" variant="h3" className="mb-2">
              Pickup Information
            </Text>
            <View className="flex-row items-start">
              <Clock size={18} color="#6B7280" className="mr-3 mt-0.5" />
              <Text testID="merchant-pickup-text" variant="body-sm" className="flex-1 text-muted">
                {merchant.pickupInstructions}
              </Text>
            </View>
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
