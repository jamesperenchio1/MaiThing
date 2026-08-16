import { ScrollView, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { cn } from '@/src/lib/utils';
import { QUICK_SORT, type SortOption } from './constants';

interface QuickSortChipsProps {
  sortBy: SortOption;
  onChange: (id: SortOption) => void;
}

export function QuickSortChips({ sortBy, onChange }: QuickSortChipsProps) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4"
      contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 24 }}
    >
      {QUICK_SORT.map((opt) => (
        <PressableScale
          key={opt.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(opt.id);
          }}
          scale={0.95}
          className="mr-2"
          accessibilityRole="button"
          accessibilityState={{ selected: sortBy === opt.id }}
          accessibilityLabel={opt.label}
          accessibilityHint={t('customer.home.quickSortHint')}
        >
          <View
            className={cn(
              'rounded-full border px-5 py-2',
              sortBy === opt.id ? 'border-primary bg-primary' : 'border-border bg-card'
            )}
          >
            <Text
              variant="body-sm"
              className={sortBy === opt.id ? 'text-white font-semibold' : 'text-foreground'}
            >
              {opt.label}
            </Text>
          </View>
        </PressableScale>
      ))}
    </ScrollView>
  );
}
