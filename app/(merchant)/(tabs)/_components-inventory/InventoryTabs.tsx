import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';

import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import type { ListingStatus } from '@/src/types';

const TABS: ListingStatus[] = ['active', 'sold_out', 'expired', 'draft'];

export function InventoryTabs({
  activeTab,
  onTabPress,
}: {
  activeTab: ListingStatus;
  onTabPress: (tab: ListingStatus) => void;
}) {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 8 }}
      className="mb-2"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <PressableScale key={tab} onPress={() => onTabPress(tab)} scale={0.97}>
            <View
              className={`mr-2 rounded-full px-4 py-2 ${
                isActive ? 'bg-primary' : 'bg-muted/10 border border-border'
              }`}
            >
              <Text
                variant="body-sm"
                className={`font-semibold ${isActive ? 'text-white' : 'text-foreground'}`}
              >
                {t(
                  `merchant.inventory.${tab === 'sold_out' ? 'soldOut' : tab === 'draft' ? 'drafts' : tab}`
                )}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}
