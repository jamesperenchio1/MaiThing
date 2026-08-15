import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Megaphone, Users, CheckCircle2, Clock } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantByOwner } from '@/src/hooks/useMerchants';
import { useRecentBroadcasts, useSendBroadcast } from '@/src/hooks/useBroadcast';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { BroadcastMessage } from '@/src/types';

const MAX_CHARS = 160;

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function BroadcastHistoryRow({ broadcast }: { broadcast: BroadcastMessage }) {
  const colors = useThemeColor();
  return (
    <Card variant="outlined" className="mb-3">
      <View className="flex-row items-start justify-between mb-1">
        <View className="flex-row items-center">
          <Clock size={12} color={colors.muted} />
          <Text variant="caption" className="ml-1 text-muted">
            {formatTimeAgo(broadcast.sentAt)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Users size={12} color={colors.primary} />
          <Text variant="caption" className="ml-1 text-primary font-semibold">
            {broadcast.recipientCount} recipients
          </Text>
        </View>
      </View>
      <Text variant="body-sm" className="text-foreground">
        {broadcast.content}
      </Text>
    </Card>
  );
}

export default function BroadcastScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);

  const [content, setContent] = useState('');
  const [successBroadcast, setSuccessBroadcast] = useState<BroadcastMessage | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const { data: merchant } = useMerchantByOwner(user?.id ?? '');
  const merchantId = merchant?.id ?? '';

  const { data: recentBroadcasts } = useRecentBroadcasts(merchantId);
  const sendBroadcast = useSendBroadcast(merchantId);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isEmpty = charCount === 0;

  // Determine rate limit from most recent broadcast in the last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const lastBroadcast = recentBroadcasts?.[0];
  const isRateLimited =
    !!lastBroadcast && new Date(lastBroadcast.sentAt) > oneDayAgo && !successBroadcast;

  const canSend = !isEmpty && !isOverLimit && !isRateLimited && !sendBroadcast.isPending;

  const handleSend = () => {
    if (!canSend) return;
    setRateLimitError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendBroadcast.mutate(content, {
      onSuccess: (broadcast) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessBroadcast(broadcast);
        setContent('');
      },
      onError: (err) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const message = err instanceof Error ? err.message : 'Failed to send broadcast';
        if (message.toLowerCase().includes('rate limit')) {
          setRateLimitError('You can only send one broadcast per day. Try again tomorrow.');
        } else {
          setRateLimitError(message);
        }
      },
    });
  };

  const handleDismissSuccess = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSuccessBroadcast(null);
    router.back();
  };

  return (
    <Screen scrollable className="bg-background">
      <Header title="Broadcast to Followers" showBack />

      <View className="px-6 pt-4 pb-8">
        {/* Success card */}
        {successBroadcast && (
          <Card variant="elevated" className="mb-6 border border-green-500/30 bg-green-500/5">
            <View className="items-center py-2">
              <CheckCircle2 size={40} color={colors.success} />
              <Text variant="h3" className="mt-3 mb-1 text-center">
                Broadcast Sent!
              </Text>
              <Text variant="body-sm" className="text-center text-muted mb-4">
                Your message reached{' '}
                <Text variant="body-sm" className="font-semibold text-primary">
                  {successBroadcast.recipientCount} followers
                </Text>{' '}
                and recent buyers.
              </Text>
              <Button variant="primary" onPress={handleDismissSuccess} className="w-full">
                Done
              </Button>
            </View>
          </Card>
        )}

        {/* Compose section — hidden after success */}
        {!successBroadcast && (
          <>
            {/* Rate limit warning */}
            {isRateLimited && (
              <Card variant="outlined" className="mb-4 border-amber-500/40 bg-amber-500/5">
                <View className="flex-row items-start">
                  <Clock size={16} color={colors.warning} />
                  <View className="flex-1 ml-2">
                    <Text
                      variant="body-sm"
                      className="font-semibold"
                      style={{ color: colors.warning }}
                    >
                      Daily limit reached
                    </Text>
                    <Text variant="caption" className="mt-0.5 text-muted">
                      You already sent a broadcast today. You can send your next one in 24 hours.
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Inline error (non-rate-limit errors from mutation) */}
            {rateLimitError && !isRateLimited && (
              <Card variant="outlined" className="mb-4 border-danger/40 bg-danger/5">
                <Text variant="caption" className="text-danger">
                  {rateLimitError}
                </Text>
              </Card>
            )}

            {/* Audience preview */}
            <Card variant="elevated" className="mb-6">
              <View className="flex-row items-center">
                <View className="mr-3 rounded-xl bg-primary/10 p-2.5">
                  <Megaphone size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text variant="body-sm" className="font-semibold">
                    {merchant?.followers ?? 0} followers
                  </Text>
                  <Text variant="caption" className="text-muted">
                    + recent buyers will receive this
                  </Text>
                </View>
              </View>
            </Card>

            {/* Message input */}
            <Input
              label="Your message"
              placeholder={t('merchant.broadcast.messagePlaceholder')}
              multiline
              numberOfLines={5}
              value={content}
              onChangeText={setContent}
              maxLength={MAX_CHARS}
              showCharacterCount
              inputClassName="min-h-[120px] text-base leading-6"
              containerClassName="mb-2"
            />

            {/* Character counter (manual, prominent) */}
            <View className="mb-6 flex-row justify-end">
              <Text
                variant="caption"
                className={
                  isOverLimit
                    ? 'text-danger font-semibold'
                    : charCount >= 120
                      ? 'text-amber-500'
                      : 'text-muted'
                }
              >
                {charCount}/{MAX_CHARS}
              </Text>
            </View>

            <Button variant="primary" onPress={handleSend} disabled={!canSend} className="mb-3">
              {sendBroadcast.isPending ? 'Sending…' : 'Send Broadcast'}
            </Button>

            <Text variant="caption" className="text-center text-muted mb-8">
              Broadcasts are limited to once per day.
            </Text>
          </>
        )}

        {/* Recent broadcasts */}
        {(recentBroadcasts ?? []).length > 0 && (
          <View className="mt-2">
            <View className="mb-3 flex-row items-center">
              <Users size={14} color={colors.muted} />
              <Text variant="body-sm" className="ml-2 font-semibold text-muted">
                Recent broadcasts
              </Text>
            </View>
            {(recentBroadcasts ?? []).slice(0, 3).map((b) => (
              <BroadcastHistoryRow key={b.id} broadcast={b} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
