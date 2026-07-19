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

export default function LocationsScreen() {
  const { t } = useTranslation();
  const { locations, isLoading } = useMerchantOrg();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('merchant.locations')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(merchant)/locations/new')}
          accessibilityRole="button"
        >
          <Text style={styles.addBtnText}>+ {t('merchant.addLocation')}</Text>
        </TouchableOpacity>
      </View>

      {locations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('merchant.noLocations')}</Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/(merchant)/locations/new')}
          >
            <Text style={styles.ctaText}>{t('merchant.addFirstLocation')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        locations.map((location) => (
          <View key={location.id} style={styles.card}>
            <Text style={styles.cardName}>{location.name}</Text>
            <Text style={styles.cardAddress}>{location.address_text}</Text>
            <Text style={styles.cardStatus}>{t(`merchant.status.${location.status}`)}</Text>
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
  cardName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardAddress: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  cardStatus: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
});
