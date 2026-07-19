import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { supabase } from '../../src/lib/supabase';

export default function MerchantSettingsScreen() {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.replace('/(auth)/sign-in');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('merchant.settings')}</Text>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push('/(merchant)/analytics')}
        accessibilityRole="button"
      >
        <Text style={styles.rowText}>{t('merchant.analytics')}</Text>
        <Text style={styles.rowArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push('/(merchant)/collect')}
        accessibilityRole="button"
      >
        <Text style={styles.rowText}>{t('merchant.confirmPickup')}</Text>
        <Text style={styles.rowArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.row, styles.signOutRow]}
        onPress={() => void signOut()}
        accessibilityRole="button"
      >
        <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#f9fafb', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rowText: { fontSize: 15, color: '#111827' },
  rowArrow: { fontSize: 20, color: '#9ca3af' },
  signOutRow: { justifyContent: 'center', marginTop: 12 },
  signOutText: { color: '#dc2626', fontWeight: '600', fontSize: 15 },
});
