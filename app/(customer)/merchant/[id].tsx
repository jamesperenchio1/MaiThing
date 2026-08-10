import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MapPin, Phone, Navigation, AlertCircle, Calendar, Clock, Bell, BellOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Image } from '@/src/components/ui/Image';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { ListingCard } from '@/src/components/composite/ListingCard';
import { FavoriteButton } from '@/src/components/composite/FavoriteButton';
import { MerchantMap } from '@/src/components/map/MerchantMap';
import { TrustBadge } from '@/src/components/composite/TrustBadge';
import { ReviewSummary } from '@/src/components/composite/ReviewSummary';
import { ReviewCard } from '@/src/components/composite/ReviewCard';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useMerchant } from '@/src/hooks/useMerchants';
import { useReviews } from '@/src/hooks/useReviews';
import { useListings } from '@/src/hooks/useListings';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import {
  useMerchantFollowNotification,
  useToggleMerchantFollowNotification,
} from '@/src/hooks/useFavorites';
import {
  formatDistance,
  calculateDistance,
  formatCategory,
  getMerchantOpenStatus,
} from '@/src/lib/utils';
import { openDirections } from '@/src/lib/maps';
import { DEFAULT_USER_LOCATION } from '@/src/lib/constants';

export default function MerchantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const { data: merchant, isLoading } = useMerchant(id);
  const { data: listings } = useListings({ merchantId: id });
  const { data: reviews } = useReviews(id);
  const isFollowingNotifications = useMerchantFollowNotification(user?.id ?? '', id ?? '');
  const toggleFollowNotification = useToggleMerchantFollowNotification();
  const isTemporarilyClosed =
    !!(merchant?.closedUntil && new Date(merchant.closedUntil) > new Date());
  const closedUntilFormatted = merchant?.closedUntil
    ? `${new Date(merchant.closedUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at midnight`
    : '';

  const openStatus = merchant ? getMerchantOpenStatus(merchant, i18n.language) : null;
  const openStatusLabel = openStatus
    ? openStatus.isOpen
      ? t('customer.merchant.openUntil', { time: openStatus.closeTime })
      : openStatus.openTime
        ? t('customer.merchant.opensAt', { time: openStatus.openTime })
        : t('customer.merchant.closed')
    : '';

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

  const joinedDate = merchant.joinedAt
    ? new Date(merchant.joinedAt).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
      })
    : null;

  const recentReviews = reviews?.slice(0, 5) ?? [];

  const listHeader = (
    <View>
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
            <ReviewSummary
              rating={merchant.rating}
              reviewCount={merchant.reviewCount}
              size="md"
            />
            {openStatus && (
              <View className="mt-2 self-start">
                <Badge variant={openStatus.isOpen ? 'success' : 'muted'}>{openStatusLabel}</Badge>
              </View>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            <PressableScale
              onPress={() => {
                if (!user) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleFollowNotification.mutate(
                  { userId: user.id, merchantId: merchant.id, isFollowing: isFollowingNotifications },
                  {
                    onSuccess: ({ isFollowing }) => {
                      Alert.alert(
                        '',
                        isFollowing
                          ? t('customer.merchant.followNotificationSet', { name: merchant.name })
                          : t('customer.merchant.followNotificationRemoved', { name: merchant.name })
                      );
                    },
                  }
                );
              }}
              scale={0.9}
              className="rounded-full p-2"
              style={{ backgroundColor: isFollowingNotifications ? `${colors.primary}15` : `${colors.muted}15` }}
            >
              {isFollowingNotifications ? (
                <Bell size={20} color={colors.primary} fill={colors.primary} />
              ) : (
                <BellOff size={20} color={colors.muted} />
              )}
            </PressableScale>
            <FavoriteButton merchantId={merchant.id} />
          </View>
        </View>

        {isTemporarilyClosed && (
          <View className="mb-4 flex-row items-center rounded-2xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
            <Clock size={18} color={colors.danger} />
            <View className="ml-3 flex-1">
              <Text variant="body-sm" className="font-semibold text-red-700 dark:text-red-400">
                Temporarily closed
              </Text>
              <Text variant="caption" className="text-red-600 dark:text-red-500">
                This store is closed until {closedUntilFormatted}
              </Text>
            </View>
          </View>
        )}

        <View className="mb-4 flex-row flex-wrap">
          {merchant.isVerified && <TrustBadge type="verified" />}
          <TrustBadge type="guarantee" />
          {merchant.hygieneRating && (
            <TrustBadge type="hygiene" rating={merchant.hygieneRating} />
          )}
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

        {joinedDate && (
          <View className="mb-4 flex-row items-center">
            <Calendar size={16} color={colors.muted} />
            <Text variant="body-sm" className="ml-2 text-muted">
              {t('customer.merchant.partnerSince', { date: joinedDate })}
            </Text>
          </View>
        )}

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
              {formatCategory(cat, i18n.language)}
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

        {recentReviews.length > 0 && (
          <View testID="merchant-reviews-section" className="mb-6">
            <Text variant="h3" className="mb-2">
              {t('customer.merchant.reviews')}
            </Text>
            {recentReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </View>
        )}

        <View testID="merchant-listings-section" className="mb-2">
          <Text testID="merchant-listings-title" variant="h3" className="mb-2">
            Available Listings
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Screen testID="merchant-detail-screen" scrollable={false}>
      <Header testID="merchant-detail-header" />
      <FlashList
        className="flex-1"
        data={listings ?? []}
        keyExtractor={(item) => item.id}
        estimatedItemSize={140}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <View className="px-6">
            <ListingCard listing={item} variant="horizontal" />
          </View>
        )}
        ListEmptyComponent={
          <View className="px-6 pb-6">
            <Text variant="body" className="text-center text-muted">
              No active listings right now.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Screen>
  );
}
