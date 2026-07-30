import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Alert, ScrollView } from 'react-native';
import { Wallet, Landmark, Clock, ArrowRight, DollarSign } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantByOwner } from '@/src/hooks/useMerchants';
import {
  useMerchantWallet,
  usePayoutTransactions,
  useBankAccounts,
  useRequestPayout,
} from '@/src/hooks/usePayouts';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency, formatRelativeTime } from '@/src/lib/utils';
import type { PayoutTransaction, BankAccount } from '@/src/types';

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text variant="body-sm" className="text-muted">
        {label}
      </Text>
      <Text variant="body-sm" className="font-semibold">
        {value}
      </Text>
    </View>
  );
}

function PayoutItem({ item }: { item: PayoutTransaction }) {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const statusColor =
    item.status === 'completed'
      ? colors.success
      : item.status === 'failed'
        ? colors.danger
        : item.status === 'processing'
          ? colors.info
          : colors.warning;

  return (
    <View className="flex-row items-center justify-between border-b border-border py-3 last:border-b-0">
      <View className="flex-1">
        <Text variant="body-sm" className="font-semibold">
          {formatCurrency(item.amount)}
        </Text>
        <Text variant="caption" className="text-muted">
          {item.bankAccountName ?? t('merchant.payouts.bankAccounts')}
        </Text>
      </View>
      <View className="items-end">
        <Text variant="caption" style={{ color: statusColor }} className="font-semibold capitalize">
          {item.status}
        </Text>
        <Text variant="caption" className="text-muted">
          {formatRelativeTime(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export default function PayoutsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { data: merchant } = useMerchantByOwner(user?.id ?? '');
  const merchantId = merchant?.id ?? '';

  const walletQuery = useMerchantWallet(merchantId);
  const transactionsQuery = usePayoutTransactions(merchantId);
  const bankAccountsQuery = useBankAccounts(merchantId);
  const requestPayout = useRequestPayout(merchantId);

  const wallet = walletQuery.data;
  const transactions = transactionsQuery.data ?? [];
  const bankAccounts = bankAccountsQuery.data ?? [];
  const defaultAccount = bankAccounts.find((b: BankAccount) => b.isDefault);

  const isLoading =
    walletQuery.isLoading || transactionsQuery.isLoading || bankAccountsQuery.isLoading;
  const isError = walletQuery.isError || transactionsQuery.isError || bankAccountsQuery.isError;

  const handleRequestPayout = () => {
    if (!wallet || wallet.balance <= 0 || !defaultAccount) return;
    Alert.alert(
      t('merchant.payouts.requestPayout'),
      `${t('merchant.payouts.payoutReceived')}: ${formatCurrency(wallet.balance)}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await requestPayout.mutateAsync(wallet.balance);
              Alert.alert('', t('merchant.payouts.payoutReceived'));
            } catch {
              Alert.alert(t('common.error'), 'Could not request payout. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isError) {
    return (
      <Screen scrollable className="bg-background">
        <Header title={t('merchant.payouts.title')} />
        <View className="px-6 py-4">
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your payout information."
            onRetry={() => {
              walletQuery.refetch();
              transactionsQuery.refetch();
              bankAccountsQuery.refetch();
            }}
            retryLabel={t('common.retry')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="merchant-payouts-screen" scrollable className="bg-background">
      <Header title={t('merchant.payouts.title')} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-6 py-4">
          {/* Wallet Card */}
          <Card variant="elevated" className="mb-6 overflow-hidden bg-primary">
            <View className="rounded-3xl bg-primary p-5">
              <View className="mb-4 flex-row items-center justify-between">
                <View className="rounded-xl bg-white/20 p-2">
                  <Wallet size={20} color={colors.white} />
                </View>
                <Text variant="caption" className="text-white/80">
                  {t('merchant.payouts.commission', { rate: wallet?.commissionRate ?? 0 })}
                </Text>
              </View>
              <Text variant="caption" className="mb-1 text-white/70">
                {t('merchant.payouts.balance')}
              </Text>
              <Text variant="h1" className="mb-4 text-4xl text-white">
                {wallet ? formatCurrency(wallet.balance) : isLoading ? '—' : formatCurrency(0)}
              </Text>
              <View className="flex-row">
                <View className="flex-1">
                  <Text variant="caption" className="text-white/60">
                    {t('merchant.payouts.pending')}
                  </Text>
                  <Text variant="h4" className="text-white">
                    {wallet ? formatCurrency(wallet.pendingPayout) : '—'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text variant="caption" className="text-white/60">
                    {t('merchant.payouts.totalEarnings')}
                  </Text>
                  <Text variant="h4" className="text-white">
                    {wallet ? formatCurrency(wallet.totalEarnings) : '—'}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Payout Dates */}
          <Card variant="outlined" className="mb-6">
            <StatRow
              label={t('merchant.payouts.nextPayout')}
              value={
                wallet?.nextPayoutDate
                  ? `${formatRelativeTime(wallet.nextPayoutDate)} (${new Date(
                      wallet.nextPayoutDate
                    ).toLocaleDateString()})`
                  : t('merchant.payouts.estimated')
              }
            />
            <StatRow
              label={t('merchant.payouts.lastPayout')}
              value={
                wallet?.lastPayoutDate
                  ? `${formatRelativeTime(wallet.lastPayoutDate)} (${new Date(
                      wallet.lastPayoutDate
                    ).toLocaleDateString()})`
                  : '—'
              }
            />
          </Card>

          {/* Bank Account Link */}
          <PressableScale
            onPress={() => router.push('/(merchant)/payouts/bank-account' as any)}
            scale={0.98}
            className="mb-6"
          >
            <Card variant="outlined">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-3 rounded-xl bg-primary/10 p-2">
                    <Landmark size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text variant="body-sm" className="font-semibold">
                      {t('merchant.payouts.bankAccounts')}
                    </Text>
                    <Text variant="caption" className="text-muted">
                      {defaultAccount
                        ? `${defaultAccount.bankName} · ${defaultAccount.accountNumber}`
                        : t('merchant.payouts.noBankAccount')}
                    </Text>
                  </View>
                </View>
                <ArrowRight size={20} color={colors.muted} />
              </View>
            </Card>
          </PressableScale>

          {/* Request Payout Button */}
          <Button
            testID="request-payout-button"
            fullWidth
            loading={requestPayout.isPending}
            disabled={!wallet || wallet.balance <= 0 || !defaultAccount}
            onPress={handleRequestPayout}
            leftIcon={<DollarSign size={18} color={colors.white} />}
            className="mb-6"
          >
            {t('merchant.payouts.requestPayout')}
          </Button>

          {/* Payout History */}
          <View>
            <View className="mb-3 flex-row items-center">
              <Clock size={18} color={colors.muted} />
              <Text variant="h4" className="ml-2">
                {t('merchant.payouts.history')}
              </Text>
            </View>
            <Card variant="outlined">
              {transactions.length === 0 ? (
                <Text variant="body-sm" className="py-6 text-center text-muted">
                  No payout history yet
                </Text>
              ) : (
                transactions.map((item) => <PayoutItem key={item.id} item={item} />)
              )}
            </Card>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
