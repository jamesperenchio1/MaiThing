import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../src/lib/supabase';
import { formatThb } from '@maithing/shared';
import type { Tables } from '@maithing/shared';

type OrderStatus = Tables<'orders'>['status'];

type OrderDetail = {
  id: string;
  status: OrderStatus;
  amount_thb: number;
  pickup_code: string;
  created_at: string;
  listing: { title: string; price_thb: number } | null;
  location: { name: string; address: string } | null;
  pickup_slot: { starts_at: string; ends_at: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  reserved: '#f59e0b',
  paid: '#16a34a',
  collected: '#6b7280',
  cancelled: '#dc2626',
  refunded: '#8b5cf6',
  no_show: '#dc2626',
};

function useOrderDetail(id: string) {
  return useQuery<OrderDetail>({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, status, amount_thb, pickup_code, created_at,
          listing:listings(title, price_thb),
          location:locations(name, address),
          pickup_slot:pickup_slots(starts_at, ends_at)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as OrderDetail;
    },
    staleTime: 30_000,
  });
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: order, isLoading, error } = useOrderDetail(id);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .in('status', ['reserved', 'paid']);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: Error) => {
      Alert.alert(t('common.error'), err.message);
    },
  });

  const handleCancel = () => {
    Alert.alert(
      t('order.cancelTitle'),
      t('order.cancelConfirm'),
      [
        { text: t('common.back'), style: 'cancel' },
        {
          text: t('order.cancelConfirmBtn'),
          style: 'destructive',
          onPress: () => cancelMutation.mutate(),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>{'← '}{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = STATUS_COLOR[order.status] ?? '#9ca3af';
  const isActive = order.status === 'reserved' || order.status === 'paid';
  const canCancel = isActive;

  const slotStart = order.pickup_slot ? new Date(order.pickup_slot.starts_at) : null;
  const slotEnd = order.pickup_slot ? new Date(order.pickup_slot.ends_at) : null;
  const now = new Date();
  const twoHoursBefore = slotStart ? new Date(slotStart.getTime() - 2 * 60 * 60 * 1000) : null;
  const isCancelDeadlinePassed = twoHoursBefore ? now > twoHoursBefore : false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.backText}>{'← '}{t('common.back')}</Text>
      </TouchableOpacity>

      {/* Status badge */}
      <View style={[styles.statusBanner, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
        <Text style={[styles.statusBannerText, { color: statusColor }]}>
          {t(`order.status.${order.status}`)}
        </Text>
      </View>

      {/* Pickup code — large, scannable */}
      {isActive && (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t('order.pickupCode')}</Text>
          <Text style={styles.codeValue}>{order.pickup_code}</Text>
          <Text style={styles.codeHint}>{t('order.showToStaff')}</Text>
        </View>
      )}

      {/* Listing */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>{t('order.item')}</Text>
        <Text style={styles.cardBody}>{order.listing?.title ?? '—'}</Text>
        <Text style={styles.cardSub}>{formatThb(order.amount_thb)}</Text>
      </View>

      {/* Location */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>{t('order.location')}</Text>
        <Text style={styles.cardBody}>{order.location?.name ?? '—'}</Text>
        {order.location?.address ? (
          <Text style={styles.cardSub}>{order.location.address}</Text>
        ) : null}
      </View>

      {/* Pickup window */}
      {slotStart && slotEnd && (
        <View style={styles.card}>
          <Text style={styles.cardHeading}>{t('order.pickupWindow')}</Text>
          <Text style={styles.cardBody}>
            {slotStart.toLocaleString('th-TH', {
              weekday: 'long', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
          <Text style={styles.cardSub}>
            {'– '}
            {slotEnd.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}

      {/* Cancel */}
      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelBtn, isCancelDeadlinePassed && styles.cancelBtnDisabled]}
          onPress={handleCancel}
          disabled={isCancelDeadlinePassed || cancelMutation.isPending}
          accessibilityRole="button"
        >
          {cancelMutation.isPending ? (
            <ActivityIndicator color="#dc2626" />
          ) : (
            <Text style={[styles.cancelBtnText, isCancelDeadlinePassed && styles.cancelBtnTextDisabled]}>
              {isCancelDeadlinePassed ? t('order.cancelTooLate') : t('order.cancel')}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 16, color: '#6b7280' },
  backRow: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#374151' },
  statusBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBannerText: { fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  codeCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: { fontSize: 12, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  codeValue: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: 6, marginBottom: 8 },
  codeHint: { fontSize: 12, color: '#6b7280' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeading: { fontSize: 12, color: '#9ca3af', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  cardBody: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cardSub: { fontSize: 14, color: '#6b7280' },
  cancelBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#dc2626',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnDisabled: { borderColor: '#e5e7eb' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
  cancelBtnTextDisabled: { color: '#9ca3af' },
  backBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});
