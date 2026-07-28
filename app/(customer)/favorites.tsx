import { View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { MerchantCard } from '@/src/components/composite/MerchantCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { useMerchants } from '@/src/hooks/useMerchants';
import { useCustomerProfile } from '@/src/hooks/useFavorites';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();

  const {
    data: profile,
    isLoading: profileLoading,
    isRefetching: profileRefetching,
    isError: profileError,
    refetch: refetchProfile,
  } = useCustomerProfile(user?.id ?? '');

  const {
    data: merchants,
    isLoading: merchantsLoading,
    isRefetching: merchantsRefetching,
    isError: merchantsError,
    refetch: refetchMerchants,
  } = useMerchants();

  const isLoading = profileLoading || merchantsLoading;
  const isRefetching = profileRefetching || merchantsRefetching;
  const isError = profileError || merchantsError;

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Promise.all([refetchProfile(), refetchMerchants()]);
  };

  const favorited = merchants?.filter((m) => profile?.favorites.includes(m.id)) ?? [];

  return (
    <Screen
      testID="favorites-screen"
      scrollable
      className="bg-background"
      refreshing={isRefetching}
      onRefresh={handleRefresh}
    >
      <Header title={t('common.favorites')} />
      <View className="px-6 py-4">
        {isLoading ? (
          <>
            <Skeleton width="100%" height={120} className="mb-3 rounded-3xl" />
            <Skeleton width="100%" height={120} className="mb-3 rounded-3xl" />
          </>
        ) : isError ? (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your favorites."
            onRetry={handleRefresh}
            retryLabel={t('common.retry')}
          />
        ) : favorited.length > 0 ? (
          favorited.map((merchant) => (
            <MerchantCard key={merchant.id} merchant={merchant} className="mb-3" />
          ))
        ) : (
          <EmptyState
            icon={<Heart size={32} color={colors.muted} />}
            title="No favorites yet"
            description="Tap the heart on any shop to save it here."
          />
        )}
      </View>
    </Screen>
  );
}
