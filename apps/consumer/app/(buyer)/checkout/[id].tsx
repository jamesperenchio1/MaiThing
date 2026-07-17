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
import { supabase } from '../../../src/lib/supabase';
import { useListingStore } from '../../../src/stores/listing';
import { formatThb } from '@maithing/shared';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { selectedSlot, pickedItems, reset } = useListingStore();
  const [qty, setQty] = useState(1);

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
      const items = pickedItems.length > 0 ? pickedItems.map((i) => ({
        listing_item_id: i.itemId,
        qty: i.qty,
      })) : undefined;

      const { data, error } = await supabase.rpc('reserve_order', {
        p_listing_id: id,
        p_slot_id: selectedSlot.id,
        p_qty: listing?.fulfillment_type === 'surprise_bag' ? qty : 1,
        p_items: items as unknown as null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['listing', id] });
      void qc.invalidateQueries({ queryKey: ['orders'] });
      reset();
      router.replace(`/(buyer)/orders`);
    },
    onError: (err: Error) => {
      Alert.alert('Reservation failed', err.message);
    },
  });

  const handleConfirm = useCallback(() => {
    if (!selectedSlot) {
      Alert.alert(t('order.selectSlot'), t('order.selectSlot'));
      return;
    }
    reserveMutation.mutate();
  }, [selectedSlot, reserveMutation, t]);

  if (isLoading || !listing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const isSurpriseBag = listing.fulfillment_type === 'surprise_bag';
  const total = listing.price_thb * qty;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.backText}>{'← '}{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>{t('order.selectSlot')}</Text>

        {/* Listing summary */}
        <View style={styles.card}>
          <Text style={styles.listingTitle}>{listing.title}</Text>
          <Text style={styles.listingPrice}>{formatThb(listing.price_thb)} / bag</Text>
        </View>

        {/* Slot summary */}
        {selectedSlot && (
          <View style={styles.card}>
            <Text style={styles.slotLabel}>Pickup window</Text>
            <Text style={styles.slotValue}>
              {new Date(selectedSlot.starts_at).toLocaleString('th-TH', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
              {' – '}
              {new Date(selectedSlot.ends_at).toLocaleTimeString('th-TH', {
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
        )}

        {/* Qty picker for surprise bag */}
        {isSurpriseBag && (
          <View style={styles.card}>
            <Text style={styles.slotLabel}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={[styles.stepBtn, qty <= 1 && styles.stepBtnDisabled]}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                accessibilityRole="button"
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity
                style={[styles.stepBtn, qty >= listing.qty_remaining && styles.stepBtnDisabled]}
                onPress={() => setQty((q) => Math.min(listing.qty_remaining, q + 1))}
                disabled={qty >= listing.qty_remaining}
                accessibilityRole="button"
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatThb(total)}</Text>
        </View>

        <Text style={styles.cancelPolicy}>{t('order.cancelPolicy')}</Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, (reserveMutation.isPending || !selectedSlot) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={reserveMutation.isPending || !selectedSlot}
          accessibilityRole="button"
        >
          {reserveMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>
              {t('order.pay', { amount: total })}
            </Text>
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
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 8 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDisabled: { backgroundColor: '#e5e7eb' },
  stepBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  qtyText: { fontSize: 18, fontWeight: '700', color: '#111827', minWidth: 24, textAlign: 'center' },
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
