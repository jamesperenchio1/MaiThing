import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useMerchantOrg } from '../../src/hooks/useProfile';
import { useMerchantOrders, type OrderWithDetails } from '../../src/hooks/useMerchant';
import { collectOrder } from '../../src/lib/merchant';
import { formatThb } from '@maithing/shared';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function TodayScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { locations, isLoading: orgLoading } = useMerchantOrg();
  const locationIds = locations.map((l) => l.id);
  const { data: orders = [], isLoading: ordersLoading } = useMerchantOrders(locationIds);

  const todayOrders = orders.filter(
    (o) =>
      isToday(o.pickup_slot?.starts_at ?? o.created_at) && ['reserved', 'paid'].includes(o.status),
  );

  const markCollected = async (order: OrderWithDetails) => {
    await collectOrder(order.id, order.pickup_code);
    await queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
  };

  if (orgLoading || ordersLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('merchant.today')}</Text>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => router.push('/(merchant)/collect')}
          accessibilityRole="button"
        >
          <Text style={styles.scanBtnText}>{t('merchant.scanQr')}</Text>
        </TouchableOpacity>
      </View>

      {todayOrders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('merchant.noOrdersToday')}</Text>
        </View>
      ) : (
        todayOrders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.buyerName}>
                {order.buyer?.display_name ?? t('merchant.anonymousBuyer')}
              </Text>
              <Text style={styles.code}>{order.pickup_code}</Text>
            </View>
            <Text style={styles.listingTitle}>{order.listing?.title ?? '—'}</Text>
            {order.pickup_slot && (
              <Text style={styles.slotText}>
                {formatTime(order.pickup_slot.starts_at)} – {formatTime(order.pickup_slot.ends_at)}
              </Text>
            )}
            {order.items && order.items.length > 0 && (
              <View style={styles.items}>
                {order.items.map((item) => (
                  <Text key={item.id} style={styles.itemText}>
                    {item.qty}x {item.name_snapshot}
                  </Text>
                ))}
              </View>
            )}
            <View style={styles.cardBottom}>
              <Text style={styles.amount}>{formatThb(order.amount_thb)}</Text>
              <TouchableOpacity
                style={styles.collectBtn}
                onPress={() => void markCollected(order)}
                accessibilityRole="button"
              >
                <Text style={styles.collectBtnText}>{t('merchant.markCollected')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#f9fafb', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  scanBtn: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scanBtnText: { color: '#fff', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buyerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  code: { fontSize: 16, fontWeight: '700', color: '#16a34a', letterSpacing: 2 },
  listingTitle: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  slotText: { fontSize: 13, color: '#9ca3af', marginBottom: 8 },
  items: { marginBottom: 12, gap: 2 },
  itemText: { fontSize: 13, color: '#374151' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
  collectBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  collectBtnText: { color: '#fff', fontWeight: '600' },
});
