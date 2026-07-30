import { View } from 'react-native';
import { BadgeCheck, ShieldCheck, Award } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface TrustBadgeProps {
  type: 'verified' | 'guarantee' | 'hygiene';
  label?: string;
  rating?: number;
}

export function TrustBadge({ type, label, rating }: TrustBadgeProps) {
  const colors = useThemeColor();
  const { t } = useTranslation();

  const config = {
    verified: {
      icon: BadgeCheck,
      defaultLabel: t('customer.merchant.verified'),
      color: colors.primary,
      bg: `${colors.primary}15`,
    },
    guarantee: {
      icon: ShieldCheck,
      defaultLabel: t('customer.merchant.guarantee'),
      color: colors.info,
      bg: `${colors.info}15`,
    },
    hygiene: {
      icon: Award,
      defaultLabel: t('customer.merchant.hygieneRated', { rating }),
      color: colors.success,
      bg: `${colors.success}15`,
    },
  };

  const { icon: Icon, defaultLabel, color, bg } = config[type];

  return (
    <View
      className="mr-2 flex-row items-center rounded-full px-2.5 py-1"
      style={{ backgroundColor: bg }}
    >
      <Icon size={12} color={color} />
      <Text className="ml-1 text-xs font-semibold" style={{ color }}>
        {label ?? defaultLabel}
      </Text>
    </View>
  );
}
