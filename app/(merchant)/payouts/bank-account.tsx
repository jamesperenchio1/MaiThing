import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Alert, ScrollView } from 'react-native';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Landmark, Check, Star, Plus } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantByOwner } from '@/src/hooks/useMerchants';
import {
  useBankAccounts,
  useAddBankAccount,
  useSetDefaultBankAccount,
} from '@/src/hooks/usePayouts';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { BankAccount } from '@/src/types';

function BankAccountItem({
  account,
  onSetDefault,
}: {
  account: BankAccount;
  onSetDefault: (id: string) => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <PressableScale
      onPress={() => onSetDefault(account.id)}
      disabled={account.isDefault}
      scale={0.98}
      className="border-b border-border last:border-b-0"
    >
      <View className="flex-row items-center justify-between py-3">
        <View className="flex-1">
          <View className="mb-1 flex-row items-center">
            <Landmark size={16} color={colors.primary} />
            <Text variant="body-sm" className="ml-2 font-semibold">
              {account.bankName}
            </Text>
            {account.isDefault && (
              <View className="ml-2 flex-row items-center rounded-full bg-primary/10 px-2 py-0.5">
                <Star size={10} color={colors.primary} fill={colors.primary} />
                <Text className="ml-1 text-xs font-semibold text-primary">
                  {t('merchant.bankAccount.setAsDefault')}
                </Text>
              </View>
            )}
          </View>
          <Text variant="caption" className="text-muted">
            {account.accountName}
          </Text>
          <Text variant="caption" className="text-muted">
            {account.accountNumber}
            {account.branch ? ` · ${account.branch}` : ''}
          </Text>
        </View>
        {!account.isDefault && (
          <View className="rounded-full bg-muted/10 p-2">
            <Check size={16} color={colors.muted} />
          </View>
        )}
      </View>
    </PressableScale>
  );
}

export default function BankAccountScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { data: merchant } = useMerchantByOwner(user?.id ?? '');
  const merchantId = merchant?.id ?? '';

  const { data: accounts, isLoading, isError, refetch } = useBankAccounts(merchantId);
  const addAccount = useAddBankAccount(merchantId);
  const setDefault = useSetDefaultBankAccount(merchantId);

  const [modalVisible, setModalVisible] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setBranch('');
    setIsDefault(false);
  };

  const handleSetDefault = (accountId: string) => {
    Alert.alert(
      t('merchant.bankAccount.setAsDefault'),
      'Set this account as the default payout account?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await setDefault.mutateAsync(accountId);
            } catch {
              Alert.alert(t('common.error'), 'Could not set default account.');
            }
          },
        },
      ]
    );
  };

  const handleAdd = async () => {
    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      Alert.alert(t('common.error'), 'Please fill in all required fields.');
      return;
    }
    try {
      await addAccount.mutateAsync({
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        branch: branch.trim() || undefined,
        isDefault,
      });
      resetForm();
      setModalVisible(false);
    } catch {
      Alert.alert(t('common.error'), 'Could not add bank account.');
    }
  };

  if (isError) {
    return (
      <Screen scrollable className="bg-background">
        <Header title={t('merchant.bankAccount.title')} />
        <View className="px-6 py-4">
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your bank accounts."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="bank-account-screen" scrollable className="bg-background">
      <Header title={t('merchant.bankAccount.title')} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-6 py-4">
          <Button
            testID="add-bank-account-button"
            fullWidth
            variant="secondary"
            onPress={() => setModalVisible(true)}
            leftIcon={<Plus size={18} color={colors.foreground} />}
            className="mb-6"
          >
            {t('merchant.payouts.addBankAccount')}
          </Button>

          <Card variant="outlined">
            {isLoading ? (
              <Text variant="body-sm" className="py-6 text-center text-muted">
                {t('common.loading')}
              </Text>
            ) : accounts && accounts.length > 0 ? (
              accounts.map((account) => (
                <BankAccountItem
                  key={account.id}
                  account={account}
                  onSetDefault={handleSetDefault}
                />
              ))
            ) : (
              <View className="items-center py-8">
                <Landmark size={40} color={colors.muted} />
                <Text variant="body-sm" className="mt-3 text-center text-muted">
                  {t('merchant.payouts.noBankAccount')}
                </Text>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>

      <BottomSheet
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        snapPoints={['50%']}
      >
            <Text variant="h3" className="mb-6">
              {t('merchant.payouts.addBankAccount')}
            </Text>

            <Input
              testID="bank-name-input"
              label={t('merchant.bankAccount.bankName')}
              placeholder="Kasikornbank"
              value={bankName}
              onChangeText={setBankName}
            />
            <Input
              testID="account-name-input"
              label={t('merchant.bankAccount.accountName')}
              placeholder="John Doe"
              value={accountName}
              onChangeText={setAccountName}
            />
            <Input
              testID="account-number-input"
              label={t('merchant.bankAccount.accountNumber')}
              placeholder="123-4-56789-0"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
            />
            <Input
              testID="branch-input"
              label={t('merchant.bankAccount.branch')}
              placeholder="Siam Square"
              value={branch}
              onChangeText={setBranch}
            />

            <PressableScale
              onPress={() => setIsDefault((v) => !v)}
              className="mb-6 flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5"
            >
              <Text variant="body-sm" className="font-medium">
                {t('merchant.bankAccount.setAsDefault')}
              </Text>
              <View className={`h-6 w-11 rounded-full ${isDefault ? 'bg-primary' : 'bg-muted/30'}`}>
                <View
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ${
                    isDefault ? 'left-6' : 'left-0.5'
                  }`}
                />
              </View>
            </PressableScale>

            <Button
              testID="save-bank-account-button"
              fullWidth
              loading={addAccount.isPending}
              disabled={!bankName.trim() || !accountName.trim() || !accountNumber.trim()}
              onPress={handleAdd}
              className="mb-3"
            >
              {t('common.save')}
            </Button>
            <Button
              testID="cancel-bank-account-button"
              fullWidth
              variant="ghost"
              onPress={() => {
                resetForm();
                setModalVisible(false);
              }}
            >
              {t('common.cancel')}
            </Button>
      </BottomSheet>
    </Screen>
  );
}
