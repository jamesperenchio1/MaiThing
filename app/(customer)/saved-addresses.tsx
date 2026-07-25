import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
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
    <Screen scrollable className="bg-background">
      <Header title={t('common.savedAddresses')} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4">
          {addresses.length === 0 ? (
            <View className="items-center py-16">
              <MapPin size={48} color={colors.muted} />
              <Text variant="h3" className="mt-4 text-center">
                {t('common.noSavedAddresses')}
              </Text>
            </View>
          ) : (
            addresses.map((address, index) => (
              <Card
                key={`${address.street}-${index}`}
                variant="outlined"
                className="mb-3 flex-row items-start"
              >
                <MapPin size={20} color={colors.primary} className="mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text variant="body-sm" className="font-semibold">
                    {address.street}
                  </Text>
                  <Text variant="body-sm" className="text-muted">
                    {address.subDistrict && `${address.subDistrict}, `}
                    {address.district}
                  </Text>
                  <Text variant="caption" className="text-muted">
                    {address.province} {address.postalCode}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
