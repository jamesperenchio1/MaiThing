import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { useCartStore } from '@/src/stores/cart';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface CartButtonProps {
  testID?: string;
}

export function CartButton({ testID }: CartButtonProps) {
  const router = useRouter();
  const colors = useThemeColor();
  const { t } = useTranslation();
  const totalItems = useCartStore((s) => s.totalItems());

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(customer)/cart' as any);
  };

  return (
    <Button
      testID={testID}
      variant="ghost"
      size="icon"
      onPress={handlePress}
      accessibilityLabel={t('customer.cart.openCart')}
      accessibilityHint={t('customer.cart.openCartHint')}
      hitSlop={8}
    >
      <View className="relative">
        <ShoppingCart size={24} color={colors.foreground} />
        {totalItems > 0 && (
          <View className="absolute -right-2 -top-2 h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5">
            <Text variant="caption" className="text-white">
              {totalItems > 99 ? '99+' : totalItems}
            </Text>
          </View>
        )}
      </View>
    </Button>
  );
}
