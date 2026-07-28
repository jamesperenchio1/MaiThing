import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Package, Plus } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useListings } from '@/src/hooks/useListings';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import { formatCurrency } from '@/src/lib/utils';
import type { Listing } from '@/src/types';

const statusVariantMap: Record<
  Listing['status'],
  'default' | 'warning' | 'success' | 'danger' | 'info'
> = {
  active: 'success',
  sold_out: 'warning',
  expired: 'danger',
  draft: 'info',
};

function InventoryCard({ listing }: { listing: Listing }) {
  return (
    <Card variant="elevated" className="mb-3 flex-row overflow-hidden p-0">
      <Image source={{ uri: listing.images[0] }} className="h-full w-28" resizeMode="cover" />
      <View className="flex-1 p-3">
        <View className="mb-1 flex-row items-center justify-between">
          <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
            {listing.title}
          </Text>
          <Badge variant={statusVariantMap[listing.status]}>{listing.status}</Badge>
        </View>
        <Text variant="body-sm" className="mb-1 text-muted">
          {formatCurrency(listing.salePrice)} · {listing.quantityRemaining} left
        </Text>
        <Text variant="caption" className="text-muted">
          Pickup{' '}
          {new Date(listing.pickupWindowStart).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </Card>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const {
    data: listings,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useListings({
    merchantId: 'merchant-1', // Test merchant
  });

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  return (
    <Screen
      testID="inventory-screen"
      scrollable
      className="bg-background"
      refreshing={isRefetching}
      onRefresh={handleRefresh}
    >
      <View className="px-6 pt-4 pb-2">
        <View className="mb-4 flex-row items-center justify-between">
          <Text testID="inventory-title" variant="h1">
            {t('merchant.inventory.title')}
          </Text>
          <Button
            testID="new-listing-button"
            size="sm"
            leftIcon={<Plus size={16} color={colors.white} />}
            onPress={() => router.push('/(merchant)/listings/new' as any)}
          >
            New
          </Button>
        </View>
      </View>

      <View className="px-6 pb-6">
        {isLoading ? (
          <>
            <Skeleton width="100%" height={92} className="mb-3 rounded-2xl" />
            <Skeleton width="100%" height={92} className="mb-3 rounded-2xl" />
            <Skeleton width="100%" height={92} className="mb-3 rounded-2xl" />
          </>
        ) : isError ? (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your inventory."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        ) : listings?.length ? (
          listings.map((listing) => <InventoryCard key={listing.id} listing={listing} />)
        ) : (
          <EmptyState
            icon={<Package size={32} color={colors.muted} />}
            title="No listings yet"
            description="Create your first listing to start selling."
          />
        )}
      </View>
    </Screen>
  );
}
