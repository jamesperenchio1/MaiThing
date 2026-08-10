import { View, ScrollView } from 'react-native';
import { Image } from '@/src/components/ui/Image';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatRelativeTime } from '@/src/lib/utils';
import type { Review } from '@/src/types';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const colors = useThemeColor();
  const { i18n } = useTranslation();

  return (
    <Card variant="outlined" className="mb-3 rounded-2xl p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="body-sm" className="font-semibold">
          {review.customerName}
        </Text>
        <Text variant="caption">{formatRelativeTime(review.createdAt, i18n.language)}</Text>
      </View>
      <View className="mb-2 flex-row items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={12}
            color={colors.warning}
            fill={i < review.rating ? colors.warning : 'transparent'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
      <Text variant="body-sm" className="text-muted">
        {review.comment}
      </Text>
      {review.images && review.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {review.images.map((uri, index) => (
            <Image
              key={`${uri}-${index}`}
              source={{ uri }}
              className="h-16 w-16 rounded-xl"
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}
    </Card>
  );
}
