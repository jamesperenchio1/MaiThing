import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';
import type { BankAccount } from '@/src/types';

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
  return useMutation({
    mutationFn: (data: Omit<BankAccount, 'id' | 'merchantId'>) =>
      repositories.payouts.addBankAccount(merchantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', merchantId] });
    },
  });
}

export function useSetDefaultBankAccount(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      repositories.payouts.setDefaultBankAccount(merchantId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', merchantId] });
    },
  });
}

export function useRequestPayout(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => repositories.payouts.requestPayout(merchantId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-wallet', merchantId] });
      queryClient.invalidateQueries({ queryKey: ['payout-transactions', merchantId] });
    },
  });
}
