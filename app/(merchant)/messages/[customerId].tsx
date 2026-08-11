import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, TextInput } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useAuthStore } from '@/src/stores/auth';
import { useMessages, useSendMessage, useMarkConversationAsRead } from '@/src/hooks/useMessages';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatRelativeTime } from '@/src/lib/utils';
import type { MerchantMessage } from '@/src/types';

function MessageBubble({ message, isMerchant }: { message: MerchantMessage; isMerchant: boolean }) {
  const { i18n } = useTranslation();
  return (
    <View className={`mb-3 max-w-[80%] ${isMerchant ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-4 py-2.5 ${
          isMerchant ? 'rounded-tr-sm bg-primary' : 'rounded-tl-sm bg-muted/10'
        }`}
      >
        <Text className={isMerchant ? 'text-white' : 'text-foreground'}>{message.content}</Text>
      </View>
      <Text
        variant="caption"
        className={`mt-1 text-muted ${isMerchant ? 'text-right' : 'text-left'}`}
      >
        {formatRelativeTime(message.createdAt, i18n.language)}
      </Text>
    </View>
  );
}

export default function MerchantMessageThreadScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const merchantId = user?.id ?? '';
  const colors = useThemeColor();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlashListRef<MerchantMessage>>(null);

  const { data: messages, isLoading, isError, refetch } = useMessages(merchantId, customerId);
  const sendMessage = useSendMessage(merchantId, customerId);
  const markAsRead = useMarkConversationAsRead(merchantId);

  useEffect(() => {
    if (customerId) {
      markAsRead.mutate(customerId);
    }
  }, [customerId]);

  const customerName = messages?.[0]?.customerName ?? t('merchant.messages.title');
  const customerAvatarUrl = messages?.[0]?.customerAvatarUrl;
  const orderId = messages?.[0]?.orderId;

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || sendMessage.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage.mutate(content, {
      onSuccess: () => setInput(''),
    });
  }, [input, sendMessage]);

  return (
    <Screen
      testID="merchant-message-thread-screen"
      scrollable={false}
      className="bg-background"
      keyboardAvoiding
    >
      <Header
        title={customerName}
        right={<Avatar uri={customerAvatarUrl} name={customerName} size="sm" />}
      />

      <View className="flex-1 px-4">
        {orderId && (
          <Card variant="outlined" className="my-3 self-center">
            <Text variant="caption" className="text-primary">
              {t('merchant.messages.orderRef', { code: orderId })}
            </Text>
          </Card>
        )}

        {isError && (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load this conversation."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        )}

        <FlashList
          ref={flatListRef}
          data={messages ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          estimatedItemSize={60}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMerchant={item.sentBy === 'merchant'} />
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View className="flex-1 items-center justify-center">
                <Text variant="body" className="text-muted">
                  {t('merchant.messages.noMessages')}
                </Text>
              </View>
            ) : null
          }
        />

        <View className="flex-row items-center border-t border-border bg-background py-3">
          <TextInput
            testID="message-input"
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
            testID="send-message-button"
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
