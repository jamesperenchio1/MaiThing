import { useState } from 'react';
import { View, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { Image } from '@/src/components/ui/Image';
import { Star, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatRelativeTime } from '@/src/lib/utils';
import type { Review } from '@/src/types';

interface ReviewCardProps {
  review: Review;
}

function ReviewImageLightbox({
  images,
  visible,
  initialIndex,
  onClose,
}: {
  images: string[];
  visible: boolean;
  initialIndex: number;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <PressableScale
          onPress={onClose}
          className="absolute right-4 top-12 z-10 rounded-full bg-black/50 p-2"
          scale={0.9}
          accessibilityLabel="Close image"
        >
          <X size={24} color="#fff" />
        </PressableScale>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onMomentumScrollEnd={(e) =>
            setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {images.map((uri, index) => (
            <ScrollView
              key={`review-lightbox-${uri}-${index}`}
              style={{ width }}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <Image source={{ uri }} style={{ width, height }} resizeMode="contain" />
            </ScrollView>
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View className="absolute bottom-8 left-0 right-0 flex-row items-center justify-center">
            {images.map((_, index) => (
              <View
                key={index}
                className={`mx-1 rounded-full ${
                  index === activeIndex ? 'h-2 w-2 bg-white' : 'h-1.5 w-1.5 bg-white/50'
                }`}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  const colors = useThemeColor();
  const { i18n } = useTranslation();
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
            <PressableScale
              key={`${uri}-${index}`}
              onPress={() => {
                setLightboxIndex(index);
                setLightboxVisible(true);
              }}
              scale={0.97}
              accessibilityLabel="View full-screen image"
            >
              <Image source={{ uri }} className="h-16 w-16 rounded-xl" resizeMode="cover" />
            </PressableScale>
          ))}
        </ScrollView>
      )}

      <ReviewImageLightbox
        images={review.images ?? []}
        visible={lightboxVisible}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxVisible(false)}
      />
    </Card>
  );
}
