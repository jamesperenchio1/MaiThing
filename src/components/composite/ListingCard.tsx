import React, { useMemo, useRef } from 'react';
import { Image, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  cn,
  formatCurrency,
  formatDistance,
  formatWalkTime,
  getListingUrgency,
  formatPickupWindow,
} from '@/src/lib/utils';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { FavoriteButton } from '@/src/components/composite/FavoriteButton';
import { UrgencyBadge } from '@/src/components/composite/UrgencyBadge';
import { DietaryBadgeRow } from '@/src/components/composite/DietaryBadgeRow';
import { CountdownTimer } from '@/src/components/composite/CountdownTimer';
import type { Listing } from '@/src/types';

interface ListingCardProps {
  listing: Listing;
  variant?: 'horizontal' | 'vertical';
  className?: string;
  testID?: string;
}

export const ListingCard = React.memo(function ListingCard({
  listing,
  variant = 'vertical',
  className,
  testID,
}: ListingCardProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const navigating = useRef(false);

  const isMystery = listing.type === 'mystery_box';

  const {
    isFlashSale,
    effectivePrice,
    discount,
    isSoldOut,
    urgency,
    showCountdown,
    pickupTimeLabel,
  } = useMemo(() => {
    const flashActive =
      !!listing.flashSalePrice &&
      !!listing.flashSaleEndsAt &&
      new Date(listing.flashSaleEndsAt) > new Date();
    const price = flashActive ? listing.flashSalePrice! : listing.salePrice;
    const disc = Math.round((1 - price / listing.originalPrice) * 100);
    const soldOut = listing.quantityRemaining === 0;
    const urg = getListingUrgency(listing, i18n.language);
    const minsUntilEnd = Math.round(
      (new Date(listing.pickupWindowEnd).getTime() - Date.now()) / 60000
    );
    const pickupWindowLabel = formatPickupWindow(
      listing.pickupWindowStart,
      listing.pickupWindowEnd,
      i18n.language
    );
    return {
      isFlashSale: flashActive,
      effectivePrice: price,
      discount: disc,
      isSoldOut: soldOut,
      urgency: urg,
      showCountdown: !soldOut && minsUntilEnd <= 240 && minsUntilEnd > 0,
      pickupTimeLabel: pickupWindowLabel.split(' · ')[1] ?? '',
    };
  }, [listing, i18n.language]);

  const distanceLabel = useMemo(() => {
    if (listing.distance == null) return '';
    return ` · ${formatDistance(listing.distance)} (${formatWalkTime(listing.distance, i18n.language)})`;
  }, [listing.distance]);

  return (
    <PressableScale
      testID={testID}
      onPress={() => {
        if (navigating.current) return;
        navigating.current = true;
        setTimeout(() => {
          navigating.current = false;
        }, 1000);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/(customer)/listing/${listing.id}`);
      }}
      className={cn(variant === 'horizontal' && 'mb-3', className)}
      scale={0.98}
    >
      <Card
        variant="elevated"
        className={cn(
          'overflow-hidden p-0',
          variant === 'horizontal' && 'flex-row',
          variant === 'vertical' && 'h-full'
        )}
      >
        <View
          className={cn(
            'relative overflow-hidden bg-muted',
            variant === 'vertical' ? 'h-40 w-full' : 'h-28 w-28'
          )}
        >
          <Image source={{ uri: listing.images[0] }} className="h-full w-full" resizeMode="cover" />
          <View className="absolute left-2 top-2">
            {variant === 'horizontal' ? (
              <Badge variant={isMystery ? 'warning' : 'info'} className="max-w-24 overflow-hidden">
                <Text
                  variant="caption"
                  className={cn('font-semibold', isMystery ? 'text-amber-800' : 'text-blue-800')}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {isMystery ? t('customer.listing.mysteryBox') : t('customer.listing.fixed')}
                </Text>
              </Badge>
            ) : (
              <Badge variant={isMystery ? 'warning' : 'info'}>
                {isMystery ? t('customer.listing.mysteryBox') : t('customer.listing.fixed')}
              </Badge>
            )}
          </View>
          {isSoldOut && (
            <View className="absolute inset-0 items-center justify-center bg-black/50">
              <Text className="font-semibold text-white">{t('customer.listing.soldOut')}</Text>
            </View>
          )}
          <View className="absolute right-2 top-2">
            <FavoriteButton
              merchantId={listing.merchantId}
              size={16}
              variant="overlay"
              className="bg-black/20 p-1.5"
            />
          </View>
        </View>
        <View
          className={cn(
            'p-3',
            variant === 'vertical' && 'flex-1 overflow-hidden',
            variant === 'horizontal' && 'flex-1'
          )}
        >
          {urgency && (
            <View className="mb-1.5">
              <UrgencyBadge urgency={urgency} />
            </View>
          )}
          <Text variant="body-sm" className="mb-1 font-semibold" numberOfLines={2}>
            {listing.title}
          </Text>

          {!isSoldOut && listing.quantityRemaining <= 3 && (
            <View className="mb-2">
              <Badge variant="warning">
                {t('customer.listing.onlyLeft', { count: listing.quantityRemaining })}
              </Badge>
            </View>
          )}

          {isMystery && (
            <Text variant="caption" className="mb-1.5 text-muted">
              {t('customer.listing.worthOfSurprises', {
                value: formatCurrency(listing.estimatedRetailValue ?? listing.originalPrice),
              })}
            </Text>
          )}

          <View className="mb-2 flex-row flex-wrap items-center">
            <Text className="text-lg font-bold text-primary">{formatCurrency(effectivePrice)}</Text>
            <Text className="ml-2 text-sm text-muted line-through">
              {formatCurrency(isFlashSale ? listing.salePrice : listing.originalPrice)}
            </Text>
            <Badge variant={isFlashSale ? 'danger' : 'success'} className="ml-2">
              {isFlashSale
                ? t('customer.listing.flash')
                : t('customer.listing.discount', { discount })}
            </Badge>
          </View>

          {showCountdown && (
            <View className="mb-2">
              <CountdownTimer
                targetDate={listing.pickupWindowEnd}
                label={t('customer.listing.pickupEnds')}
              />
            </View>
          )}

          <DietaryBadgeRow tags={listing.dietaryTags} max={variant === 'horizontal' ? 1 : 2} />

          <Text variant="caption" className="mt-2 text-muted">
            {t('customer.listing.quantityLeft', { count: listing.quantityRemaining })}
            {' · '}
            {pickupTimeLabel}
            {distanceLabel}
          </Text>
        </View>
      </Card>
    </PressableScale>
  );
});
