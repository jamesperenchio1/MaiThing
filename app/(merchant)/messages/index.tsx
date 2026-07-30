import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { MessageSquare } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Avatar } from '@/src/components/ui/Avatar';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useConversations } from '@/src/hooks/useMessages';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatRelativeTime } from '@/src/lib/utils';

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View className="h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5">
      <Text className="text-[10px] font-semibold text-white">{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

export default function MerchantMessagesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { data, isLoading, isError, refetch } = useConversations(user?.id ?? '');

  return (
    <Screen testID="merchant-messages-screen" scrollable className="bg-background">
      <Header title={t('merchant.messages.title')} />
      <View className="px-6 py-4">
        {isError && (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your messages."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        )}

        {!isLoading && !isError && data?.length === 0 && (
          <EmptyState
            icon={<MessageSquare size={32} color={colors.muted} />}
            title={t('merchant.messages.noMessages')}
          />
        )}

        {data?.map((conversation) => {
          const unreadCount = conversation.read || conversation.sentBy === 'merchant' ? 0 : 1;
          return (
            <PressableScale
              key={conversation.customerId}
              testID={`conversation-${conversation.customerId}`}
              scale={0.98}
              onPress={() =>
                router.push({
                  pathname: '/(merchant)/messages/[customerId]',
                  params: { customerId: conversation.customerId },
                } as any)
              }
            >
              <Card variant="outlined" className="mb-3 flex-row items-center">
                <Avatar
                  uri={conversation.customerAvatarUrl}
                  name={conversation.customerName}
                  size="md"
                />
                <View className="ml-3 flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text variant="body" className="font-semibold">
                      {conversation.customerName}
                    </Text>
                    <Text variant="caption" className="text-muted">
                      {formatRelativeTime(conversation.createdAt)}
                    </Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text variant="body-sm" className="flex-1 text-muted" numberOfLines={1}>
                      {conversation.content}
                    </Text>
                    <UnreadBadge count={unreadCount} />
                  </View>
                  {conversation.orderId && (
                    <Text variant="caption" className="mt-1 text-primary">
                      {t('merchant.messages.orderRef', { code: conversation.orderId })}
                    </Text>
                  )}
                </View>
              </Card>
            </PressableScale>
          );
        })}
      </View>
    </Screen>
  );
}
