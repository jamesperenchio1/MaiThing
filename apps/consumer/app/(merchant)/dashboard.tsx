import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMerchantOrg } from '../../src/hooks/useProfile';
import { useMerchantListings, useMerchantOrders } from '../../src/hooks/useMerchant';
import { Icon, LoadingState } from '../../src/components/ui';
import type { IconName } from '../../src/components/ui';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function MerchantDashboardScreen() {
  const { t } = useTranslation();
  const { org, locations, isLoading: orgLoading } = useMerchantOrg();
  const locationIds = locations.map((l) => l.id);
  const { data: listings = [], isLoading: listingsLoading } = useMerchantListings(locationIds);
  const { data: orders = [], isLoading: ordersLoading } = useMerchantOrders(locationIds);

  const activeListings = listings.filter((l) => l.status === 'active').length;
  const todayReservations = orders.filter(
    (o) =>
      isToday(o.pickup_slot?.starts_at ?? o.created_at) && ['reserved', 'paid'].includes(o.status),
  ).length;

  if (orgLoading || listingsLoading || ordersLoading) {
    return <LoadingState />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>{t('merchant.welcome')}</Text>
      <Text style={styles.orgName}>{org?.name ?? '—'}</Text>
      <Text style={styles.orgStatus}>
        {org?.verified_at ? t('merchant.verified') : t('merchant.pendingVerification')}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeListings}</Text>
          <Text style={styles.statLabel}>{t('merchant.activeListings')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayReservations}</Text>
          <Text style={styles.statLabel}>{t('merchant.todayReservations')}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('merchant.quickActions')}</Text>
      <View style={styles.actionsGrid}>
        <ActionTile
          icon="restaurant-outline"
          label={t('merchant.publishListing')}
          onPress={() => router.push('/(merchant)/listings/new')}
        />
        <ActionTile
          icon="calendar-outline"
          label={t('merchant.todayView')}
          onPress={() => router.push('/(merchant)/today')}
        />
        <ActionTile
          icon="location-outline"
          label={t('merchant.addLocation')}
          onPress={() => router.push('/(merchant)/locations/new')}
        />
        <ActionTile
          icon="bar-chart-outline"
          label={t('merchant.analytics')}
          onPress={() => router.push('/(merchant)/analytics')}
        />
      </View>
    </ScrollView>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionTile} onPress={onPress} accessibilityRole="button">
      <Icon name={icon} size={28} color="#16a34a" style={{ marginBottom: 8 }} />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#f9fafb', flexGrow: 1 },
  greeting: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  orgName: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6 },
  orgStatus: { fontSize: 13, color: '#16a34a', marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#16a34a', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#6b7280' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionTile: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'center' },
});
