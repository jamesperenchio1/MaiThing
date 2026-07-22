import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { useWallet, useWalletTransactions } from '@/src/hooks/useWallet';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import { formatCurrency } from '@/src/lib/utils';
import type { WalletTransaction } from '@/src/types';

function TransactionItem({ transaction }: { transaction: WalletTransaction }) {
  const isIncoming = transaction.type === 'top_up' || transaction.type === 'refund';
  const colors = useThemeColor();

  return (
    <Card variant="outlined" className="mb-3 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View
          className={`mr-3 rounded-full p-2 ${isIncoming ? 'bg-primary/10' : 'bg-danger/10'}`}
        >
          {isIncoming ? (
            <ArrowDownRight size={18} color={colors.primary} />
          ) : (
            <ArrowUpRight size={18} color={colors.danger} />
          )}
        </View>
        <View>
          <Text variant="body-sm" className="font-semibold">
            {transaction.description}
          </Text>
          <Text variant="caption" className="text-muted">
            {new Date(transaction.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text
        className={`font-semibold ${isIncoming ? 'text-primary' : 'text-danger'}`}
      >
        {isIncoming ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </Text>
    </Card>
  );
}

export default function WalletScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: wallet, isLoading } = useWallet(user?.id ?? '');
  const { data: transactions } = useWalletTransactions(user?.id ?? '');

  return (
    <Screen testID="wallet-screen" scrollable className="bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text testID="wallet-title" variant="h1" className="mb-4">
          {t('common.wallet')}
        </Text>
      </View>

      <View className="px-6 pb-6">
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
            {isLoading ? '...' : wallet?.balance === 999999 ? t('customer.wallet.infinite') : formatCurrency(wallet?.balance ?? 0)}
          </Text>
          <Button
            testID="top-up-button"
            variant="secondary"
            className="bg-white"
            textClassName="text-primary"
            fullWidth
            onPress={() => {}}
          >
            {t('customer.wallet.topUp')}
          </Button>
        </Card>

        <Text variant="h3" className="mb-4">
          {t('customer.wallet.transactions')}
        </Text>
        {transactions?.slice(0, 10).map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </View>
    </Screen>
  );
}
