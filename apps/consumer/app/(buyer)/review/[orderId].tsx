import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../src/lib/supabase';
import type { Tables } from '@maithing/shared';
import {
  Screen,
  Card,
  Button,
  Icon,
  Input,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../../../src/components/ui';
import { useTheme } from '../../../src/theme';
import { icons } from '../../../src/icons';

type OrderWithLocation = Tables<'orders'> & {
  listing: { title: string } | null;
  location: { name: string } | null;
};

function useOrderForReview(orderId: string) {
  return useQuery<OrderWithLocation>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          'id, buyer_id, listing_id, location_id, status, listing:listings(title), location:locations(name)',
        )
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data as unknown as OrderWithLocation;
    },
  });
}

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (rating: number) => void;
  label: string;
}) {
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const styles = makeStarStyles(colors, spacing, fontSizes, fontWeights);

  return (
    <View style={styles.starRow}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            accessibilityRole="button"
            accessibilityLabel={`${star}`}
          >
            <Icon
              name={star <= value ? icons.star : icons.starOutline}
              size={28}
              color={colors.warning}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing, fontSizes, fontWeights } = theme;
  const qc = useQueryClient();
  const { data: order, isLoading, error, refetch } = useOrderForReview(orderId);
  const [overall, setOverall] = useState(0);
  const [value, setValue] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('Order not found');
      const { error } = await supabase.from('reviews').insert({
        order_id: orderId,
        buyer_id: order.buyer_id,
        location_id: order.location_id,
        overall_rating: overall,
        value_rating: value,
        comment: comment.trim() || null,
        photo_urls: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['order', orderId] });
      setSubmitted(true);
    },
    onError: (err: Error) => {
      Alert.alert(t('common.error'), err.message);
    },
  });

  const handleSubmit = useCallback(() => {
    if (overall === 0 || value === 0) {
      Alert.alert(t('common.error'), t('review.ratingRequired'));
      return;
    }
    submitMutation.mutate();
  }, [overall, value, submitMutation, t]);

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error || !order) {
    return (
      <Screen>
        <ErrorState
          title={t('common.error')}
          description={error?.message}
          onRetry={() => void refetch()}
          retryLabel={t('common.retry')}
        />
      </Screen>
    );
  }

  if (submitted) {
    return (
      <Screen>
        <EmptyState
          title={t('review.thankYou')}
          icon={icons.success}
          action={{
            label: t('common.back'),
            onPress: () => router.back(),
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Icon name={icons.back} size={24} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('review.title')}</Text>

        <Card>
          <Text style={styles.orderLabel}>{order?.listing?.title ?? '—'}</Text>
          <Text style={styles.orderSub}>{order?.location?.name ?? '—'}</Text>
        </Card>

        <Card>
          <StarRating label={t('review.overallRating')} value={overall} onChange={setOverall} />
          <View style={styles.divider} />
          <StarRating label={t('review.valueRating')} value={value} onChange={setValue} />
        </Card>

        <Card>
          <Input
            label={t('review.comment')}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel={t('review.comment')}
            style={styles.commentInput}
          />
        </Card>

        <Button
          size="lg"
          onPress={handleSubmit}
          loading={submitMutation.isPending}
          disabled={submitMutation.isPending}
        >
          {t('review.submit')}
        </Button>
      </ScrollView>
    </Screen>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      padding: spacing[4],
      paddingBottom: spacing[9],
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      marginBottom: spacing[4],
    },
    backText: {
      fontSize: fontSizes.md,
      color: colors.text,
    },
    title: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[4],
    },
    orderLabel: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.text,
    },
    orderSub: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      marginTop: spacing[1],
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing[3],
    },
    commentInput: {
      minHeight: 100,
    },
  });
}

function makeStarStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    starRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing[1],
    },
    starLabel: {
      fontSize: fontSizes.md,
      color: colors.text,
      fontWeight: fontWeights.medium,
    },
    stars: {
      flexDirection: 'row',
      gap: spacing[2],
    },
  });
}
