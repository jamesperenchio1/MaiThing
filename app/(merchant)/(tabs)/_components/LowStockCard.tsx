import { View } from 'react-native';
import { Package } from 'lucide-react-native';

import { Image } from '@/src/components/ui/Image';
import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { Listing } from '@/src/types';

export function LowStockCard({ listing, onPress }: { listing: Listing; onPress?: () => void }) {
  const colors = useThemeColor();

  return (
    <PressableScale key={listing.id} onPress={onPress} scale={0.98}>
      <Card variant="outlined" className="mb-3">
        <View className="flex-row items-center">
          {listing.images[0] ? (
            <Image source={{ uri: listing.images[0] }} className="mr-3 h-12 w-12 rounded-xl" />
          ) : (
            <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-muted/10">
              <Package size={20} color={colors.muted} />
            </View>
          )}
          <View className="flex-1">
            <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
              {listing.title}
            </Text>
            <Text variant="caption" className="text-muted">
              {formatCurrency(listing.salePrice)}
            </Text>
          </View>
          <Badge variant="danger">{listing.quantityRemaining} left</Badge>
        </View>
      </Card>
    </PressableScale>
  );
}
