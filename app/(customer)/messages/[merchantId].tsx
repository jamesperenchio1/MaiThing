import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, TextInput, FlatList } from 'react-native';
import { Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useAuthStore } from '@/src/stores/auth';
import { useMessages, useSendMessageAsCustomer } from '@/src/hooks/useMessages';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatRelativeTime } from '@/src/lib/utils';
import type { MerchantMessage } from '@/src/types';

function MessageBubble({
  message,
  isCustomer,
}: {
  message: MerchantMessage;
  isCustomer: boolean;
}) {
  return (
    <View className={`mb-3 max-w-[80%] ${isCustomer ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-4 py-2.5 ${
          isCustomer ? 'rounded-tr-sm bg-primary' : 'rounded-tl-sm bg-muted/10'
        }`}
      >
        <Text className={isCustomer ? 'text-white' : 'text-foreground'}>{message.content}</Text>
      </View>
      <Text
        variant="caption"
        className={`mt-1 text-muted ${isCustomer ? 'text-right' : 'text-left'}`}
      >
        {formatRelativeTime(message.createdAt)}
      </Text>
    </View>
  );
}

export default function CustomerMessageThreadScreen() {
  const { merchantId } = useLocalSearchParams<{ merchantId: string }>();
  const user = useAuthStore((s) => s.user);
  const customerId = user?.id ?? '';
  const colors = useThemeColor();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: messages, isLoading, isError, refetch } = useMessages(merchantId, customerId);
  const sendMessage = useSendMessageAsCustomer(merchantId, customerId);

  const merchantName = messages?.[0]?.merchantId ? 'Merchant' : 'Merchant';
  const orderId = messages?.[0]?.orderId;

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || sendMessage.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage.mutate(content, {
      onSuccess: () => setInput(''),
    });
  }, [input, sendMessage]);

  // useEffect to scroll to end when messages load
  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages?.length]);

  return (
    <Screen scrollable={false} className="bg-background" keyboardAvoiding>
      <Header title={merchantName} />

      <View className="flex-1 px-4">
        {orderId && (
          <Card variant="outlined" className="my-3 self-center">
            <Text variant="caption" className="text-primary">
              Order ref: {orderId}
            </Text>
          </Card>
        )}

        {isError && (
          <ErrorState
            title="Error"
            message="We couldn't load this conversation."
            onRetry={refetch}
            retryLabel="Retry"
          />
        )}

        <FlatList
          ref={flatListRef}
          data={messages ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <MessageBubble message={item} isCustomer={item.sentBy === 'customer'} />
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View className="flex-1 items-center justify-center">
                <Text variant="body" className="text-muted">
                  No messages yet. Say hello!
                </Text>
              </View>
            ) : null
          }
        />

        <View className="flex-row items-center border-t border-border bg-background py-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            className="mr-3 max-h-24 flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-foreground"
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <Button
            size="icon"
            onPress={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
          >
            <Send size={20} color={colors.white} />
          </Button>
        </View>
      </View>
    </Screen>
  );
}
