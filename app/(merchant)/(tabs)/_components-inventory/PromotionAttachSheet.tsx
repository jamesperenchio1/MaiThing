import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Check } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { Coupon, Listing } from '@/src/types';

export function PromotionAttachSheet({
  isOpen,
  onClose,
  listing,
  coupons,
  onAttach,
  onRemove,
}: {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  coupons: Coupon[] | undefined;
  onAttach: (couponId: string) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} enableScroll={true}>
      <View className="mb-4 flex-row items-center justify-between">
        <PressableScale
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          scale={0.95}
        >
          <X size={22} color={colors.muted} />
        </PressableScale>
        <Text variant="h3">{t('merchant.inventory.attachPromotion')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {coupons && coupons.length > 0 ? (
          coupons.map((coupon) => {
            const isAttached = listing.couponId === coupon.id;
            return (
              <PressableScale
                key={coupon.id}
                onPress={() => onAttach(coupon.id)}
                scale={0.98}
                className="mb-3"
              >
                <View
                  className={`rounded-xl border p-3 ${
                    isAttached ? 'border-primary bg-primary/10' : 'border-border bg-background'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text variant="body-sm" className="font-semibold">
                        {coupon.code}
                      </Text>
                      <Text variant="caption" className="text-muted">
                        {coupon.discountType === 'percentage'
                          ? t('merchant.inventory.percentOff', { value: coupon.discountValue })
                          : t('merchant.inventory.amountOff', { value: coupon.discountValue })}
                        {coupon.minOrderAmount
                          ? t('merchant.inventory.minOrderSuffix', {
                              value: coupon.minOrderAmount,
                            })
                          : ''}
                      </Text>
                      {coupon.description ? (
                        <Text variant="caption" className="mt-0.5 text-muted" numberOfLines={1}>
                          {coupon.description}
                        </Text>
                      ) : null}
                    </View>
                    {isAttached && <Check size={18} color={colors.primary} />}
                  </View>
                </View>
              </PressableScale>
            );
          })
        ) : (
          <Text variant="body-sm" className="text-center text-muted py-6">
            {t('merchant.inventory.noPromotions')}
          </Text>
        )}

        {listing.couponId && (
          <PressableScale onPress={onRemove} scale={0.97} className="mt-2">
            <View className="rounded-xl border border-danger/30 bg-danger/5 p-3 items-center">
              <Text variant="body-sm" className="font-semibold text-danger">
                {t('merchant.inventory.removePromo')}
              </Text>
            </View>
          </PressableScale>
        )}
      </ScrollView>
    </BottomSheet>
  );
}
