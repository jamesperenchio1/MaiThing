import { useQuery } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';

export function useWallet(userId: string) {
  return useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => mockRepositories.wallet.getWallet(userId),
    enabled: !!userId,
  });
}

export function useWalletTransactions(userId: string) {
  return useQuery({
    queryKey: ['wallet-transactions', userId],
    queryFn: () => mockRepositories.wallet.getTransactions(userId),
    enabled: !!userId,
  });
}
