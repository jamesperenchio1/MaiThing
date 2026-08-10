import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MapPin } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export default function SavedAddressesScreen() {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const addresses = user?.savedAddresses ?? [];

  return (
    <Screen scrollable={false} className="bg-background">
      <Header title={t('common.savedAddresses')} />
      <FlashList
        className="flex-1"
        data={addresses}
        keyExtractor={(item, index) => `${item.street}-${index}`}
        estimatedItemSize={100}
        ListEmptyComponent={
          <View className="items-center py-16">
            <MapPin size={48} color={colors.muted} />
            <Text variant="h3" className="mt-4 text-center">
              {t('common.noSavedAddresses')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="px-6 py-2">
            <Card variant="outlined" className="flex-row items-start">
              <MapPin size={20} color={colors.primary} className="mr-3 mt-0.5" />
              <View className="flex-1">
                <Text variant="body-sm" className="font-semibold">
                  {item.street}
                </Text>
                <Text variant="body-sm" className="text-muted">
                  {item.subDistrict && `${item.subDistrict}, `}
                  {item.district}
                </Text>
                <Text variant="caption" className="text-muted">
                  {item.province} {item.postalCode}
                </Text>
              </View>
            </Card>
          </View>
        )}
        contentContainerStyle={{ paddingVertical: 16 }}
      />
    </Screen>
  );
}
