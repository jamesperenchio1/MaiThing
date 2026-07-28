import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  View,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { FlashList } from '@shopify/flash-list';
import { useWallet, useWalletTransactions } from '@/src/hooks/useWallet';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import { formatCurrency } from '@/src/lib/utils';
import { mockRepositories } from '@/src/repositories/mock';
import type { WalletTransaction } from '@/src/types';

function TransactionItem({ transaction }: { transaction: WalletTransaction }) {
  const isIncoming = transaction.type === 'top_up' || transaction.type === 'refund';
  const colors = useThemeColor();
  const router = useRouter();

  const onPress = () => {
    if (transaction.orderId) {
      router.push(`/(customer)/order/${transaction.orderId}` as any);
    }
  };

  return (
    <Pressable onPress={onPress} disabled={!transaction.orderId}>
      <Card variant="outlined" className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-2">
          <View
            className={`mr-3 rounded-full p-2 ${isIncoming ? 'bg-primary/10' : 'bg-danger/10'}`}
          >
            {isIncoming ? (
              <ArrowDownRight size={18} color={colors.primary} />
            ) : (
              <ArrowUpRight size={18} color={colors.danger} />
            )}
          </View>
          <View className="flex-1">
            <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
              {transaction.description}
            </Text>
            <Text variant="caption" className="text-muted">
              {new Date(transaction.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Text className={`font-semibold ${isIncoming ? 'text-primary' : 'text-danger'}`}>
            {isIncoming ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </Text>
          {transaction.orderId && <ChevronRight size={18} color={colors.muted} className="ml-1" />}
        </View>
      </Card>
    </Pressable>
  );
}

const TOP_UP_AMOUNTS = [50, 100, 200, 500, 1000];

function TopUpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const handleTopUp = async () => {
    if (!selected || !user) return;
    setLoading(true);
    try {
      await mockRepositories.wallet.topUp(user.id, selected);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      onClose();
      setSelected(null);
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
                <Text variant="h3">Top up wallet</Text>
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
                Select an amount to add to your wallet
              </Text>
              <View className="mb-6 flex-row flex-wrap gap-3">
                {TOP_UP_AMOUNTS.map((amount) => (
                  <PressableScale
                    key={amount}
                    onPress={() => setSelected(amount)}
                    className={`rounded-2xl border-2 px-5 py-3 ${selected === amount ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                    scale={0.96}
                  >
                    <Text
                      className={`font-semibold ${selected === amount ? 'text-primary' : 'text-foreground'}`}
                    >
                      {formatCurrency(amount)}
                    </Text>
                  </PressableScale>
                ))}
              </View>
              <Button
                fullWidth
                disabled={!selected || loading}
                loading={loading}
                onPress={handleTopUp}
              >
                {selected ? `Add ${formatCurrency(selected)}` : 'Select an amount'}
              </Button>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default function WalletScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
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
  const [topUpVisible, setTopUpVisible] = useState(false);

  const isError = isWalletError || isTransactionsError;
  const refreshing = isRefetching || transactionsRefetching;
  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Promise.all([refetchWallet(), refetchTransactions()]);
  };

  const listHeader = (
    <View className="pt-4 pb-2">
      <Text testID="wallet-title" variant="h1" className="mb-4">
        {t('common.wallet')}
      </Text>

      <Card testID="balance-card" className="mb-6 bg-primary p-6">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-3 rounded-full bg-white/20 p-2">
              <WalletIcon size={24} color="#fff" />
            </View>
            <Text className="text-white/80">{t('customer.wallet.balance')}</Text>
          </View>
          <Text variant="caption" className="text-white/60">
            {wallet?.currency}
          </Text>
        </View>
        <Text variant="h1" className="mb-4 text-white">
          {isLoading
            ? '...'
            : wallet?.balance === 999999
              ? t('customer.wallet.infinite')
              : formatCurrency(wallet?.balance ?? 0)}
        </Text>
        <Button
          testID="top-up-button"
          variant="secondary"
          className="bg-white"
          textClassName="text-primary"
          fullWidth
          onPress={() => setTopUpVisible(true)}
        >
          {t('customer.wallet.topUp')}
        </Button>
      </Card>

      <Text variant="h3" className="mb-4">
        {t('customer.wallet.transactions')}
      </Text>
    </View>
  );

  const listEmpty = transactionsLoading ? (
    <>
      <Skeleton width="100%" height={68} className="mb-3 rounded-2xl" />
      <Skeleton width="100%" height={68} className="mb-3 rounded-2xl" />
    </>
  ) : (
    <EmptyState
      icon={<WalletIcon size={32} color={colors.muted} />}
      title="No transactions yet"
      description="Your transactions will appear here."
    />
  );

  return (
    <Screen testID="wallet-screen" scrollable={false} className="bg-background">
      <TopUpModal visible={topUpVisible} onClose={() => setTopUpVisible(false)} />
      {isError ? (
        <View className="flex-1 px-6 pb-6">
          {listHeader}
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your wallet."
            onRetry={handleRefresh}
            retryLabel={t('common.retry')}
          />
        </View>
      ) : (
        <FlashList
          className="flex-1"
          data={transactions?.slice(0, 10) ?? []}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={68}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}
