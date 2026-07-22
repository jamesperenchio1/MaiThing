import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../src/lib/supabase';
import { formatThb } from '@maithing/shared';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/ui';
import type { Tables } from '@maithing/shared';

type OrderStatus = Tables<'orders'>['status'];

type OrderRow = {
  id: string;
  status: OrderStatus;
  amount_thb: number;
  pickup_code: string;
  created_at: string;
  listing: { title: string } | null;
  location: { name: string } | null;
  pickup_slot: { starts_at: string; ends_at: string } | null;
};

function useOrders() {
  return useQuery<OrderRow[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id, status, amount_thb, pickup_code, created_at,
          listing:listings(title),
          location:locations(name),
          pickup_slot:pickup_slots(starts_at, ends_at)
        `,
        )
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

const STATUS_COLOR: Record<string, string> = {
  reserved: '#f59e0b',
  paid: '#16a34a',
  collected: '#6b7280',
  cancelled: '#dc2626',
  refunded: '#8b5cf6',
  no_show: '#dc2626',
};

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { data: orders = [], isLoading, error, refetch } = useOrders();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        title={t('common.error')}
        description={error.message}
        onRetry={() => void refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  if (orders.length === 0) {
    return <EmptyState title={t('order.noOrders')} icon="bag-outline" />;
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={orders}

        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} t={t} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function OrderCard({ order, t }: { order: OrderRow; t: (key: string) => string }) {
  const statusColor = STATUS_COLOR[order.status] ?? '#9ca3af';
  const isActive = order.status === 'reserved' || order.status === 'paid';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(buyer)/order/${order.id}`)}
      accessibilityRole="button"
    >
      <View style={styles.cardTop}>
        <Text style={styles.listingTitle} numberOfLines={1}>
          {order.listing?.title ?? '—'}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColor + '20', borderColor: statusColor },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {t(`order.status.${order.status}`)}
          </Text>
        </View>
      </View>
      <Text style={styles.locationName}>{order.location?.name ?? '—'}</Text>
      {order.pickup_slot && (
        <Text style={styles.slotText}>
          {new Date(order.pickup_slot.starts_at).toLocaleString('th-TH', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
      <View style={styles.cardBottom}>
        <Text style={styles.amount}>{formatThb(order.amount_thb)}</Text>
        {isActive && (
          <Text style={styles.codeLabel}>
            {t('order.pickupCode')}: <Text style={styles.code}>{order.pickup_code}</Text>
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  listingTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  locationName: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  slotText: { fontSize: 12, color: '#9ca3af', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
  codeLabel: { fontSize: 13, color: '#6b7280' },
  code: { fontWeight: '700', color: '#111827', letterSpacing: 2 },
});
