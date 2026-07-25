import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';

export function useCustomerProfile(userId: string) {
  return useQuery({
    queryKey: ['customer-profile', userId],
    queryFn: () => mockRepositories.users.getCustomerProfile(userId),
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      merchantId,
      isFavorite,
    }: {
      userId: string;
      merchantId: string;
      isFavorite: boolean;
    }) => {
      if (isFavorite) {
        await mockRepositories.users.removeFavorite(userId, merchantId);
      } else {
        await mockRepositories.users.addFavorite(userId, merchantId);
      }
      return { merchantId, isFavorite: !isFavorite };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
  });
}
