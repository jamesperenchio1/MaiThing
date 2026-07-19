import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../src/stores/auth';
import { useChatMessages, useSendMessage } from '../../../src/hooks/useChat';

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: messages = [], isLoading, error } = useChatMessages(threadId);
  const send = useSendMessage(threadId);
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = useCallback(() => {
    if (!text.trim() || send.isPending) return;
    send.mutate(text, {
      onSuccess: () => setText(''),
    });
  }, [text, send]);

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
        >
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('chat.title')}</Text>
        <View style={styles.spacer} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>{t('chat.noMessages')}</Text>
        ) : (
          messages.map((m) => {
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
          })
        )}
      </ScrollView>

      {/* Composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={t('chat.messagePlaceholder')}
          multiline
          maxLength={1000}
          accessibilityLabel={t('chat.messagePlaceholder')}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || send.isPending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || send.isPending}
          accessibilityRole="button"
        >
          <Text style={styles.sendBtnText}>{t('chat.send')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 24 },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 24 },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#16a34a',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  bodyOwn: { color: '#fff', fontSize: 15, lineHeight: 20 },
  bodyOther: { color: '#111827', fontSize: 15, lineHeight: 20 },
  timeOwn: { color: '#dcfce7', fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  timeOther: { color: '#9ca3af', fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 10,
  },
  sendBtnDisabled: { backgroundColor: '#d1d5db' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
