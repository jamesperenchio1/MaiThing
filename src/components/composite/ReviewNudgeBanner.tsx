import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Star, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useReviews } from '@/src/hooks/useReviews';
import type { Order } from '@/src/types';

interface ReviewNudgeBannerProps {
  orders: Order[];
}

export function ReviewNudgeBanner({ orders }: ReviewNudgeBannerProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const [dismissed, setDismissed] = useState<string | null>(null);

  const reviewableOrder = orders.find(
    (o) => (o.status === 'completed' || o.status === 'picked_up') && o.id !== dismissed
  );

  const { data: reviews } = useReviews(reviewableOrder?.merchantId ?? '');

  if (!reviewableOrder) return null;

  const alreadyReviewed = reviews?.some((r) => r.orderId === reviewableOrder.id);
  if (alreadyReviewed) return null;

  return (
    <Card variant="outlined" className="mb-4 border-warning/40 bg-warning/5">
      <View className="flex-row items-start">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${colors.warning}20` }}
        >
          <Star size={20} color={colors.warning} fill={colors.warning} />
        </View>
        <View className="flex-1">
          <Text variant="body-sm" className="font-semibold">
            {t('customer.orders.reviewNudge.title')}
          </Text>
          <Text variant="caption" className="mt-0.5 text-muted">
            {t('customer.orders.reviewNudge.body', { merchant: reviewableOrder.merchantName })}
          </Text>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 self-start"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/(customer)/order/${reviewableOrder.id}` as any);
            }}
          >
            {t('customer.orders.reviewNudge.action')}
          </Button>
        </View>
        <PressableScale
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDismissed(reviewableOrder.id);
          }}
          scale={0.9}
          hitSlop={8}
        >
          <X size={18} color={colors.muted} />
        </PressableScale>
      </View>
    </Card>
  );
}
