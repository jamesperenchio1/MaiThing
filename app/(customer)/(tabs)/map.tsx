import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { LocateFixed, LocateOff } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/layout/SearchBar';
import { Map } from '@/src/components/map/Map';
import { useMerchants } from '@/src/hooks/useMerchants';
import { useUserLocation } from '@/src/hooks/useUserLocation';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export default function MapScreen() {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const [query, setQuery] = useState('');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | undefined>();
  const { location, status, request } = useUserLocation();

  const { data: merchants, isLoading } = useMerchants({
    query: query || undefined,
    lat: location.latitude,
    lng: location.longitude,
    radius: 50000,
  });

  const locationDenied = status === 'denied';

  return (
    <Screen testID="map-screen" scrollable={false}>
      <View className="absolute left-0 right-0 top-0 z-10 px-4 pt-4">
        <Text testID="map-title" className="mb-2 text-2xl font-bold text-foreground">
          {t('common.map')}
        </Text>
        <View className="rounded-2xl bg-background shadow-lg" style={{ shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 }}>
          <SearchBar
            placeholder="Search shops nearby..."
            value={query}
            onChangeText={setQuery}
            onSubmit={setQuery}
          />
        </View>
      </View>

      <View className="absolute bottom-28 right-4 z-10">
        <Button
          variant="secondary"
          size="icon"
          onPress={request}
          accessibilityLabel={t('customer.map.myLocation')}
        >
          {locationDenied ? (
            <LocateOff size={20} color={colors.muted} />
          ) : (
            <LocateFixed size={20} color={colors.primary} />
          )}
        </Button>
      </View>

      {locationDenied && (
        <View className="absolute bottom-24 left-4 right-4 z-10 rounded-2xl bg-card p-3 shadow-sm">
          <Text variant="body-sm" className="text-center text-muted">
            {t('customer.map.locationDenied')}
          </Text>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Skeleton width={200} height={24} className="rounded-xl" />
        </View>
      ) : (
        <Map
          merchants={merchants ?? []}
          userLocation={location}
          selectedMerchantId={selectedMerchantId}
          onSelectMerchant={(merchant) => setSelectedMerchantId(merchant.id)}
        />
      )}
    </Screen>
  );
}
