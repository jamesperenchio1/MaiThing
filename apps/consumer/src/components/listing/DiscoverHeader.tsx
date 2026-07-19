import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface Props {
  viewMode: 'map' | 'list';
  onToggleView: (mode: 'map' | 'list') => void;
  isLoading: boolean;
  hasUnread?: boolean;
}

export default function DiscoverHeader({
  viewMode,
  onToggleView,
  isLoading,
  hasUnread = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{t('discover.title')}</Text>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'map' && styles.toggleActive]}
          onPress={() => onToggleView('map')}
          accessibilityRole="button"
          accessibilityLabel={t('discover.mapView')}
          accessibilityState={{ selected: viewMode === 'map' }}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
            {t('discover.mapView')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]}
          onPress={() => onToggleView('list')}
          accessibilityRole="button"
          accessibilityLabel={t('discover.listView')}
          accessibilityState={{ selected: viewMode === 'list' }}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            {t('discover.listView')}
          </Text>
        </TouchableOpacity>
      </View>
      {isLoading && <ActivityIndicator size="small" color="#16a34a" style={styles.spinner} />}
      <TouchableOpacity
        style={styles.bellBtn}
        onPress={() => router.push('/(buyer)/chat')}
        accessibilityRole="button"
        accessibilityLabel={t('chat.title')}
      >
        <Text style={styles.bellIcon}>🔔</Text>
        {hasUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  toggleTextActive: { color: '#111827', fontWeight: '600' },
  spinner: { marginLeft: 8 },
  bellBtn: { marginLeft: 8, padding: 4, position: 'relative' },
  bellIcon: { fontSize: 20 },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
});
