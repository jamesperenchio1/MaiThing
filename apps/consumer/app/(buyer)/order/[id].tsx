import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCreateThread } from '../../../src/hooks/useChat';
import { supabase } from '../../../src/lib/supabase';
import { formatThb } from '@maithing/shared';
import type { Tables } from '@maithing/shared';

type OrderRow = Tables<'orders'>;
type OrderItemRow = Tables<'order_items'>;

type OrderDetail = {
  order: OrderRow;
  listing: { title: string } | null;
  location: { name: string; address_text: string } | null;
  pickup_slot: { starts_at: string; ends_at: string } | null;
  order_items: OrderItemRow[];
  has_review: boolean;
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
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(
          `
          *,
          listing:listings(title),
          location:locations(name, address_text),
          pickup_slot:pickup_slots(starts_at, ends_at),
          order_items:order_items(*)
        `,
        )
        .eq('id', id)
        .single();
      if (orderError) throw orderError;

      const { count, error: reviewError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', id);
      if (reviewError) throw reviewError;

      const raw = order as unknown as {
        order_items: OrderItemRow[] | OrderItemRow;
        listing: { title: string } | null;
        location: { name: string; address_text: string } | null;
        pickup_slot:
          { starts_at: string; ends_at: string } | null | { starts_at: string; ends_at: string }[];
      } & OrderRow;

      const orderItems = Array.isArray(raw.order_items)
        ? raw.order_items
        : raw.order_items
          ? [raw.order_items]
          : [];
      const pickupSlot = Array.isArray(raw.pickup_slot) ? raw.pickup_slot[0] : raw.pickup_slot;

      return {
        order: raw,
        listing: raw.listing,
        location: raw.location,
        pickup_slot: pickupSlot ?? null,
        order_items: orderItems,
        has_review: (count ?? 0) > 0,
      };
    },
    staleTime: 30_000,
  });
}

function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return '0h 0m';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const createThread = useCreateThread();
  const [now, setNow] = useState(new Date());
  const { data: orderDetail, isLoading, error } = useOrderDetail(id);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const cancelMutation = useMutation({
    mutationFn: async (order: OrderRow) => {
      const { error } = await supabase.rpc('cancel_order', { p_order_id: id });
      if (error) throw error;

      if (order.stripe_payment_intent_id) {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) throw new Error('Not authenticated');

        const response = await fetch(`${supabaseUrl}/functions/v1/refund-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ order_id: id }),
        });

        const result = (await response.json()) as {
          status?: string;
          refund_id?: string;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? 'Refund failed');
        }
      }
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
    Alert.alert(t('order.cancelTitle'), t('order.cancelConfirm'), [
      { text: t('common.back'), style: 'cancel' },
      {
        text: t('order.cancelConfirmBtn'),
        style: 'destructive',
        onPress: () => cancelMutation.mutate(order),
      },
    ]);
  };

  const openDirections = useCallback(() => {
    const address = orderDetail?.location?.address_text;
    if (!address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    void Linking.openURL(url);
  }, [orderDetail]);

  const handleContactMerchant = useCallback(async () => {
    if (!orderDetail) return;
    const threadId = await createThread.mutateAsync({
      locationId: orderDetail.order.location_id,
      orderId: id,
    });
    router.push(`/(buyer)/chat/${threadId}`);
  }, [orderDetail, createThread, id]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (error || !orderDetail) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>
            {'← '}
            {t('common.back')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { order, listing, location, pickup_slot, order_items, has_review } = orderDetail;

  const statusColor = STATUS_COLOR[order.status] ?? '#9ca3af';
  const isActive = order.status === 'reserved' || order.status === 'paid';
  const canCancel = isActive;
  const isCollected = order.status === 'collected';
  const slotStart = pickup_slot ? new Date(pickup_slot.starts_at) : null;
  const slotEnd = pickup_slot ? new Date(pickup_slot.ends_at) : null;
  const deadline = slotStart ? new Date(slotStart.getTime() - 2 * 60 * 60 * 1000) : null;
  const isCancelDeadlinePassed = deadline ? now > deadline : false;

  const qrUrl =
    Platform.OS === 'web'
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.qr_payload)}`
      : null;

  let pickupCountdown = '';
  if (slotStart) {
    if (now < slotStart) {
      pickupCountdown = t('order.timeRemaining', { time: formatCountdown(slotStart) });
    } else if (slotEnd && now < slotEnd) {
      pickupCountdown = t('order.pickupWindowEnds', {
        time: slotEnd.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      });
    }
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

      {/* Status badge */}
      <View
        style={[
          styles.statusBanner,
          { backgroundColor: statusColor + '15', borderColor: statusColor },
        ]}
      >
        <Text style={[styles.statusBannerText, { color: statusColor }]}>
          {t(`order.status.${order.status}`)}
        </Text>
      </View>

      {/* Pickup code / QR */}
      {isActive && (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t('order.pickupCode')}</Text>
          <Text style={styles.codeValue}>{order.pickup_code}</Text>
          {qrUrl && (
            <Image
              source={{ uri: qrUrl }}
              style={{ width: 120, height: 120, marginTop: 12, borderRadius: 8 }}
              accessibilityLabel={t('order.qrCode')}
            />
          )}
          <Text style={styles.codeHint}>{t('order.showToStaff')}</Text>
          {pickupCountdown ? <Text style={styles.countdown}>{pickupCountdown}</Text> : null}
        </View>
      )}

      {/* Refund note */}
      {(order.status === 'refunded' || order.status === 'cancelled') && (
        <View style={[styles.statusBanner, { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }]}>
          <Text style={[styles.statusBannerText, { color: '#6b7280' }]}>
            {order.status === 'refunded'
              ? t('order.refundProcessed')
              : t('order.cancelledNoRefund')}
          </Text>
        </View>
      )}

      {/* Listing */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>{t('order.item')}</Text>
        <Text style={styles.cardBody}>{listing?.title ?? '—'}</Text>
        <Text style={styles.cardSub}>{formatThb(order.amount_thb)}</Text>
      </View>

      {/* Location */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>{t('order.location')}</Text>
        <Text style={styles.cardBody}>{location?.name ?? '—'}</Text>
        {location?.address_text ? (
          <Text style={styles.cardSub}>{location.address_text}</Text>
        ) : null}
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => void handleContactMerchant()}
          accessibilityRole="button"
        >
          <Text style={styles.contactBtnText}>{t('chat.contactMerchant')}</Text>
        </TouchableOpacity>
      </View>

      {/* Pickup window */}
      {slotStart && slotEnd && (
        <View style={styles.card}>
          <Text style={styles.cardHeading}>{t('order.pickupWindow')}</Text>
          <Text style={styles.cardBody}>
            {slotStart.toLocaleString('th-TH', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Text style={styles.cardSub}>
            {'– '}
            {slotEnd.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {pickupCountdown ? <Text style={styles.countdown}>{pickupCountdown}</Text> : null}
        </View>
      )}

      {/* Order items */}
      {order_items.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardHeading}>{t('order.items')}</Text>
          {order_items.map((item) => (
            <Text key={item.id} style={styles.cardSub}>
              {item.qty}x {item.name_snapshot}
            </Text>
          ))}
        </View>
      )}

      {/* Directions */}
      {location?.address_text && (
        <TouchableOpacity
          style={styles.directionsBtn}
          onPress={openDirections}
          accessibilityRole="button"
        >
          <Text style={styles.directionsBtnText}>{t('order.directions')}</Text>
        </TouchableOpacity>
      )}

      {/* Cancel */}
      {canCancel && (
        <View>
          {deadline && (
            <Text style={styles.deadlineText}>
              {t('order.cancelDeadline', {
                time: deadline.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              })}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.cancelBtn, isCancelDeadlinePassed && styles.cancelBtnDisabled]}
            onPress={handleCancel}
            disabled={isCancelDeadlinePassed || cancelMutation.isPending}
            accessibilityRole="button"
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator color="#dc2626" />
            ) : (
              <Text
                style={[
                  styles.cancelBtnText,
                  isCancelDeadlinePassed && styles.cancelBtnTextDisabled,
                ]}
              >
                {isCancelDeadlinePassed ? t('order.cancelTooLate') : t('order.cancel')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Post-pickup actions */}
      {isCollected && (
        <View style={styles.postActions}>
          {has_review ? (
            <Text style={styles.reviewedText}>{t('order.reviewed')}</Text>
          ) : (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push(`/(buyer)/review/${id}`)}
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnText}>{t('order.review')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={() => router.push(`/(buyer)/issue/${id}`)}
            accessibilityRole="button"
          >
            <Text style={styles.actionBtnSecondaryText}>{t('order.reportIssue')}</Text>
          </TouchableOpacity>
        </View>
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
  backBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  statusBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 12,
    color: '#9ca3af',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  codeValue: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: 6, marginBottom: 8 },
  codeHint: { fontSize: 12, color: '#6b7280' },
  countdown: { fontSize: 14, color: '#22c55e', fontWeight: '600', marginTop: 8 },
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
  cardHeading: {
    fontSize: 12,
    color: '#9ca3af',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardBody: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cardSub: { fontSize: 14, color: '#6b7280' },
  directionsBtn: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  directionsBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 15 },
  contactBtn: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  contactBtnText: { color: '#16a34a', fontWeight: '600', fontSize: 15 },
  deadlineText: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 8 },
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
  postActions: { gap: 10, marginTop: 8 },
  actionBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnSecondary: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#dc2626' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  actionBtnSecondaryText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
  reviewedText: { fontSize: 14, color: '#16a34a', fontWeight: '600', textAlign: 'center' },
});
