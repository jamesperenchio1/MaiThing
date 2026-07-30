import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';
import type { BankAccount } from '@/src/types';

export function useMerchantWallet(merchantId: string) {
  return useQuery({
    queryKey: ['merchant-wallet', merchantId],
    queryFn: () => mockRepositories.payouts.getMerchantWallet(merchantId),
    enabled: !!merchantId,
  });
}

export function usePayoutTransactions(merchantId: string) {
  return useQuery({
    queryKey: ['payout-transactions', merchantId],
    queryFn: () => mockRepositories.payouts.getPayoutTransactions(merchantId),
    enabled: !!merchantId,
  });
}

export function useBankAccounts(merchantId: string) {
  return useQuery({
    queryKey: ['bank-accounts', merchantId],
    queryFn: () => mockRepositories.payouts.getBankAccounts(merchantId),
    enabled: !!merchantId,
  });
}

export function useAddBankAccount(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BankAccount, 'id' | 'merchantId'>) =>
      mockRepositories.payouts.addBankAccount(merchantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', merchantId] });
    },
  });
}

export function useSetDefaultBankAccount(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      mockRepositories.payouts.setDefaultBankAccount(merchantId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', merchantId] });
    },
  });
}

export function useRequestPayout(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => mockRepositories.payouts.requestPayout(merchantId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-wallet', merchantId] });
      queryClient.invalidateQueries({ queryKey: ['payout-transactions', merchantId] });
    },
  });
}
