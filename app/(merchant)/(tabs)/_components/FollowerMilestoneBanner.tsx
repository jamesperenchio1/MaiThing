import { View } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { Merchant } from '@/src/types';

export function FollowerMilestoneBanner({ merchant }: { merchant?: Merchant | null }) {
  const colors = useThemeColor();
  const { t, i18n } = useTranslation();

  if (!merchant || merchant.followers <= 0) return null;

  const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
  const lastMilestone = merchant.lastFollowerMilestone ?? 0;
  const crossed = milestones.filter((m) => merchant.followers >= m && m > lastMilestone);
  const latestCrossed = crossed[crossed.length - 1];
  if (!latestCrossed) return null;

  return (
    <Card variant="elevated" className="mb-6 border-2 border-primary/30 bg-primary/5">
      <View className="flex-row items-center">
        <View className="mr-3 rounded-full bg-primary/10 p-2">
          <Trophy size={24} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text variant="body-sm" className="font-bold text-primary">
            {t('merchant.dashboard.followersMilestone', {
              count: new Intl.NumberFormat(i18n.language).format(latestCrossed),
            })}
          </Text>
          <Text variant="caption" className="text-muted">
            {t('merchant.dashboard.followersCount', {
              count: new Intl.NumberFormat(i18n.language).format(merchant.followers),
            })}
          </Text>
        </View>
      </View>
    </Card>
  );
}
