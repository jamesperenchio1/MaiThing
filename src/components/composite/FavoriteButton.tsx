import { View } from 'react-native';
import { Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useCustomerProfile, useToggleFavorite } from '@/src/hooks/useFavorites';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { cn } from '@/src/lib/utils';

interface FavoriteButtonProps {
  merchantId: string;
  size?: number;
  variant?: 'overlay' | 'default';
  className?: string;
  testID?: string;
}

export function FavoriteButton({
  merchantId,
  size = 20,
  variant = 'default',
  className,
  testID,
}: FavoriteButtonProps) {
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { t } = useTranslation();
  const { data: profile } = useCustomerProfile(user?.id ?? '');
  const toggle = useToggleFavorite();

  const isFavorite = profile?.favorites.includes(merchantId) ?? false;

  const handlePress = () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggle.mutate({ userId: user.id, merchantId, isFavorite });
  };

  return (
    <PressableScale
      testID={testID ?? (isFavorite ? 'favorite-button-filled' : 'favorite-button-empty')}
      onPress={handlePress}
      className={cn(
        'rounded-full p-2',
        variant === 'overlay' ? 'bg-black/30' : 'bg-muted/10',
        className
      )}
      scale={0.9}
      disabled={toggle.isPending}
      accessibilityLabel={t(isFavorite ? 'common.removeFromFavorites' : 'common.addToFavorites')}
      accessibilityRole="button"
      accessibilityState={{ selected: isFavorite }}
      hitSlop={8}
    >
      <Heart
        size={size}
        color={isFavorite ? colors.danger : variant === 'overlay' ? '#fff' : colors.foreground}
        fill={isFavorite ? colors.danger : 'transparent'}
      />
    </PressableScale>
  );
}
