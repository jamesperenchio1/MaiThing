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
import { issueReasonSchema } from '@maithing/shared';

type OrderWithLocation = Tables<'orders'> & {
  listing: { title: string } | null;
  location: { name: string } | null;
};

const ISSUE_REASONS = issueReasonSchema.options;

function useOrderForIssue(orderId: string) {
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

export default function IssueReportScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: order, isLoading } = useOrderForIssue(orderId);
  const [reason, setReason] = useState<string>(ISSUE_REASONS[0]);
  const [detail, setDetail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('Order not found');
      const { error } = await supabase.from('issue_reports').insert({
        order_id: orderId,
        reason,
        detail: detail.trim() || null,
        photo_urls: photoUrl.trim() ? [photoUrl.trim()] : [],
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
    submitMutation.mutate();
  }, [submitMutation]);

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
        <Text style={styles.thankYou}>{t('issue.submit')}</Text>
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

      <Text style={styles.title}>{t('issue.title')}</Text>

      <View style={styles.card}>
        <Text style={styles.orderLabel}>{order?.listing?.title ?? '—'}</Text>
        <Text style={styles.orderSub}>{order?.location?.name ?? '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('issue.reason')}</Text>
        {ISSUE_REASONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.reasonRow, reason === r && styles.reasonRowSelected]}
            onPress={() => setReason(r)}
            accessibilityRole="radio"
            accessibilityState={{ selected: reason === r }}
          >
            <Text style={[styles.reasonText, reason === r && styles.reasonTextSelected]}>
              {t(`issue.reasons.${r}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('issue.detail')}</Text>
        <TextInput
          style={styles.detailInput}
          value={detail}
          onChangeText={setDetail}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          accessibilityLabel={t('issue.detail')}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('issue.photo')}</Text>
        <TextInput
          style={styles.photoInput}
          value={photoUrl}
          onChangeText={setPhotoUrl}
          placeholder="https://..."
          accessibilityLabel={t('issue.photo')}
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
          <Text style={styles.submitBtnText}>{t('issue.submit')}</Text>
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
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  reasonRow: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  reasonRowSelected: { backgroundColor: '#dcfce7' },
  reasonText: { fontSize: 15, color: '#374151' },
  reasonTextSelected: { color: '#15803d', fontWeight: '600' },
  detailInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
  photoInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
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
