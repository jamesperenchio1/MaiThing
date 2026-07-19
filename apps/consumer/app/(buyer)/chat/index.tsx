import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useChatThreads } from '../../../src/hooks/useChat';

function formatShortTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatListScreen() {
  const { t } = useTranslation();
  const { data: threads = [], isLoading, error } = useChatThreads();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('chat.title')}</Text>
        <View style={styles.spacer} />
      </View>

      {threads.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('chat.empty')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {threads.map((thread) => (
            <TouchableOpacity
              key={thread.id}
              style={styles.row}
              onPress={() => router.push(`/(buyer)/chat/${thread.id}`)}
              accessibilityRole="button"
            >
              <View style={styles.rowContent}>
                <Text style={styles.locationName} numberOfLines={1}>
                  {thread.location_name}
                </Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {thread.last_message?.body ?? t('chat.noMessages')}
                </Text>
              </View>
              <View style={styles.rowMeta}>
                <Text style={styles.time}>{formatShortTime(thread.last_message_at)}</Text>
                {thread.unread_count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{thread.unread_count}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 16, color: '#6b7280' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backText: { fontSize: 22, color: '#374151' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
  spacer: { width: 30 },
  list: { padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
  rowContent: { flex: 1, marginRight: 12 },
  locationName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  preview: { fontSize: 14, color: '#6b7280' },
  rowMeta: { alignItems: 'flex-end' },
  time: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
