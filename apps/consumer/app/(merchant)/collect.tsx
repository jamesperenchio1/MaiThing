import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useMerchantOrg } from '../../src/hooks/useProfile';
import { collectOrder } from '../../src/lib/merchant';
import { formatThb } from '@maithing/shared';
import type { Tables } from '@maithing/shared';

type OrderRow = Tables<'orders'> & {
  buyer: { display_name: string | null } | null;
  listing: { title: string } | null;
  pickup_slot: Tables<'pickup_slots'> | null;
  location: { name: string } | null;
};

export default function CollectScreen() {
  const { t } = useTranslation();
  const { locations } = useMerchantOrg();
  const locationIds = locations.map((l) => l.id);
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!code.trim() || locationIds.length === 0) return;
    setIsSearching(true);
    setError(null);
    setOrder(null);

    const { data, error: searchError } = await supabase
      .from('orders')
      .select(
        `
        *,
        buyer:profiles(display_name),
        listing:listings(title),
        pickup_slot:pickup_slots(*),
        location:locations(name)
      `,
      )
      .eq('pickup_code', code.trim().toUpperCase())
      .in('location_id', locationIds)
      .in('status', ['reserved', 'paid'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (searchError) {
      setError(searchError.message);
      setIsSearching(false);
      return;
    }

    if (!data || data.length === 0) {
      setError(t('merchant.orderNotFound'));
    } else {
      setOrder(data[0] as unknown as OrderRow);
    }
    setIsSearching(false);
  };

  const confirmCollect = async () => {
    if (!order) return;
    setIsCollecting(true);
    setError(null);
    try {
      await collectOrder(order.id, order.pickup_code);
      router.replace('/(merchant)/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setIsCollecting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('merchant.confirmPickup')}</Text>
      <Text style={styles.subtitle}>{t('merchant.collectSubtitle')}</Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={setCode}
          placeholder={t('merchant.enterPickupCode')}
          autoCapitalize="characters"
          maxLength={6}
        />
        <TouchableOpacity
          style={[styles.searchBtn, (!code.trim() || isSearching) && styles.btnDisabled]}
          onPress={() => void search()}
          disabled={!code.trim() || isSearching}
          accessibilityRole="button"
        >
          {isSearching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{t('common.search')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {order && (
        <View style={styles.orderCard}>
          <Text style={styles.orderTitle}>{order.listing?.title ?? '—'}</Text>
          <Text style={styles.orderDetail}>{order.location?.name ?? '—'}</Text>
          <Text style={styles.orderDetail}>
            {order.buyer?.display_name ?? t('merchant.anonymousBuyer')}
          </Text>
          <Text style={styles.orderCode}>
            {t('order.pickupCode')}: {order.pickup_code}
          </Text>
          <Text style={styles.orderAmount}>{formatThb(order.amount_thb)}</Text>

          <TouchableOpacity
            style={[styles.collectBtn, isCollecting && styles.btnDisabled]}
            onPress={() => void confirmCollect()}
            disabled={isCollecting}
            accessibilityRole="button"
          >
            {isCollecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.collectBtnText}>{t('merchant.confirmCollect')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => router.back()}
        accessibilityRole="button"
      >
        <Text style={styles.cancelText}>{t('common.cancel')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#f9fafb', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  codeInput: { flex: 1, fontWeight: '700', letterSpacing: 2 },
  searchBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnText: { color: '#fff', fontWeight: '700' },
  error: { color: '#dc2626', marginBottom: 16 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  orderTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  orderDetail: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  orderCode: { fontSize: 16, fontWeight: '700', color: '#16a34a', marginTop: 12, letterSpacing: 2 },
  orderAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 8,
    marginBottom: 16,
  },
  collectBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  collectBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: '#6b7280', fontWeight: '600' },
});
