import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  View,
  ScrollView,
  Image,
  Platform,
  Share,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Minus, Plus, Share2, Clock, MapPin, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { FavoriteButton } from '@/src/components/composite/FavoriteButton';
import { UrgencyBadge } from '@/src/components/composite/UrgencyBadge';
import { CountdownTimer } from '@/src/components/composite/CountdownTimer';
import { TrustBadge } from '@/src/components/composite/TrustBadge';
import { ReviewSummary } from '@/src/components/composite/ReviewSummary';
import { ReviewCard } from '@/src/components/composite/ReviewCard';
import { useListing } from '@/src/hooks/useListings';
import { useMerchant } from '@/src/hooks/useMerchants';
import { useReviews } from '@/src/hooks/useReviews';
import { useCartStore } from '@/src/stores/cart';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import {
  formatCurrency,
  formatDistance,
  calculateDistance,
  formatPickupWindow,
  getListingUrgency,
} from '@/src/lib/utils';
import { getListingUrl } from '@/src/lib/links';
import { DEFAULT_USER_LOCATION } from '@/src/lib/constants';

export default function ListingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { data: listing, isLoading } = useListing(id);
  const { data: merchant } = useMerchant(listing?.merchantId ?? '');
  const { data: reviews } = useReviews(listing?.merchantId ?? '');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const colors = useThemeColor();
  const addItem = useCartStore((s) => s.addItem);
  const { width: screenWidth } = Dimensions.get('window');

  const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setActiveImageIndex(index);
  };

  if (isLoading || !listing) {
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

  const isMystery = listing.type === 'mystery_box';
  const discount = Math.round((1 - listing.salePrice / listing.originalPrice) * 100);
  const isSoldOut = listing.quantityRemaining === 0;
  const urgency = getListingUrgency(listing);
  const minsUntilEnd = Math.round(
    (new Date(listing.pickupWindowEnd).getTime() - Date.now()) / 60000
  );
  const showCountdown = !isSoldOut && minsUntilEnd <= 240 && minsUntilEnd > 0;
  const recentReviews = reviews?.slice(0, 3) ?? [];

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = getListingUrl(listing.id);
    const title = listing.title;
    const message = `"${listing.title}" — ${formatCurrency(listing.salePrice)} (-${discount}%) on Maithing`;

    if (Platform.OS === 'web') {
      if (navigator.share) {
        try {
          await navigator.share({ title, text: message, url });
        } catch {
          // user cancelled
        }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${message} ${url}`);
      }
      return;
    }

    try {
      await Share.share({ title, message: `${message} ${url}`, url });
    } catch {
      // user cancelled
    }
  };

  const handleBuyNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(customer)/listing/[id]/confirm' as any,
      params: { id: listing.id, quantity: String(quantity) },
    });
  };

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem(listing, quantity);
  };

  return (
    <Screen testID="listing-detail-screen" scrollable={false}>
      <Header testID="listing-detail-header" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="relative h-72 w-full">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScroll}
            className="h-full w-full"
          >
            {listing.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={{ width: screenWidth }}
                className="h-full"
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <View className="absolute left-4 top-4">
            <Badge variant={isMystery ? 'warning' : 'info'}>
              {isMystery ? 'Mystery Box' : 'Fixed Item'}
            </Badge>
          </View>
          {urgency && (
            <View className="absolute bottom-4 left-4">
              <UrgencyBadge urgency={urgency} />
            </View>
          )}
          {listing.images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row items-center justify-center">
              {listing.images.map((_, index) => (
                <View
                  key={index}
                  className={`mx-1 rounded-full ${
                    index === activeImageIndex ? 'h-2 w-2 bg-white' : 'h-1.5 w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </View>
          )}
          <View className="absolute right-4 top-4 flex-row space-x-2">
            {merchant && (
              <FavoriteButton
                merchantId={merchant.id}
                variant="overlay"
                className="bg-black/30 p-2"
              />
            )}
            <PressableScale
              onPress={handleShare}
              className="rounded-full bg-black/30 p-2"
              scale={0.9}
              accessibilityLabel="Share listing"
              accessibilityHint="Opens the share sheet for this listing"
              hitSlop={8}
            >
              <Share2 size={20} color="#fff" />
            </PressableScale>
          </View>
        </View>

        <View className="-mt-6 rounded-t-3xl bg-background px-6 pt-6">
          <View className="mb-4 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text variant="h2" className="mb-1">
                {listing.title}
              </Text>
              <PressableScale
                onPress={() => router.push(`/(customer)/merchant/${merchant?.id}` as any)}
                scale={0.98}
              >
                <Text variant="body" className="text-primary">
                  {merchant?.name}
                </Text>
              </PressableScale>
              {merchant && (
                <View className="mt-1">
                  <ReviewSummary
                    rating={merchant.rating}
                    reviewCount={merchant.reviewCount}
                    size="sm"
                  />
                </View>
              )}
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-primary">
                {formatCurrency(listing.salePrice)}
              </Text>
              <Text className="text-sm text-muted line-through">
                {formatCurrency(listing.originalPrice)}
              </Text>
              <Badge variant="success" className="mt-1">
                -{discount}%
              </Badge>
            </View>
          </View>

          {isMystery && (
            <Card
              variant="outlined"
              className="mb-4 rounded-2xl border-warning/30 bg-warning/5 p-4"
            >
              <Text variant="body-sm" className="font-semibold text-warning">
                {t('customer.listing.mysteryBoxValue', {
                  value: formatCurrency(listing.estimatedRetailValue),
                })}
              </Text>
              <Text variant="body-sm" className="text-muted">
                {t('customer.listing.mysteryBoxHint')}
              </Text>
            </Card>
          )}

          {showCountdown && (
            <View className="mb-4">
              <CountdownTimer targetDate={listing.pickupWindowEnd} label="Pickup ends" />
            </View>
          )}

          <View className="mb-4 flex-row flex-wrap">
            <TrustBadge type="guarantee" />
            {merchant?.isVerified && <TrustBadge type="verified" />}
            {merchant?.hygieneRating && merchant.hygieneRating >= 4.5 && (
              <TrustBadge type="hygiene" rating={merchant.hygieneRating} />
            )}
          </View>

          <Card variant="outlined" className="mb-6">
            <View className="flex-row items-center">
              <Clock size={20} color={colors.primary} />
              <View className="ml-3 flex-1">
                <Text variant="body-sm" className="font-semibold">
                  {t('customer.listing.pickupWindow')}
                </Text>
                <Text variant="caption" className="text-muted">
                  {formatPickupWindow(
                    listing.pickupWindowStart,
                    listing.pickupWindowEnd,
                    i18n.language
                  )}
                </Text>
              </View>
            </View>
          </Card>

          <View testID="listing-description-section" className="mb-6">
            <Text testID="listing-description-title" variant="h3" className="mb-2">
              {t('customer.listing.description')}
            </Text>
            <Text testID="listing-description-text" variant="body" className="text-muted">
              {listing.description}
            </Text>
          </View>

          {listing.allergens.length > 0 && (
            <View className="mb-6">
              <Text variant="h3" className="mb-2">
                {t('customer.listing.allergens')}
              </Text>
              <View className="flex-row flex-wrap">
                {listing.allergens.map((a) => (
                  <Badge key={a} variant="danger" className="mr-2 mb-2">
                    {a}
                  </Badge>
                ))}
              </View>
            </View>
          )}

          {listing.dietaryTags.length > 0 && (
            <View className="mb-6">
              <Text variant="h3" className="mb-2">
                {t('customer.listing.dietary')}
              </Text>
              <View className="flex-row flex-wrap">
                {listing.dietaryTags.map((tag) => (
                  <Badge key={tag} variant="success" className="mr-2 mb-2">
                    {tag}
                  </Badge>
                ))}
              </View>
            </View>
          )}

          <View className="mb-6 rounded-2xl bg-muted/10 p-4">
            <View className="mb-3 flex-row items-center">
              <MapPin size={20} color={colors.primary} className="mr-3" />
              <Text variant="body-sm" className="font-semibold">
                {t('customer.listing.pickupLocation')}
              </Text>
            </View>
            {merchant && (
              <>
                <Text variant="body-sm" className="mb-1 text-foreground">
                  {merchant.name}
                </Text>
                <Text variant="body-sm" className="mb-1 text-muted">
                  {merchant.address.street}, {merchant.address.district},{' '}
                  {merchant.address.province} {merchant.address.postalCode}
                </Text>
                <Text variant="caption" className="mb-3 text-muted">
                  {formatDistance(calculateDistance(DEFAULT_USER_LOCATION, merchant.coordinates))}{' '}
                  {t('customer.listing.away')}
                </Text>
                {Platform.OS === 'web' && (
                  <View className="mb-3 overflow-hidden rounded-xl" style={{ height: 160 }}>
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${merchant.coordinates.longitude - 0.01},${merchant.coordinates.latitude - 0.01},${merchant.coordinates.longitude + 0.01},${merchant.coordinates.latitude + 0.01}&layer=mapnik&marker=${merchant.coordinates.latitude},${merchant.coordinates.longitude}`}
                      className="h-full w-full border-0"
                      title={`${merchant.name} location`}
                      loading="lazy"
                    />
                  </View>
                )}
                <View className="flex-row items-start">
                  <AlertCircle size={18} color={colors.muted} className="mr-3 mt-0.5" />
                  <Text variant="body-sm" className="flex-1 text-muted">
                    {merchant.pickupInstructions}
                  </Text>
                </View>
              </>
            )}
          </View>

          {recentReviews.length > 0 && (
            <View className="mb-6">
              <View className="mb-3 flex-row items-center justify-between">
                <Text variant="h3">{t('customer.listing.recentReviews')}</Text>
                {merchant && (
                  <PressableScale
                    onPress={() => router.push(`/(customer)/merchant/${merchant.id}` as any)}
                    scale={0.98}
                  >
                    <Text variant="body-sm" className="text-primary">
                      See all
                    </Text>
                  </PressableScale>
                )}
              </View>
              {recentReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </View>
          )}

        </View>
      </ScrollView>

      <View className="border-t border-border bg-background px-6 py-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text variant="body-sm" className="text-muted">
            {t('customer.listing.quantityLeft', { count: listing.quantityRemaining })}
          </Text>
          <Text className="text-xl font-bold">{formatCurrency(listing.salePrice * quantity)}</Text>
        </View>
        <View className="flex-row items-center space-x-3">
          <View className="flex-row items-center">
            <PressableScale
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              className="rounded-2xl bg-muted/10 p-3"
              scale={0.9}
              disabled={quantity <= 1}
              accessibilityLabel="Decrease quantity"
              hitSlop={8}
            >
              <Minus size={18} color={colors.foreground} />
            </PressableScale>
            <Text variant="body" className="mx-3 w-6 text-center font-semibold">
              {quantity}
            </Text>
            <PressableScale
              onPress={() => setQuantity((q) => Math.min(q + 1, listing.quantityRemaining))}
              className="rounded-2xl bg-muted/10 p-3"
              scale={0.9}
              disabled={quantity >= listing.quantityRemaining}
              accessibilityLabel="Increase quantity"
              hitSlop={8}
            >
              <Plus size={18} color={colors.foreground} />
            </PressableScale>
          </View>
          <Button
            testID="add-to-cart-button"
            variant="secondary"
            className="flex-1"
            disabled={isSoldOut}
            onPress={handleAddToCart}
          >
            {t('customer.listing.addToCart')}
          </Button>
          <Button
            testID="buy-now-button"
            className="flex-1"
            disabled={isSoldOut}
            loading={false}
            onPress={handleBuyNow}
          >
            {isSoldOut ? t('customer.listing.soldOut') : t('customer.listing.buyNow')}
          </Button>
        </View>
      </View>
    </Screen>
  );
}
