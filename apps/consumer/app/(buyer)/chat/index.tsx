import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useChatThreads } from '../../../src/hooks/useChat';
import { Screen, Icon, EmptyState, LoadingState, ErrorState } from '../../../src/components/ui';
import { useTheme } from '../../../src/theme';
import { icons } from '../../../src/icons';

function formatShortTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing, fontSizes, fontWeights } = theme;
  const { data: threads = [], isLoading, error, refetch } = useChatThreads();

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title={t('common.error')}
          description={error.message}
          onRetry={() => void refetch()}
          retryLabel={t('common.retry')}
        />
      </Screen>
    );
  }

  if (threads.length === 0) {
    return (
      <Screen>
        <EmptyState
          title={t('chat.empty')}
          icon={icons.chat}
          action={{
            label: t('common.back'),
            onPress: () => router.back(),
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Icon name={icons.back} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('chat.title')}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {threads.map((thread) => (
          <TouchableOpacity
            key={thread.id}
            style={styles.row}
            onPress={() => router.push(`/(buyer)/chat/${thread.id}`)}
            accessibilityRole="button"
            accessibilityLabel={t('chat.backToChat')}
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
    </Screen>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 56,
      paddingHorizontal: spacing[4],
      paddingBottom: spacing[3],
      backgroundColor: colors.surfaceElevated,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      padding: spacing[2],
      marginLeft: -spacing[2],
    },
    title: {
      flex: 1,
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.bold,
      color: colors.text,
      textAlign: 'center',
    },
    spacer: {
      width: 30,
    },
    list: {
      padding: spacing[4],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      borderRadius: 12,
      padding: spacing[4],
      marginBottom: spacing[3],
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    rowContent: {
      flex: 1,
      marginRight: spacing[3],
    },
    locationName: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[1],
    },
    preview: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
    },
    rowMeta: {
      alignItems: 'flex-end',
    },
    time: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      marginBottom: spacing[1],
    },
    badge: {
      backgroundColor: colors.danger,
      borderRadius: 10,
      minWidth: 20,
      paddingHorizontal: spacing[2],
      paddingVertical: 2,
      alignItems: 'center',
    },
    badgeText: {
      color: colors.textInverse,
      fontSize: fontSizes.xs,
      fontWeight: '700',
    },
  });
}
