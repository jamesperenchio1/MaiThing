import { useMemo } from 'react';
import { Image, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { cn, formatDistance, formatCompactNumber, getMerchantOpenStatus } from '@/src/lib/utils';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { FavoriteButton } from '@/src/components/composite/FavoriteButton';
import { TrustBadge } from '@/src/components/composite/TrustBadge';
import { ReviewSummary } from '@/src/components/composite/ReviewSummary';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { Merchant } from '@/src/types';

interface MerchantCardProps {
  merchant: Merchant;
  className?: string;
  testID?: string;
}

export function MerchantCard({ merchant, className, testID }: MerchantCardProps) {
  const router = useRouter();
  const colors = useThemeColor();
  const { t, i18n } = useTranslation();
  const isNew = merchant.joinedAt
    ? Date.now() - new Date(merchant.joinedAt).getTime() < 30 * 24 * 60 * 60 * 1000
    : false;
  const openStatus = useMemo(
    () => getMerchantOpenStatus(merchant, i18n.language),
    [merchant, i18n.language]
  );

  const statusLabel = openStatus.isOpen
    ? t('customer.merchant.openUntil', { time: openStatus.closeTime })
    : openStatus.openTime
      ? t('customer.merchant.opensAt', { time: openStatus.openTime })
      : t('customer.merchant.closed');

  return (
    <PressableScale
      testID={testID}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/(customer)/merchant/${merchant.id}`);
      }}
      className={cn('mb-3', className)}
      scale={0.98}
    >
      <Card variant="elevated" className="overflow-hidden p-0">
        <View className="relative">
          <Image source={{ uri: merchant.coverUrl }} className="h-32 w-full" resizeMode="cover" />
          <View className="absolute inset-0 bg-black/10" />
          <View className="absolute left-2 top-2 flex-row gap-1.5">
            <Badge variant={openStatus.isOpen ? 'success' : 'muted'}>{statusLabel}</Badge>
            {isNew && <Badge variant="info">NEW</Badge>}
          </View>
          <View className="absolute right-2 top-2">
            <FavoriteButton
              merchantId={merchant.id}
              size={18}
              variant="overlay"
              className="bg-black/30 p-1.5"
            />
          </View>
        </View>
        <View className="p-3">
          <View className="mb-3 flex-row items-center">
            <Image
              source={{ uri: merchant.logoUrl }}
              className="mr-3 h-12 w-12 rounded-xl"
              resizeMode="cover"
            />
            <View className="flex-1">
              <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
                {merchant.name}
              </Text>
              <ReviewSummary rating={merchant.rating} reviewCount={merchant.reviewCount} />
            </View>
          </View>

          <View className="mb-2 flex-row flex-wrap items-center">
            {merchant.isVerified && <TrustBadge type="verified" />}
            {merchant.hygieneRating && merchant.hygieneRating >= 4.5 && (
              <TrustBadge type="hygiene" label={`Hygiene ${merchant.hygieneRating}`} />
            )}
          </View>

          <View className="flex-row items-center">
            <MapPin size={14} color={colors.muted} />
            <Text variant="caption" className="ml-1.5 flex-1 text-muted" numberOfLines={1}>
              {merchant.address.district}
              {merchant.distance != null ? ` · ${formatDistance(merchant.distance)} away` : ''}
              {' · '}
              {formatCompactNumber(merchant.followers)} followers
            </Text>
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}
