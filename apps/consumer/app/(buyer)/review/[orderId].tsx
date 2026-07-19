import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../src/lib/supabase';
import type { Tables } from '@maithing/shared';

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
            <Text style={[styles.star, star <= value && styles.starFilled]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: order, isLoading } = useOrderForReview(orderId);
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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.center}>
        <Text style={styles.thankYou}>{t('review.thankYou')}</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <TouchableOpacity
        style={styles.backRow}
        onPress={() => router.back()}
        accessibilityRole="button"
      >
        <Text style={styles.backText}>
          {'← '}
          {t('common.back')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('review.title')}</Text>

      <View style={styles.card}>
        <Text style={styles.orderLabel}>{order?.listing?.title ?? '—'}</Text>
        <Text style={styles.orderSub}>{order?.location?.name ?? '—'}</Text>
      </View>

      <View style={styles.card}>
        <StarRating label={t('review.overallRating')} value={overall} onChange={setOverall} />
        <View style={styles.divider} />
        <StarRating label={t('review.valueRating')} value={value} onChange={setValue} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('review.comment')}</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          accessibilityLabel={t('review.comment')}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, submitMutation.isPending && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitMutation.isPending}
        accessibilityRole="button"
      >
        {submitMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>{t('review.submit')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  backRow: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#374151' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  orderSub: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  starLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
  stars: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 28, color: '#d1d5db' },
  starFilled: { color: '#f59e0b' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: '#d1d5db' },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  thankYou: { fontSize: 18, fontWeight: '600', color: '#16a34a', textAlign: 'center' },
  backBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: { color: '#fff', fontWeight: '600' },
});
