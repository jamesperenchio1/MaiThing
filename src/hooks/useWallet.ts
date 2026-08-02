import { useQuery } from '@tanstack/react-query';
import { repositories } from '@/src/repositories';

export function useWallet(userId: string) {
  return useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => repositories.wallet.getWallet(userId),
    enabled: !!userId,
  });
}

export function useWalletTransactions(userId: string) {
  return useQuery({
    queryKey: ['wallet-transactions', userId],
    queryFn: () => repositories.wallet.getTransactions(userId),
    enabled: !!userId,
  });
}

export function useWalletRewards(userId: string) {
  return useQuery({
    queryKey: ['wallet-rewards', userId],
    queryFn: () => repositories.wallet.getRewards(userId),
    enabled: !!userId,
  });
}
