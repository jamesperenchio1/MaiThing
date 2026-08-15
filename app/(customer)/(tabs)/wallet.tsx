import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  View,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  X,
  Sparkles,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Screen } from '@/src/components/layout/Screen';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { FlashList } from '@shopify/flash-list';
import { useWallet, useWalletTransactions, useWalletRewards } from '@/src/hooks/useWallet';
import { useNetworkState } from '@/src/hooks/useNetworkState';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import { formatCurrency, formatCompactNumber } from '@/src/lib/utils';
import { getFontScale } from '@/src/lib/responsive';
import { repositories } from '@/src/repositories';
import type { WalletReward, WalletTransaction } from '@/src/types';

function TransactionItem({ transaction }: { transaction: WalletTransaction }) {
  const isIncoming =
    transaction.type === 'top_up' ||
    transaction.type === 'refund' ||
    transaction.type === 'top_up_bonus';
  const colors = useThemeColor();
  const router = useRouter();
  const { i18n } = useTranslation();

  const onPress = () => {
    if (transaction.orderId) {
      router.push(`/(customer)/order/${transaction.orderId}` as any);
    }
  };

  return (
    <Pressable onPress={onPress} disabled={!transaction.orderId}>
      <View className="flex-row items-center px-4 py-3.5">
        <View
          className={`mr-3.5 rounded-2xl p-2.5 ${isIncoming ? 'bg-primary/10' : 'bg-danger/10'}`}
        >
          {isIncoming ? (
            <ArrowDownRight size={18} color={colors.primary} />
          ) : (
            <ArrowUpRight size={18} color={colors.danger} />
          )}
        </View>
        <View className="flex-1 pr-2">
          <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text variant="caption" className="mt-0.5 text-muted">
            {new Date(transaction.createdAt).toLocaleDateString(i18n.language, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className={`text-base font-bold ${isIncoming ? 'text-primary' : 'text-danger'}`}>
            {isIncoming ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </Text>
          {transaction.orderId && (
            <ChevronRight size={16} color={colors.muted} style={{ marginLeft: 2 }} />
          )}
        </View>
      </View>
      <View className="ml-16 h-px bg-border/60" />
    </Pressable>
  );
}

const TOP_UP_AMOUNTS = [50, 100, 200, 500, 1000];

function TopUpModal({
  visible,
  onClose,
  isOffline,
}: {
  visible: boolean;
  onClose: () => void;
  isOffline: boolean;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const rawCustomAmount = customAmount.replace(/,/g, '');
  const customAmountValue = parseFloat(rawCustomAmount);
  const effectiveAmount = isCustom
    ? Number.isFinite(customAmountValue) && customAmountValue > 0
      ? customAmountValue
      : null
    : selected;

  const handleCustomAmountChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (!digits) {
      setCustomAmount('');
      return;
    }
    setCustomAmount(digits.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  };

  const handleTopUp = async () => {
    if (!effectiveAmount || !user) return;
    setLoading(true);
    try {
      await repositories.wallet.topUp(user.id, effectiveAmount);
      await repositories.wallet.addTopUpBonus(user.id, effectiveAmount);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-rewards', user.id] });
      onClose();
      setSelected(null);
      setIsCustom(false);
      setCustomAmount('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/40">
          <TouchableWithoutFeedback>
            <View className="rounded-t-3xl bg-background px-6 pb-10 pt-6">
              <View className="mb-6 flex-row items-center justify-between">
                <Text variant="h3">{t('customer.wallet.topUpTitle')}</Text>
                <PressableScale
                  onPress={onClose}
                  scale={0.9}
                  accessibilityLabel="Close"
                  hitSlop={8}
                >
                  <View className="rounded-full bg-muted/10 p-2">
                    <X size={20} color={colors.muted} />
                  </View>
                </PressableScale>
              </View>
              <Text variant="body-sm" className="mb-4 text-muted">
                {t('customer.wallet.topUpHint')}
              </Text>
              <View className="mb-3 flex-row flex-wrap gap-3">
                {TOP_UP_AMOUNTS.map((amount) => (
                  <PressableScale
                    key={amount}
                    onPress={() => {
                      setSelected(amount);
                      setIsCustom(false);
                      setCustomAmount('');
                    }}
                    className={`rounded-2xl border-2 px-5 py-3 ${!isCustom && selected === amount ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                    scale={0.96}
                  >
                    <Text
                      className={`font-semibold ${!isCustom && selected === amount ? 'text-primary' : 'text-foreground'}`}
                    >
                      {formatCurrency(amount)}
                    </Text>
                  </PressableScale>
                ))}
                <PressableScale
                  onPress={() => {
                    setIsCustom(true);
                    setSelected(null);
                  }}
                  className={`rounded-2xl border-2 px-5 py-3 ${isCustom ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                  scale={0.96}
                >
                  <Text
                    className={`font-semibold ${isCustom ? 'text-primary' : 'text-foreground'}`}
                  >
                    {t('customer.wallet.other')}
                  </Text>
                </PressableScale>
              </View>
              {isCustom && (
                <Input
                  containerClassName="mb-6"
                  placeholder={t('customer.wallet.enterAmount')}
                  keyboardType="number-pad"
                  value={customAmount}
                  onChangeText={handleCustomAmountChange}
                  autoFocus
                />
              )}
              {!isCustom && <View className="mb-6" />}
              {isOffline && (
                <View className="mb-4 flex-row items-center rounded-2xl bg-amber-500/10 px-4 py-3">
                  <AlertTriangle size={18} color={colors.warning} />
                  <Text
                    variant="body-sm"
                    className="ml-2 flex-1 text-amber-700 dark:text-amber-300"
                  >
                    {t('common.noConnection')}
                  </Text>
                </View>
              )}
              <Button
                fullWidth
                disabled={!effectiveAmount || loading || isOffline}
                loading={loading}
                onPress={handleTopUp}
              >
                {effectiveAmount
                  ? t('customer.wallet.addAmount', { amount: formatCurrency(effectiveAmount) })
                  : t('customer.wallet.selectAmount')}
              </Button>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function RewardStrip({ rewards }: { rewards?: WalletReward }) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();
  return (
    <View className="mx-4 mb-5 flex-row overflow-hidden rounded-2xl bg-card">
      <View className="flex-1 items-center py-4">
        <Sparkles size={16} color={colors.primary} />
        <Text className="mt-1 text-lg font-bold text-foreground">
          {formatCompactNumber(rewards?.points ?? 0, i18n.language)}
        </Text>
        <Text variant="caption" className="text-muted">
          {t('customer.wallet.points')}
        </Text>
      </View>
      <View className="flex-1 items-center py-4">
        <TrendingUp size={16} color={colors.primary} />
        <Text className="mt-1 text-lg font-bold text-primary">
          +{formatCurrency(rewards?.bonusBalance ?? 0)}
        </Text>
        <Text variant="caption" className="text-muted">
          {t('customer.wallet.bonusCredit')}
        </Text>
      </View>
      <View className="flex-1 items-center py-4">
        <WalletIcon size={16} color={colors.muted} />
        <Text className="mt-1 text-lg font-bold text-foreground">
          {formatCompactNumber(rewards?.lifetimePoints ?? 0, i18n.language)}
        </Text>
        <Text variant="caption" className="text-muted">
          {t('customer.wallet.lifetime')}
        </Text>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { width, fontScale } = useWindowDimensions();
  const fontScaleFactor = getFontScale(width, fontScale);
  const {
    data: wallet,
    isLoading,
    isRefetching,
    isError: isWalletError,
    refetch: refetchWallet,
  } = useWallet(user?.id ?? '');
  const {
    data: transactions,
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    isError: isTransactionsError,
    refetch: refetchTransactions,
  } = useWalletTransactions(user?.id ?? '');
  const { data: rewards } = useWalletRewards(user?.id ?? '');
  const { isOffline } = useNetworkState();
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const PAGE_SIZE = 20;
  const visibleTransactions = showAll
    ? (transactions ?? [])
    : (transactions ?? []).slice(0, PAGE_SIZE);
  const hasMore = (transactions?.length ?? 0) > PAGE_SIZE && !showAll;

  const isError = isWalletError || isTransactionsError;
  const refreshing = isRefetching || transactionsRefetching;
  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Promise.all([refetchWallet(), refetchTransactions()]);
  };

  const listHeader = (
    <View className="pt-4 pb-2">
      {/* Title */}
      <Text testID="wallet-title" variant="h1" className="mb-5 px-4">
        {t('common.wallet')}
      </Text>

      {/* Balance card — edge-to-edge feel with mx-4 + premium rounding */}
      <View testID="balance-card" className="mx-4 mb-5 overflow-hidden rounded-3xl bg-primary">
        {/* Decorative circles */}
        <View
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: 'rgba(255,255,255,0.07)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: -20,
            left: -20,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        />

        <View className="p-6">
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="mr-2.5 rounded-xl bg-white/20 p-2">
                <WalletIcon size={18} color="#fff" />
              </View>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: Math.round(14 * fontScaleFactor),
                  fontWeight: '500',
                }}
              >
                {t('customer.wallet.cardTitle')}
              </Text>
            </View>
            <Text
              style={{ color: 'rgba(255,255,255,0.5)', fontSize: Math.round(12 * fontScaleFactor) }}
            >
              {wallet?.currency ?? 'THB'}
            </Text>
          </View>

          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.5}
            style={{
              color: '#fff',
              fontSize: Math.round(40 * fontScaleFactor),
              fontWeight: '700',
              marginBottom: 24,
              width: '100%',
            }}
          >
            {isLoading
              ? '—'
              : wallet?.balance === 999999
                ? t('customer.wallet.infinite')
                : formatCurrency(wallet?.balance ?? 0)}
          </Text>

          <Button
            testID="top-up-button"
            variant="secondary"
            className="bg-white"
            textClassName="text-primary font-semibold"
            fullWidth
            onPress={() => setTopUpVisible(true)}
          >
            {t('customer.wallet.topUp')}
          </Button>
        </View>
      </View>

      {/* Rewards strip */}
      <RewardStrip rewards={rewards} />

      {/* Section header */}
      <View className="mb-1 flex-row items-center justify-between px-4">
        <Text variant="h3">{t('customer.wallet.transactions')}</Text>
        <Text variant="caption" className="text-muted">
          {t('customer.wallet.total', { count: transactions?.length ?? 0 })}
        </Text>
      </View>
    </View>
  );

  const listEmpty = transactionsLoading ? (
    <View className="px-4">
      <Skeleton width="100%" height={64} className="mb-2 rounded-2xl" />
      <Skeleton width="100%" height={64} className="mb-2 rounded-2xl" />
      <Skeleton width="100%" height={64} className="rounded-2xl" />
    </View>
  ) : (
    <EmptyState
      icon={<WalletIcon size={32} color={colors.muted} />}
      title={t('customer.wallet.noTransactionsTitle')}
      description={t('customer.wallet.noTransactionsSubtitle')}
    />
  );

  return (
    <Screen testID="wallet-screen" scrollable={false} className="bg-background">
      <TopUpModal
        visible={topUpVisible}
        onClose={() => setTopUpVisible(false)}
        isOffline={isOffline}
      />
      {isError ? (
        <View className="flex-1 pb-6">
          {listHeader}
          <View className="px-4">
            <ErrorState
              title={t('common.error')}
              message={t('customer.wallet.transactionError')}
              onRetry={handleRefresh}
              retryLabel={t('common.retry')}
            />
          </View>
        </View>
      ) : (
        <FlashList
          className="flex-1"
          data={visibleTransactions}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={64}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={
            hasMore ? (
              <Button
                variant="ghost"
                fullWidth
                onPress={() => setShowAll(true)}
                className="mt-1 mb-2"
              >
                {t('common.loadMore')}
              </Button>
            ) : null
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}
