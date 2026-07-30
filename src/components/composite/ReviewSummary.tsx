import { View } from 'react-native';
import { Star } from 'lucide-react-native';
import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface ReviewSummaryProps {
  rating: number;
  reviewCount: number;
  size?: 'sm' | 'md';
}

export function ReviewSummary({ rating, reviewCount, size = 'sm' }: ReviewSummaryProps) {
  const colors = useThemeColor();
  const starSize = size === 'md' ? 18 : 14;
  const textVariant = size === 'md' ? 'body' : 'body-sm';

  return (
    <View className="flex-row items-center">
      <Star size={starSize} color={colors.warning} fill={colors.warning} />
      <Text variant={textVariant} className="ml-1 font-semibold">
        {rating.toFixed(1)}
      </Text>
      <Text variant={textVariant} className="ml-1 text-muted">
        ({reviewCount.toLocaleString()})
      </Text>
    </View>
  );
}
