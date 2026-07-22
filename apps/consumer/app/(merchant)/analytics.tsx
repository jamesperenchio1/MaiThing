import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, LoadingState } from '../../src/components/ui';
import { useMerchantOrg } from '../../src/hooks/useProfile';
import { useMerchantOrders } from '../../src/hooks/useMerchant';
import { formatThb } from '@maithing/shared';

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const { locations, isLoading: orgLoading } = useMerchantOrg();
  const locationIds = locations.map((l) => l.id);
  const { data: orders = [], isLoading: ordersLoading } = useMerchantOrders(locationIds);

  const collectedOrders = orders.filter((o) => o.status === 'collected');
  const totalSales = collectedOrders.reduce((sum, o) => sum + o.amount_thb, 0);
  const mealsSaved = collectedOrders.reduce((sum, o) => sum + o.qty, 0);
  const avgRating =
    locations.length > 0
      ? locations.reduce((sum, l) => sum + l.rating_avg, 0) / locations.length
      : 0;
  const recentOrders = orders.slice(0, 5);

  if (orgLoading || ordersLoading) {
    return <LoadingState />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('merchant.analytics')}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatThb(totalSales)}</Text>
          <Text style={styles.statLabel}>{t('merchant.totalSales')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{mealsSaved}</Text>
          <Text style={styles.statLabel}>{t('merchant.mealsSaved')}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.statValue}>{avgRating.toFixed(1)}</Text>
            <Icon name="star" size={16} color="#f59e0b" />
          </View>
          <Text style={styles.statLabel}>{t('merchant.ratingAverage')}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('merchant.recentOrders')}</Text>
      {recentOrders.length === 0 ? (
        <Text style={styles.empty}>{t('merchant.noOrdersYet')}</Text>
      ) : (
        recentOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderRow}>
              <Text style={styles.orderListing}>{order.listing?.title ?? '—'}</Text>
              <Text style={styles.orderAmount}>{formatThb(order.amount_thb)}</Text>
            </View>
            <Text style={styles.orderMeta}>
              {order.buyer?.display_name ?? t('merchant.anonymousBuyer')}
            </Text>
            <Text style={styles.orderStatus}>{t(`order.status.${order.status}`)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#f9fafb', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    width: '30%',
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#16a34a', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  empty: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic' },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderListing: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  orderAmount: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
  orderMeta: { fontSize: 13, color: '#6b7280' },
  orderStatus: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
