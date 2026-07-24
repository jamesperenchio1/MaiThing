import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { Heart } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { MerchantCard } from '@/src/components/composite/MerchantCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { mockRepositories } from '@/src/repositories/mock';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export default function FavoritesScreen() {
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['customer-profile', user?.id],
    queryFn: () => mockRepositories.customerProfile.getCustomerProfile(user?.id ?? ''),
    enabled: !!user?.id,
  });

  const { data: merchants, isLoading: merchantsLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => mockRepositories.merchants.getMerchants(),
  });

  const isLoading = profileLoading || merchantsLoading;

  const favorited = merchants?.filter((m) => profile?.favorites.includes(m.id)) ?? [];

  return (
    <Screen testID="favorites-screen" scrollable className="bg-background">
      <Header title="Favorites" />
      <View className="px-6 py-4">
        {isLoading ? (
          <>
            <Skeleton width="100%" height={120} className="mb-3 rounded-3xl" />
            <Skeleton width="100%" height={120} className="mb-3 rounded-3xl" />
          </>
        ) : favorited.length > 0 ? (
          favorited.map((merchant) => (
            <MerchantCard key={merchant.id} merchant={merchant} className="mb-3" />
          ))
        ) : (
          <View className="items-center py-16">
            <Heart size={48} color={colors.muted} />
            <Text variant="h3" className="mt-4 text-center">No favorites yet</Text>
            <Text variant="body" className="mt-2 text-center text-muted">
              Tap the heart on any shop to save it here.
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
