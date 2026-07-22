import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/src/components/ui/Text';

import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/layout/SearchBar';
import { Map } from '@/src/components/map/Map';
import { useMerchants } from '@/src/hooks/useMerchants';
import { Skeleton } from '@/src/components/ui/Skeleton';

export default function MapScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const { data: merchants, isLoading } = useMerchants({
    query: query || undefined,
    lat: 13.7462,
    lng: 100.5347,
    radius: 50000,
  });

  return (
    <Screen testID="map-screen" scrollable={false}>
      <View className="absolute left-0 right-0 top-0 z-10 px-6 pt-4">
        <Text testID="map-title" className="mb-2 text-2xl font-bold text-foreground">{t('common.map')}</Text>
        <SearchBar
          placeholder={t('common.search')}
          value={query}
          onChangeText={setQuery}
          onSubmit={setQuery}
        />
      </View>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Skeleton width={200} height={24} className="rounded-xl" />
        </View>
      ) : (
        <Map merchants={merchants ?? []} />
      )}
    </Screen>
  );
}
