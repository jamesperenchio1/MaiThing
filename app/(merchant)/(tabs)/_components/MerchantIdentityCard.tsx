import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ShieldCheck, Star, Sparkles, Settings } from 'lucide-react-native';

import { Image } from '@/src/components/ui/Image';
import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { getInitials } from '@/src/lib/utils';
import type { Merchant } from '@/src/types';

export function MerchantIdentityCard({
  isLoading,
  merchant,
  onPress,
}: {
  isLoading: boolean;
  merchant?: Merchant | null;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  if (isLoading) {
    return <Skeleton width="100%" height={96} className="mb-6 rounded-3xl" />;
  }

  if (!merchant) return null;

  return (
    <PressableScale testID="merchant-identity-card" scale={0.98} onPress={onPress} className="mb-6">
      <Card variant="elevated">
        <View className="flex-row items-center">
          {merchant.logoUrl ? (
            <Image source={{ uri: merchant.logoUrl }} className="mr-4 h-14 w-14 rounded-2xl" />
          ) : (
            <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Text className="text-lg font-bold text-primary">{getInitials(merchant.name)}</Text>
            </View>
          )}
          <View className="flex-1">
            <Text variant="h3" numberOfLines={1}>
              {merchant.name}
            </Text>
            <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
              {merchant.isVerified && (
                <Badge variant="success">
                  <View className="flex-row items-center">
                    <ShieldCheck size={12} color={colors.success} />
                    <Text className="ml-1 text-xs font-semibold text-green-800">
                      {t('merchant.dashboard.verified')}
                    </Text>
                  </View>
                </Badge>
              )}
              <Badge variant="default">
                <View className="flex-row items-center">
                  <Star size={12} color={colors.primary} />
                  <Text className="ml-1 text-xs font-semibold text-primary">
                    {merchant.rating.toFixed(1)}
                  </Text>
                </View>
              </Badge>
              {merchant.hygieneRating && (
                <Badge variant="default">
                  <View className="flex-row items-center">
                    <Sparkles size={12} color={colors.primary} />
                    <Text className="ml-1 text-xs font-semibold text-primary">
                      {t('merchant.dashboard.hygieneRated', {
                        rating: merchant.hygieneRating,
                      })}
                    </Text>
                  </View>
                </Badge>
              )}
            </View>
            <Text variant="caption" className="mt-1.5 text-muted">
              {t('merchant.dashboard.tapToManageSettings')}
            </Text>
          </View>
          <View testID="merchant-settings-icon">
            <Settings size={18} color={colors.muted} />
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}
