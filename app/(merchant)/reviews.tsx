import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Star, MessageCircle } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantReviews, useReplyToReview } from '@/src/hooks/useMerchants';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatRelativeTime } from '@/src/lib/utils';
import type { Review } from '@/src/types';

function StarRating({ rating }: { rating: number }) {
  const colors = useThemeColor();
  return (
    <View className="flex-row">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          color={i < Math.round(rating) ? '#F59E0B' : colors.muted}
          fill={i < Math.round(rating) ? '#F59E0B' : 'transparent'}
        />
      ))}
    </View>
  );
}

function ReviewCard({
  review,
  replyingId,
  setReplyingId,
  replyText,
  setReplyText,
  onReply,
  isPending,
}: {
  review: Review;
  replyingId: string | null;
  setReplyingId: (id: string | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  onReply: (reviewId: string) => void;
  isPending: boolean;
}) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();
  const isReplying = replyingId === review.id;

  return (
    <Card variant="outlined" className="mb-4">
      <View className="flex-row items-start justify-between">
        <View>
          <Text variant="body" className="font-semibold">
            {review.customerName}
          </Text>
          <View className="mt-1 flex-row items-center">
            <StarRating rating={review.rating} />
            <Text variant="caption" className="ml-2 text-muted">
              {formatRelativeTime(review.createdAt, i18n.language)}
            </Text>
          </View>
        </View>
        <Text variant="h3" className="text-primary">
          {review.rating.toFixed(1)}
        </Text>
      </View>

      <Text variant="body" className="mt-3">
        {review.comment}
      </Text>

      {review.merchantReply && (
        <View className="mt-3 rounded-2xl bg-muted/10 p-3">
          <Text variant="caption" className="mb-1 text-muted">
            {t('merchant.reviews.replied')}
          </Text>
          <Text variant="body-sm">{review.merchantReply}</Text>
        </View>
      )}

      {!review.merchantReply && !isReplying && (
        <Button
          testID={`reply-to-review-${review.id}`}
          variant="secondary"
          size="sm"
          className="mt-3 self-start"
          onPress={() => {
            setReplyingId(review.id);
            setReplyText('');
          }}
        >
          {t('merchant.reviews.reply')}
        </Button>
      )}

      {isReplying && (
        <View className="mt-3">
          <Input
            testID={`reply-input-${review.id}`}
            value={replyText}
            onChangeText={setReplyText}
            placeholder={t('merchant.reviews.reply')}
            containerClassName="mb-2"
            multiline
            maxLength={500}
          />
          <View className="flex-row justify-end space-x-2">
            <Button variant="ghost" size="sm" onPress={() => setReplyingId(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              testID={`submit-reply-${review.id}`}
              size="sm"
              onPress={() => onReply(review.id)}
              disabled={!replyText.trim() || isPending}
              loading={isPending}
            >
              {t('merchant.reviews.reply')}
            </Button>
          </View>
        </View>
      )}
    </Card>
  );
}

export default function MerchantReviewsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const merchantId = user?.id ?? '';
  const colors = useThemeColor();
  const { data: reviews, isLoading, isError, refetch } = useMerchantReviews(merchantId);
  const { mutate: replyToReview, isPending } = useReplyToReview();

  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const averageRating = useMemo(() => {
    if (!reviews?.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const trustScore = useMemo(() => {
    if (!reviews?.length) return 0;
    const positive = reviews.filter((r) => r.rating >= 4).length;
    return Math.round((positive / reviews.length) * 100);
  }, [reviews]);

  const handleReply = (reviewId: string) => {
    const reply = replyText.trim();
    if (!reply) return;
    replyToReview(
      { reviewId, reply },
      {
        onSuccess: () => {
          setReplyingId(null);
          setReplyText('');
        },
      }
    );
  };

  return (
    <Screen testID="merchant-reviews-screen" scrollable className="bg-background">
      <Header title={t('merchant.reviews.title')} />
      <View className="px-6 py-4">
        {isError && (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your reviews."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        )}

        {!isLoading && !isError && reviews?.length === 0 && (
          <EmptyState
            icon={<MessageCircle size={32} color={colors.muted} />}
            title={t('merchant.reviews.noReviews')}
          />
        )}

        {reviews && reviews.length > 0 && (
          <>
            <View className="mb-6 flex-row space-x-3">
              <Card variant="elevated" className="flex-1 items-center py-5">
                <Text variant="h1" className="text-4xl text-primary">
                  {averageRating.toFixed(1)}
                </Text>
                <StarRating rating={averageRating} />
                <Text variant="caption" className="mt-2 text-muted">
                  {t('merchant.reviews.average', { rating: averageRating })}
                </Text>
              </Card>
              <Card variant="elevated" className="flex-1 items-center py-5">
                <Text variant="h1" className="text-4xl text-primary">
                  {reviews.length}
                </Text>
                <Text variant="caption" className="mt-2 text-muted">
                  {t('customer.merchant.reviewCount', { count: reviews.length })}
                </Text>
              </Card>
              <Card variant="elevated" className="flex-1 items-center py-5">
                <Text variant="h1" className="text-4xl text-primary">
                  {trustScore}%
                </Text>
                <Text variant="caption" className="mt-2 text-muted">
                  {t('merchant.reviews.trustScore')}
                </Text>
              </Card>
            </View>

            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                replyingId={replyingId}
                setReplyingId={setReplyingId}
                replyText={replyText}
                setReplyText={setReplyText}
                onReply={handleReply}
                isPending={isPending}
              />
            ))}
          </>
        )}
      </View>
    </Screen>
  );
}
