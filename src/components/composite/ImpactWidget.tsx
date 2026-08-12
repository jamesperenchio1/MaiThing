import { View } from 'react-native';
import { Utensils, Coins, Leaf } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency, formatCompactNumber } from '@/src/lib/utils';
import type { CustomerImpact } from '@/src/types';

interface ImpactWidgetProps {
  impact: CustomerImpact;
}

export function ImpactWidget({ impact }: ImpactWidgetProps) {
  const colors = useThemeColor();
  const { t } = useTranslation();

  const items = [
    {
      icon: Utensils,
      value: formatCompactNumber(impact.mealsSaved),
      label: t('customer.home.impact.mealsSaved'),
    },
    {
      icon: Coins,
      value: formatCurrency(impact.moneySaved),
      label: t('customer.home.impact.moneySaved'),
    },
    { icon: Leaf, value: `${impact.co2SavedKg} kg`, label: t('customer.home.impact.co2Saved') },
  ];

  return (
    <Card variant="outlined" className="mb-6 rounded-3xl p-5">
      <View className="flex-row items-center justify-around gap-2">
        {items.map((item, index) => (
          <View key={item.label} className="flex-1 min-w-0 items-center px-1 py-2">
            <View
              className="mb-3 h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <item.icon size={16} color={colors.primary} />
            </View>
            <Text variant="h4" className="text-center text-primary" numberOfLines={1}>
              {item.value}
            </Text>
            <Text variant="caption" className="text-center" numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
