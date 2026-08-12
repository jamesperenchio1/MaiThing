import { useMemo } from 'react';
import { View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Image } from '@/src/components/ui/Image';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { buildStaticMapUrlForMerchants } from '@/src/lib/maps';
import type { Merchant } from '@/src/types';

interface MapPreviewCardProps {
  merchants: Merchant[];
  onPress: () => void;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
}

export function MapPreviewCard({
  merchants,
  onPress,
  title,
  subtitle,
  buttonLabel,
}: MapPreviewCardProps) {
  const colors = useThemeColor();
  const visible = merchants.slice(0, 5);

  const mapUrl = useMemo(
    () => buildStaticMapUrlForMerchants(merchants, { width: 600, height: 320 }),
    [merchants]
  );

  return (
    <Card variant="elevated" className="mb-6 overflow-hidden rounded-3xl p-0">
      <View className="h-40 items-center justify-center bg-primary/5">
        {mapUrl ? (
          <Image
            source={{ uri: mapUrl }}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
          />
        ) : null}
        <View
          className={`items-center ${mapUrl ? 'rounded-2xl bg-background/80 px-4 py-2 backdrop-blur-sm' : ''}`}
        >
          <View className="mb-3 rounded-full bg-primary/10 p-3">
            <MapPin size={32} color={colors.primary} />
          </View>
          <Text variant="h4" className="text-center">
            {title ?? `${visible.length} shops near you`}
          </Text>
          <Text variant="body-sm" className="text-center text-muted">
            {subtitle ?? 'Discover rescue deals on the map'}
          </Text>
        </View>
      </View>
      <View className="p-4">
        <Button fullWidth onPress={onPress}>
          {buttonLabel ?? 'Open Map'}
        </Button>
      </View>
    </Card>
  );
}
