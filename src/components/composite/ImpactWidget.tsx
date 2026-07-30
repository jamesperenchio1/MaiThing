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
    { icon: Utensils, value: formatCompactNumber(impact.mealsSaved), label: t('customer.home.impact.mealsSaved') },
    { icon: Coins, value: formatCurrency(impact.moneySaved), label: t('customer.home.impact.moneySaved') },
    { icon: Leaf, value: `${impact.co2SavedKg} kg`, label: t('customer.home.impact.co2Saved') },
  ];

  return (
    <Card variant="outlined" className="mb-6 rounded-3xl p-4">
      <View className="flex-row items-center justify-between">
        {items.map((item, index) => (
          <View key={item.label} className="flex-1 items-center">
            <View
              className="mb-2 rounded-2xl p-2"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <item.icon size={20} color={colors.primary} />
            </View>
            <Text variant="h3" className="text-center text-primary">
              {item.value}
            </Text>
            <Text variant="caption" className="text-center">
              {item.label}
            </Text>
            {index < items.length - 1 && (
              <View
                className="absolute right-0 top-1/4 h-1/2 w-px bg-border"
              />
            )}
          </View>
        ))}
      </View>
    </Card>
  );
}
