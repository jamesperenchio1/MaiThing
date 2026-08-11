import { useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import { useOfflineMutation } from './useOfflineMutation';
import type { BankAccount, MerchantWallet, PayoutTransaction } from '@/src/types';

export function useMerchantWallet(merchantId: string) {
  return useQuery({
    queryKey: ['merchant-wallet', merchantId],
    queryFn: () => repositories.payouts.getMerchantWallet(merchantId),
    enabled: !!merchantId,
  });
}

export function usePayoutTransactions(merchantId: string) {
  return useQuery({
    queryKey: ['payout-transactions', merchantId],
    queryFn: () => repositories.payouts.getPayoutTransactions(merchantId),
    enabled: !!merchantId,
  });
}

export function useBankAccounts(merchantId: string) {
  return useQuery({
    queryKey: ['bank-accounts', merchantId],
    queryFn: () => repositories.payouts.getBankAccounts(merchantId),
    enabled: !!merchantId,
  });
}

export function useAddBankAccount(merchantId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (data: Omit<BankAccount, 'id' | 'merchantId'>) =>
      repositories.payouts.addBankAccount(merchantId, data),
    offlineOperation: {
      type: 'addBankAccount',
      payload: (data) => ({ merchantId, data }),
    },
    onMutate: async (data) => {
      const queryKey = ['bank-accounts', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BankAccount[]>(queryKey);

      const optimistic: BankAccount = {
        ...data,
        id: `optimistic-${Date.now()}`,
        merchantId,
      };

      queryClient.setQueryData<BankAccount[]>(queryKey, (old) => {
        return old ? [...old, optimistic] : [optimistic];
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bank-accounts', merchantId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', merchantId] });
    },
  });
}

export function useSetDefaultBankAccount(merchantId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (accountId: string) =>
      repositories.payouts.setDefaultBankAccount(merchantId, accountId),
    offlineOperation: {
      type: 'setDefaultBankAccount',
      payload: (accountId) => ({ merchantId, accountId }),
    },
    onMutate: async (accountId) => {
      const queryKey = ['bank-accounts', merchantId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BankAccount[]>(queryKey);

      queryClient.setQueryData<BankAccount[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((account) => ({
          ...account,
          isDefault: account.id === accountId,
        }));
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bank-accounts', merchantId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', merchantId] });
    },
  });
}

export function useRequestPayout(merchantId: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: (amount: number) => repositories.payouts.requestPayout(merchantId, amount),
    offlineOperation: {
      type: 'requestPayout',
      payload: (amount) => ({ merchantId, amount }),
    },
    onMutate: async (amount) => {
      const walletKey = ['merchant-wallet', merchantId];
      const transactionsKey = ['payout-transactions', merchantId];
      await queryClient.cancelQueries({ queryKey: walletKey });
      await queryClient.cancelQueries({ queryKey: transactionsKey });
      const previousWallet = queryClient.getQueryData<MerchantWallet>(walletKey);
      const previousTransactions = queryClient.getQueryData<PayoutTransaction[]>(transactionsKey);

      queryClient.setQueryData<MerchantWallet>(walletKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          balance: old.balance - amount,
          pendingPayout: old.pendingPayout + amount,
        };
      });

      const optimisticTransaction: PayoutTransaction = {
        id: `optimistic-${Date.now()}`,
        merchantId,
        amount,
        status: 'pending',
        method: 'bank_transfer',
        bankAccountId: '',
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PayoutTransaction[]>(transactionsKey, (old) => {
        return old ? [optimisticTransaction, ...old] : [optimisticTransaction];
      });

      return { previousWallet, previousTransactions };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousWallet) {
        queryClient.setQueryData(['merchant-wallet', merchantId], context.previousWallet);
      }
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          ['payout-transactions', merchantId],
          context.previousTransactions
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-wallet', merchantId] });
      queryClient.invalidateQueries({ queryKey: ['payout-transactions', merchantId] });
    },
  });
}
