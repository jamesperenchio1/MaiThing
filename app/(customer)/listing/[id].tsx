import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  View,
  ScrollView,
  Image,
  Platform,
  Share,
  Linking,
  Dimensions,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  Minus,
  Plus,
  Share2,
  Clock,
  MapPin,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Bell,
  BellOff,
  ExternalLink,
  Store,
  X,
  Zap,
} from 'lucide-react-native';
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
import { StaticMap } from '@/src/components/map/StaticMap';
import { useListing } from '@/src/hooks/useListings';
import { useMerchant } from '@/src/hooks/useMerchants';
import { useReviews } from '@/src/hooks/useReviews';
import {
  useSavedListings,
  useSaveListingToggle,
  useRestockAlert,
  useToggleRestockAlert,
} from '@/src/hooks/useFavorites';
import { useCartStore } from '@/src/stores/cart';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import {
  formatCurrency,
  formatDistance,
  calculateDistance,
  formatPickupWindow,
  getListingUrgency,
} from '@/src/lib/utils';
import { getListingUrl } from '@/src/lib/links';
import { DEFAULT_USER_LOCATION } from '@/src/lib/constants';

function ImageLightbox({
  images,
  visible,
  initialIndex,
  onClose,
}: {
  images: string[];
  visible: boolean;
  initialIndex: number;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) {
      setActiveIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  if (!visible) return null;

  return (
    <View
      className="absolute inset-0 z-50 bg-black"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <PressableScale
        onPress={onClose}
        className="absolute right-4 top-12 z-10 rounded-full bg-black/50 p-2"
        scale={0.9}
        accessibilityLabel="Close image"
      >
        <X size={24} color="#fff" />
      </PressableScale>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: activeIndex * width, y: 0 }}
        onMomentumScrollEnd={(e) =>
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        {images.map((uri, index) => (
          <View
            key={`lightbox-${uri}-${index}`}
            style={{ width }}
            className="flex-1 items-center justify-center"
          >
            <Image source={{ uri }} style={{ width, height }} resizeMode="contain" />
          </View>
        ))}
      </ScrollView>

      {images.length > 1 && (
        <View className="absolute bottom-8 left-0 right-0 flex-row items-center justify-center">
          {images.map((_, index) => (
            <View
              key={index}
              className={`mx-1 rounded-full ${
                index === activeIndex ? 'h-2 w-2 bg-white' : 'h-1.5 w-1.5 bg-white/50'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function ListingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { data: listing, isLoading } = useListing(id);
  const { data: merchant } = useMerchant(listing?.merchantId ?? '');
  const { data: reviews } = useReviews(listing?.merchantId ?? '');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const colors = useThemeColor();
  const addItem = useCartStore((s) => s.addItem);
  const { width: screenWidth } = Dimensions.get('window');
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const savedListings = useSavedListings(userId);
  const { mutate: toggleSave } = useSaveListingToggle();
  const isAlertingRestock = useRestockAlert(userId, id ?? '');
  const { mutate: toggleRestockAlert, isPending: restockAlertPending } = useToggleRestockAlert();

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
  const isFlashSale =
    !!listing.flashSalePrice &&
    !!listing.flashSaleEndsAt &&
    new Date(listing.flashSaleEndsAt) > new Date();
  const effectivePrice = isFlashSale ? listing.flashSalePrice! : listing.salePrice;
  const discount = Math.round((1 - effectivePrice / listing.originalPrice) * 100);
  const isSoldOut = listing.quantityRemaining === 0;
  const waitlistCount = isSoldOut
    ? Math.max(3, listing.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 23) + 4
    : 0;
  const urgency = getListingUrgency(listing, i18n.language);
  const minsUntilEnd = Math.round(
    (new Date(listing.pickupWindowEnd).getTime() - Date.now()) / 60000
  );
  const showCountdown = !isSoldOut && minsUntilEnd <= 240 && minsUntilEnd > 0;
  const recentReviews = reviews?.slice(0, 3) ?? [];
  const isSaved = savedListings.includes(listing.id);

  const handleBookmark = () => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSave({ userId, listingId: listing.id, isSaved });
  };

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
              <PressableScale
                key={index}
                onPress={() => {
                  setLightboxIndex(index);
                  setLightboxVisible(true);
                }}
                className="h-full"
                style={{ width: screenWidth }}
                scale={0.98}
                accessibilityLabel="View full-screen image"
              >
                <Image
                  source={{ uri }}
                  style={{ width: screenWidth }}
                  className="h-full"
                  resizeMode="cover"
                />
              </PressableScale>
            ))}
          </ScrollView>
          <View className="absolute left-4 top-4">
            <Badge variant={isMystery ? 'warning' : 'info'}>
              {isMystery ? 'Mystery Box' : 'Fixed Item'}
            </Badge>
          </View>
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
            {!!userId && (
              <PressableScale
                onPress={handleBookmark}
                className="rounded-full bg-black/30 p-2"
                scale={0.9}
                accessibilityLabel={isSaved ? 'Remove from saved listings' : 'Save listing'}
                accessibilityHint={
                  isSaved
                    ? 'Removes this listing from your saved items'
                    : 'Saves this listing for later'
                }
                hitSlop={8}
              >
                {isSaved ? (
                  <BookmarkCheck size={20} color="#fff" />
                ) : (
                  <Bookmark size={20} color="#fff" />
                )}
              </PressableScale>
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
                className="self-start"
              >
                <View className="flex-row items-center">
                  <View className="mr-1.5">
                    <Store size={14} color={colors.primary} />
                  </View>
                  <Text variant="body" className="text-primary">
                    {merchant?.name}
                  </Text>
                </View>
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
                {formatCurrency(effectivePrice)}
              </Text>
              <Text className="text-sm text-muted line-through">
                {formatCurrency(isFlashSale ? listing.salePrice : listing.originalPrice)}
              </Text>
              <Badge variant={isFlashSale ? 'danger' : 'success'} className="mt-1">
                {isFlashSale ? (
                  <View className="flex-row items-center">
                    <Zap size={12} color={colors.white} fill={colors.white} />
                    <Text className="ml-1 text-xs font-semibold text-white">Flash</Text>
                  </View>
                ) : (
                  `-${discount}%`
                )}
              </Badge>
            </View>
          </View>

          {urgency && (
            <View className="mb-4">
              <UrgencyBadge urgency={urgency} />
            </View>
          )}

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

          {isFlashSale && listing.flashSaleEndsAt && (
            <View className="mb-4">
              <CountdownTimer targetDate={listing.flashSaleEndsAt} label="Flash sale ends" />
            </View>
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
              <View className="mr-2">
                <MapPin size={20} color={colors.primary} />
              </View>
              <Text variant="body-sm" className="font-semibold">
                {t('customer.listing.pickupLocation')}
              </Text>
            </View>
            {merchant && (
              <>
                <Text variant="body-sm" className="mb-0.5 font-medium text-foreground">
                  {merchant.name}
                </Text>
                <Text variant="body-sm" className="mb-0.5 text-muted">
                  {merchant.address.street}, {merchant.address.district},{' '}
                  {merchant.address.province} {merchant.address.postalCode}
                </Text>
                <Text variant="caption" className="mb-3 text-muted">
                  {formatDistance(calculateDistance(DEFAULT_USER_LOCATION, merchant.coordinates))}{' '}
                  {t('customer.listing.away')}
                </Text>

                <StaticMap merchant={merchant} />

                {/* Open in Maps button */}
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="mb-3"
                  leftIcon={<ExternalLink size={16} color={colors.primary} />}
                  onPress={() => {
                    const { latitude, longitude } = merchant.coordinates;
                    const label = encodeURIComponent(merchant.name);
                    const url = Platform.select({
                      ios: `maps://0,0?q=${label}@${latitude},${longitude}`,
                      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
                      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
                    });
                    Linking.openURL(url ?? '');
                  }}
                >
                  Open in Maps
                </Button>

                <View className="flex-row items-start">
                  <View className="mr-2 mt-0.5">
                    <AlertCircle size={16} color={colors.muted} />
                  </View>
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
          <Text className="text-xl font-bold">{formatCurrency(effectivePrice * quantity)}</Text>
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
          {isSoldOut ? (
            <View className="flex-1">
              {waitlistCount > 0 && (
                <Text variant="caption" className="mb-2 text-center text-warning">
                  {waitlistCount} people waiting for restock
                </Text>
              )}
              <Button
                testID="restock-alert-button"
                variant={isAlertingRestock ? 'outline' : 'secondary'}
                className="flex-1"
                loading={restockAlertPending}
                leftIcon={
                  isAlertingRestock ? (
                    <BellOff size={18} color={colors.primary} />
                  ) : (
                    <Bell size={18} color={colors.foreground} />
                  )
                }
                onPress={() => {
                  if (!userId) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  toggleRestockAlert({
                    userId,
                    listingId: id ?? '',
                    isAlerting: isAlertingRestock,
                  });
                }}
              >
                {isAlertingRestock
                  ? t('customer.listing.notifyRestockActive')
                  : t('customer.listing.notifyRestock')}
              </Button>
            </View>
          ) : (
            <>
              <Button
                testID="add-to-cart-button"
                variant="secondary"
                className="flex-1"
                onPress={handleAddToCart}
              >
                {t('customer.listing.addToCart')}
              </Button>
              <Button
                testID="buy-now-button"
                className="flex-1"
                loading={false}
                onPress={handleBuyNow}
              >
                {t('customer.listing.buyNow')}
              </Button>
            </>
          )}
        </View>
      </View>

      <ImageLightbox
        images={listing.images}
        visible={lightboxVisible}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxVisible(false)}
      />
    </Screen>
  );
}
