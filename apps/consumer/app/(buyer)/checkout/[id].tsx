import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { supabase } from '../../../src/lib/supabase';
import { capture } from '../../../src/lib/posthog';
import { useListingStore } from '../../../src/stores/listing';
import { formatThb } from '@maithing/shared';

type ReserveOrderResponse = {
  order_id: string;
  pickup_code: string;
  qr_payload: string;
};

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { selectedSlot, pickedItems, reset } = useListingStore();
  const [orderId, setOrderId] = useState<string | null>(null);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price_thb, fulfillment_type, qty_remaining, location_id')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const reserveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot) throw new Error('No slot selected');
      const items =
        pickedItems.length > 0
          ? pickedItems.map((i) => ({ listing_item_id: i.itemId, qty: i.qty }))
          : undefined;

      const { data, error } = await supabase.rpc('reserve_order', {
        p_listing_id: id,
        p_slot_id: selectedSlot.id,
        p_items: items as unknown as null,
      });
      if (error) throw error;
      const result = (data as unknown as ReserveOrderResponse[])[0];
      if (!result) throw new Error('Reservation returned no order');
      return result;
    },
    onSuccess: (order) => {
      setOrderId(order.order_id);
      capture('listing_reserved', { listing_id: id, order_id: order.order_id });
    },
    onError: (err: Error) => {
      Alert.alert(t('order.reservationFailed'), err.message);
    },
  });

  const createPaymentIntent = async (reservedOrderId: string): Promise<string> => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
    if (!supabaseUrl) throw new Error('Missing Supabase URL');

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error('Not authenticated');

    const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({ order_id: reservedOrderId }),
    });

    const result = (await response.json()) as { client_secret?: string; error?: string };
    if (!response.ok || !result.client_secret) {
      throw new Error(result.error ?? 'Could not create payment intent');
    }
    return result.client_secret;
  };

  const handlePayment = useCallback(
    async (reservedOrderId: string) => {
      const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY as string;
      if (!publishableKey) {
        Alert.alert(t('order.stripeNotConfigured'), t('order.paymentKeyMissing'));
        return;
      }

      try {
        const clientSecret = await createPaymentIntent(reservedOrderId);

        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: 'MaiThing',
          paymentIntentClientSecret: clientSecret,
          defaultBillingDetails: { name: 'MaiThing Buyer' },
          // Allows cards and PromptPay on supported platforms.
          allowsDelayedPaymentMethods: true,
        });
        if (initError) throw new Error(initError.message);

        const { error: paymentError } = await presentPaymentSheet();
        if (paymentError) throw new Error(paymentError.message);

        // Payment sheet succeeded; webhook will flip order status to 'paid'.
        void qc.invalidateQueries({ queryKey: ['listing', id] });
        void qc.invalidateQueries({ queryKey: ['orders'] });
        reset();
        router.replace(`/(buyer)/order/${reservedOrderId}`);
      } catch (err) {
        Alert.alert(
          t('order.paymentFailed'),
          err instanceof Error ? err.message : t('common.unknownError'),
        );
      }
    },
    [id, qc, reset],
  );

  const handleConfirm = useCallback(() => {
    if (!selectedSlot) {
      Alert.alert(t('order.selectSlot'), t('order.selectSlot'));
      return;
    }
    if (orderId) {
      void handlePayment(orderId);
      return;
    }
    reserveMutation.mutate(undefined, {
      onSuccess: (order) => {
        void handlePayment(order.order_id);
      },
    });
  }, [selectedSlot, orderId, reserveMutation, handlePayment, t]);

  if (isLoading || !listing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const total = listing.price_thb;
  const isPending = reserveMutation.isPending;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>
            {'← '}
            {t('common.back')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.heading}>{t('order.selectSlot')}</Text>

        {/* Listing summary */}
        <View style={styles.card}>
          <Text style={styles.listingTitle}>{listing.title}</Text>
          <Text style={styles.listingPrice}>
            {formatThb(listing.price_thb)} {t('listing.perBag')}
          </Text>
        </View>

        {/* Slot summary */}
        {selectedSlot && (
          <View style={styles.card}>
            <Text style={styles.slotLabel}>{t('listing.pickupWindow')}</Text>
            <Text style={styles.slotValue}>
              {new Date(selectedSlot.starts_at).toLocaleString('th-TH', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' – '}
              {new Date(selectedSlot.ends_at).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}

        {/* Order total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{t('listing.total')}</Text>
          <Text style={styles.totalAmount}>{formatThb(total)}</Text>
        </View>

        <Text style={styles.cancelPolicy}>{t('order.cancelPolicy')}</Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, (isPending || !selectedSlot) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={isPending || !selectedSlot}
          accessibilityRole="button"
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>{t('order.pay', { amount: total })}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#374151' },
  heading: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
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
  listingTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  listingPrice: { fontSize: 14, color: '#6b7280' },
  slotLabel: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  slotValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  totalCard: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#15803d' },
  totalAmount: { fontSize: 22, fontWeight: '700', color: '#15803d' },
  cancelPolicy: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 8 },
  bottomSpacer: { height: 100 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: '#d1d5db' },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
