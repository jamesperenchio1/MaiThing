import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Minus, Plus, Copy, Pencil, Trash2, Clock, Check, Tag, Eye } from 'lucide-react-native';

import { Image } from '@/src/components/ui/Image';
import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useUpdateListing } from '@/src/hooks/useListings';
import { useCoupons } from '@/src/hooks/useCoupons';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency, formatCompactNumber } from '@/src/lib/utils';
import type { Listing, ListingStatus } from '@/src/types';

import { shiftWindowToToday } from './utils';
import { PromotionAttachSheet } from './PromotionAttachSheet';

const statusVariantMap: Record<
  ListingStatus,
  'default' | 'warning' | 'success' | 'danger' | 'info'
> = {
  active: 'success',
  sold_out: 'warning',
  expired: 'danger',
  draft: 'info',
};

export function InventoryCard({
  listing,
  merchantId,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
  isSelecting,
  isSelected,
  onLongPress,
  onSelect,
}: {
  listing: Listing;
  merchantId: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  isSelecting: boolean;
  isSelected: boolean;
  onLongPress: () => void;
  onSelect: () => void;
}) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();
  const updateListing = useUpdateListing();
  const [showPromoModal, setShowPromoModal] = useState(false);

  const { data: coupons } = useCoupons(merchantId);

  const attachedCoupon = coupons?.find((c) => c.id === listing.couponId) ?? null;

  const isActive = listing.status === 'active';
  const sellThrough =
    listing.status !== 'draft' && listing.quantity > 0
      ? Math.round(((listing.quantity - listing.quantityRemaining) / listing.quantity) * 100)
      : null;
  const pickupStart = new Date(listing.pickupWindowStart).toLocaleTimeString(i18n.language, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const pickupEnd = new Date(listing.pickupWindowEnd).toLocaleTimeString(i18n.language, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusLabelKey: Record<ListingStatus, string> = {
    active: 'active',
    sold_out: 'soldOut',
    expired: 'expired',
    draft: 'drafts',
  };

  const handleAttachCoupon = (couponId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateListing.mutate(
      { id: listing.id, data: { couponId } },
      { onSuccess: () => setShowPromoModal(false) }
    );
  };

  const handleRemoveCoupon = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateListing.mutate(
      { id: listing.id, data: { couponId: undefined } },
      { onSuccess: () => setShowPromoModal(false) }
    );
  };

  return (
    <PressableScale
      onPress={
        isSelecting
          ? () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect();
            }
          : undefined
      }
      onLongPress={
        !isSelecting
          ? () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onLongPress();
            }
          : undefined
      }
      scale={0.98}
    >
      <Card variant="elevated" className="mb-3 flex-row overflow-hidden p-0">
        {isSelecting && (
          <View className="items-center justify-center px-3">
            {isSelected ? (
              <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                <Check size={14} color={colors.white} />
              </View>
            ) : (
              <View className="w-6 h-6 rounded-full border-2 border-primary bg-transparent" />
            )}
          </View>
        )}
        <Image
          source={{ uri: listing.images[0] }}
          className="w-28 self-stretch"
          resizeMode="cover"
          style={{ backgroundColor: colors.border }}
        />
        <View className="flex-1 p-3">
          <Text variant="body-sm" className="mb-1 font-semibold" numberOfLines={1}>
            {listing.title}
          </Text>
          <View className="mb-1 flex-row items-center gap-1.5">
            {sellThrough !== null && (
              <Badge
                variant={sellThrough >= 80 ? 'success' : sellThrough >= 50 ? 'warning' : 'muted'}
              >
                {t('merchant.inventory.sellThrough', { pct: sellThrough })}
              </Badge>
            )}
            <Badge variant={statusVariantMap[listing.status]}>
              {t(`merchant.inventory.${statusLabelKey[listing.status]}`)}
            </Badge>
          </View>
          <View className="mb-1 flex-row items-center justify-between">
            <Text variant="body-sm" className="text-muted">
              {formatCurrency(listing.salePrice)} ·{' '}
              {t('merchant.inventory.lowStock', { count: listing.quantityRemaining })}
              {listing.quantityRemaining > 0 &&
                listing.quantityRemaining <= (listing.lowStockThreshold ?? 3) && (
                  <Text variant="body-sm" className="font-semibold text-danger">
                    {' '}
                    {t('merchant.inventory.lowStockWarning')}
                  </Text>
                )}
            </Text>
            {isActive && (
              <View className="flex-row items-center rounded-full bg-muted/10">
                <PressableScale
                  onPress={() => {
                    if (listing.quantityRemaining <= 0) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateListing.mutate({
                      id: listing.id,
                      data: { quantityRemaining: listing.quantityRemaining - 1 },
                    });
                  }}
                  scale={0.85}
                  disabled={listing.quantityRemaining <= 0 || updateListing.isPending}
                  hitSlop={8}
                  className="px-3 py-2"
                >
                  <Minus
                    size={12}
                    color={listing.quantityRemaining <= 0 ? colors.muted : colors.foreground}
                  />
                </PressableScale>
                <Text variant="caption" className="min-w-[24px] text-center font-semibold">
                  {listing.quantityRemaining}
                </Text>
                <PressableScale
                  onPress={() => {
                    if (listing.quantityRemaining >= listing.quantity) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateListing.mutate({
                      id: listing.id,
                      data: { quantityRemaining: listing.quantityRemaining + 1 },
                    });
                  }}
                  scale={0.85}
                  disabled={
                    listing.quantityRemaining >= listing.quantity || updateListing.isPending
                  }
                  hitSlop={8}
                  className="px-3 py-2"
                >
                  <Plus
                    size={12}
                    color={
                      listing.quantityRemaining >= listing.quantity
                        ? colors.muted
                        : colors.foreground
                    }
                  />
                </PressableScale>
              </View>
            )}
          </View>
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Clock size={12} color={colors.muted} />
              <Text variant="caption" className="ml-1 text-muted">
                {pickupStart} – {pickupEnd}
              </Text>
            </View>
            {listing.viewCount != null && listing.viewCount > 0 && (
              <View className="flex-row items-center">
                <Eye size={12} color={colors.muted} />
                <Text variant="caption" className="ml-1 text-muted">
                  {formatCompactNumber(listing.viewCount, i18n.language)}
                </Text>
              </View>
            )}
          </View>
          {attachedCoupon && (
            <View className="mb-2 flex-row items-center">
              <View className="flex-row items-center rounded-full bg-primary/10 px-2 py-0.5">
                <Tag size={10} color={colors.primary} />
                <Text variant="caption" className="ml-1 font-semibold text-primary">
                  {attachedCoupon.code}
                </Text>
              </View>
            </View>
          )}
          {!isSelecting && (
            <View className="mt-auto flex-row items-center justify-between border-t border-border pt-2">
              <View className="flex-row items-center">
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onEdit();
                  }}
                  scale={0.95}
                  hitSlop={8}
                  className="mr-3 p-1.5"
                >
                  <View className="flex-row items-center">
                    <Pencil size={14} color={colors.muted} />
                    <Text variant="caption" className="ml-1 text-muted">
                      {t('merchant.inventory.edit')}
                    </Text>
                  </View>
                </PressableScale>
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDuplicate();
                  }}
                  scale={0.9}
                  hitSlop={8}
                  className="mr-3 p-1.5"
                >
                  <Copy size={16} color={colors.muted} />
                </PressableScale>
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDelete();
                  }}
                  scale={0.9}
                  hitSlop={8}
                  className="mr-3 p-1.5"
                >
                  <Trash2 size={16} color={colors.danger} />
                </PressableScale>
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPromoModal(true);
                  }}
                  scale={0.9}
                  hitSlop={8}
                  className="p-1.5"
                >
                  <Tag size={16} color={listing.couponId ? colors.primary : colors.muted} />
                </PressableScale>
              </View>
              {listing.status === 'expired' ? (
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    Alert.alert(
                      t('merchant.inventory.relistToday'),
                      t('merchant.inventory.relistConfirm'),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                          text: t('merchant.inventory.relistToday'),
                          onPress: () => {
                            updateListing.mutate({
                              id: listing.id,
                              data: {
                                status: 'active',
                                quantityRemaining: listing.quantity,
                                pickupWindowStart: shiftWindowToToday(listing.pickupWindowStart),
                                pickupWindowEnd: shiftWindowToToday(listing.pickupWindowEnd),
                              },
                            });
                          },
                        },
                      ]
                    );
                  }}
                  scale={0.95}
                  disabled={updateListing.isPending}
                >
                  <View className="rounded-full bg-primary/10 px-3 py-1">
                    <Text variant="caption" className="font-semibold text-primary">
                      {t('merchant.inventory.relistToday')}
                    </Text>
                  </View>
                </PressableScale>
              ) : (
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onToggleStatus();
                  }}
                  scale={0.95}
                  disabled={updateListing.isPending}
                >
                  <View
                    className={`rounded-full px-3 py-1 ${isActive ? 'bg-danger/10' : 'bg-primary/10'}`}
                  >
                    <Text
                      variant="caption"
                      className={`font-semibold ${isActive ? 'text-danger' : 'text-primary'}`}
                    >
                      {isActive
                        ? t('merchant.inventory.markSoldOut')
                        : t('merchant.inventory.restock')}
                    </Text>
                  </View>
                </PressableScale>
              )}
            </View>
          )}
        </View>
      </Card>

      <PromotionAttachSheet
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        listing={listing}
        coupons={coupons}
        onAttach={handleAttachCoupon}
        onRemove={handleRemoveCoupon}
      />
    </PressableScale>
  );
}
