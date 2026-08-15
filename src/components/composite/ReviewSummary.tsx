import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react-native';
import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCompactNumber } from '@/src/lib/utils';

interface ReviewSummaryProps {
  rating: number;
  reviewCount: number;
  size?: 'sm' | 'md';
}

export function ReviewSummary({ rating, reviewCount, size = 'sm' }: ReviewSummaryProps) {
  const colors = useThemeColor();
  const { i18n } = useTranslation();
  const starSize = size === 'md' ? 18 : 14;
  const textVariant = size === 'md' ? 'body' : 'body-sm';

  return (
    <View className="flex-row items-center">
      <Star size={starSize} color={colors.warning} fill={colors.warning} />
      <Text variant={textVariant} className="ml-1 font-semibold">
        {rating.toFixed(1)}
      </Text>
      <Text variant={textVariant} className="ml-1 text-muted">
        ({formatCompactNumber(reviewCount, i18n.language)})
      </Text>
    </View>
  );
}
