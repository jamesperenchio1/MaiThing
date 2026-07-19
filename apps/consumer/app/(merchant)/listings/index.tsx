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
import { useMerchantOrg } from '../../../src/hooks/useProfile';
import { useMerchantListings } from '../../../src/hooks/useMerchant';
import { formatThb } from '@maithing/shared';

export default function ListingsScreen() {
  const { t } = useTranslation();
  const { locations, isLoading: orgLoading } = useMerchantOrg();
  const locationIds = locations.map((l) => l.id);
  const { data: listings = [], isLoading: listingsLoading } = useMerchantListings(locationIds);

  if (orgLoading || listingsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('merchant.listings')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(merchant)/listings/new')}
          accessibilityRole="button"
        >
          <Text style={styles.addBtnText}>+ {t('merchant.publish')}</Text>
        </TouchableOpacity>
      </View>

      {listings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('merchant.noListings')}</Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/(merchant)/listings/new')}
          >
            <Text style={styles.ctaText}>{t('merchant.publishFirstListing')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        listings.map((listing) => (
          <View key={listing.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{listing.title}</Text>
              <View style={[styles.badge, listing.status === 'active' && styles.badgeActive]}>
                <Text style={styles.badgeText}>{t(`merchant.status.${listing.status}`)}</Text>
              </View>
            </View>
            <Text style={styles.cardType}>{t(`listing.${listing.fulfillment_type}`)}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.cardPrice}>{formatThb(listing.price_thb)}</Text>
              <Text style={styles.cardRemaining}>
                {t('listing.remaining', { count: listing.qty_remaining })}
              </Text>
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
  addBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  ctaBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ctaText: { color: '#fff', fontWeight: '700' },
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
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#e5e7eb' },
  badgeActive: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  cardType: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
  cardRemaining: { fontSize: 13, color: '#6b7280' },
});
