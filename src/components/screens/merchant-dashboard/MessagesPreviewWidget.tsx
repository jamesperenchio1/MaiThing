import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MessageSquare } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatRelativeTime } from '@/src/lib/utils';
import type { MerchantMessage } from '@/src/types';

export function MessagesPreviewWidget({
  conversations,
  onSeeAll,
  onConversationPress,
}: {
  conversations: MerchantMessage[];
  onSeeAll: () => void;
  onConversationPress: (conversation: MerchantMessage) => void;
}) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();

  if (conversations.length === 0) return null;

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <MessageSquare size={16} color={colors.primary} />
          <Text variant="body-sm" className="ml-2 font-semibold text-muted">
            Unread Messages
          </Text>
        </View>
        <PressableScale
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSeeAll();
          }}
          scale={0.95}
        >
          <Text variant="caption" className="text-primary">
            {t('common.seeAll')}
          </Text>
        </PressableScale>
      </View>
      {conversations.map((conversation) => (
        <PressableScale
          key={conversation.customerId}
          scale={0.98}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onConversationPress(conversation);
          }}
        >
          <Card variant="outlined" className="mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text variant="body-sm" className="font-semibold">
                  {conversation.customerName}
                </Text>
                <Text variant="caption" className="text-muted mt-0.5" numberOfLines={1}>
                  {conversation.content}
                </Text>
              </View>
              <View className="items-end">
                <Text variant="caption" className="text-muted mb-1">
                  {formatRelativeTime(conversation.createdAt, i18n.language)}
                </Text>
                <Text variant="caption" className="text-primary font-semibold">
                  Tap to reply
                </Text>
              </View>
            </View>
          </Card>
        </PressableScale>
      ))}
    </View>
  );
}
