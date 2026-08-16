import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Cake,
  Coffee,
  Utensils,
  ShoppingBasket,
  Bed,
  IceCream,
  Leaf,
  Store,
} from 'lucide-react-native';
import { cn } from '@/src/lib/utils';
import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { Category } from '@/src/types';

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  cake: Cake,
  coffee: Coffee,
  utensils: Utensils,
  'shopping-basket': ShoppingBasket,
  bed: Bed,
  'ice-cream': IceCream,
  leaf: Leaf,
  flame: Store,
};

interface CategoryChipProps {
  category: Category;
  isActive?: boolean;
  onPress?: () => void;
  locale?: 'en' | 'th';
  className?: string;
}

export function CategoryChip({
  category,
  isActive,
  onPress,
  locale = 'en',
  className,
}: CategoryChipProps) {
  const Icon = iconMap[category.icon] ?? Coffee;
  const label = locale === 'th' ? category.nameTh : category.name;
  const colors = useThemeColor();
  const { t } = useTranslation();

  return (
    <PressableScale
      testID={`category-chip-${category.id}`}
      onPress={onPress}
      scale={0.95}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      accessibilityHint={
        isActive
          ? t('customer.home.categoryFilterActiveHint', { category: label })
          : t('customer.home.categoryFilterInactiveHint', { category: label })
      }
    >
      <View
        className={cn(
          'mr-3 items-center rounded-2xl border border-border px-4 py-3',
          isActive && 'border-primary bg-primary/10',
          className
        )}
      >
        <Icon size={24} color={isActive ? colors.success : colors.muted} />
        <Text
          variant="caption"
          className={cn('mt-1.5 font-medium', isActive ? 'text-primary' : 'text-muted')}
        >
          {locale === 'th' ? category.nameTh : category.name}
        </Text>
      </View>
    </PressableScale>
  );
}
