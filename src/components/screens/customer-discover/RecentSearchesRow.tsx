import { View, Pressable } from 'react-native';
import { Clock, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface RecentSearchesRowProps {
  recent: string[];
  onSelect: (item: string) => void;
  onRemove: (item: string) => void;
  onClear: () => void;
}

export function RecentSearchesRow({ recent, onSelect, onRemove, onClear }: RecentSearchesRowProps) {
  const colors = useThemeColor();
  const { t } = useTranslation();

  return (
    <View className="mb-2 px-4">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Clock size={14} color={colors.muted} className="mr-1.5" />
          <Text variant="body-sm" className="text-muted">
            Recent searches
          </Text>
        </View>
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={t('customer.discover.clearRecentSearches')}
          accessibilityHint={t('customer.discover.clearRecentSearchesHint')}
        >
          <Text variant="caption" className="text-primary">
            Clear
          </Text>
        </Pressable>
      </View>
      <View className="flex-row flex-wrap">
        {recent.map((item) => (
          <PressableScale key={item} onPress={() => onSelect(item)} scale={0.95}>
            <View className="mr-2 mb-2 flex-row items-center rounded-full bg-muted/10 px-3 py-1.5">
              <Text variant="body-sm">{item}</Text>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onRemove(item);
                }}
                className="ml-1.5"
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('customer.discover.removeRecentSearch', { query: item })}
                accessibilityHint={t('customer.discover.removeRecentSearchHint')}
              >
                <X size={12} color={colors.muted} />
              </Pressable>
            </View>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}
