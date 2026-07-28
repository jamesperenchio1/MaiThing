import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Image, RefreshControl } from 'react-native';
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
import { FlashList } from '@shopify/flash-list';
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
          {listing.quantityRemaining > 0 && listing.quantityRemaining <= 3 && (
            <Text variant="body-sm" className="font-semibold text-danger">
              {' '}
              · Low stock
            </Text>
          )}
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
    dataUpdatedAt,
  } = useListings({
    merchantId: 'merchant-1', // Test merchant
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  const listHeader = (
    <View className="pt-4 pb-2">
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
      {lastUpdated && (
        <Text variant="caption" className="mb-2 text-muted">
          Last updated: {lastUpdated}
        </Text>
      )}
    </View>
  );

  return (
    <Screen testID="inventory-screen" scrollable={false} className="bg-background">
      {isError || isLoading ? (
        <View className="flex-1 px-6 pb-6">
          {listHeader}
          {isError ? (
            <ErrorState
              title={t('common.error')}
              message="We couldn't load your inventory."
              onRetry={refetch}
              retryLabel={t('common.retry')}
            />
          ) : (
            <>
              <Skeleton width="100%" height={92} className="mb-3 rounded-2xl" />
              <Skeleton width="100%" height={92} className="mb-3 rounded-2xl" />
              <Skeleton width="100%" height={92} className="mb-3 rounded-2xl" />
            </>
          )}
        </View>
      ) : (
        <FlashList
          className="flex-1"
          data={listings ?? []}
          renderItem={({ item }) => <InventoryCard listing={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={92}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              icon={<Package size={32} color={colors.muted} />}
              title="No listings yet"
              description="Create your first listing to start selling."
            />
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}
