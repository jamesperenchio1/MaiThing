import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../src/stores/auth';
import { useChatMessages, useSendMessage } from '../../../src/hooks/useChat';
import {
  Screen,
  Input,
  Icon,
  EmptyState,
  LoadingState,
  ErrorState,
} from '../../../src/components/ui';
import { useTheme } from '../../../src/theme';
import { icons } from '../../../src/icons';

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing, fontSizes, fontWeights } = theme;
  const user = useAuthStore((s) => s.user);
  const { data: messages = [], isLoading, error, refetch } = useChatMessages(threadId);
  const send = useSendMessage(threadId);
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = useCallback(() => {
    if (!text.trim() || send.isPending) return;
    send.mutate(text, {
      onSuccess: () => setText(''),
    });
  }, [text, send]);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
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

      {/* Messages */}
      {messages.length === 0 ? (
        <EmptyState title={t('chat.noMessages')} icon={icons.chat} />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => {
            const isOwn = m.sender_id === user?.id;
            return (
              <View
                key={m.id}
                style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
              >
                <Text style={isOwn ? styles.bodyOwn : styles.bodyOther}>{m.body}</Text>
                <Text style={isOwn ? styles.timeOwn : styles.timeOther}>
                  {formatMessageTime(m.created_at)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Composer */}
      <View style={styles.composer}>
        <Input
          value={text}
          onChangeText={setText}
          placeholder={t('chat.messagePlaceholder')}
          multiline
          maxLength={1000}
          accessibilityLabel={t('chat.messagePlaceholder')}
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || send.isPending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || send.isPending}
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
        >
          <Icon name={icons.send} size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
      backgroundColor: colors.background,
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
    messages: {
      flex: 1,
    },
    messagesContent: {
      padding: spacing[4],
      paddingBottom: spacing[6],
    },
    bubble: {
      maxWidth: '80%',
      borderRadius: 16,
      padding: spacing[3],
      marginBottom: spacing[3],
    },
    bubbleOwn: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    bubbleOther: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceElevated,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bodyOwn: {
      color: colors.textInverse,
      fontSize: fontSizes.md,
      lineHeight: 20,
    },
    bodyOther: {
      color: colors.text,
      fontSize: fontSizes.md,
      lineHeight: 20,
    },
    timeOwn: {
      color: colors.primaryMuted,
      fontSize: fontSizes.xs,
      marginTop: spacing[1],
      alignSelf: 'flex-end',
    },
    timeOther: {
      color: colors.textMuted,
      fontSize: fontSizes.xs,
      marginTop: spacing[1],
      alignSelf: 'flex-end',
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: spacing[3],
      paddingBottom: spacing[6],
      backgroundColor: colors.surfaceElevated,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing[2],
    },
    input: {
      flex: 1,
      maxHeight: 100,
    },
    sendBtn: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing[1],
    },
    sendBtnDisabled: {
      opacity: 0.5,
    },
  });
}
