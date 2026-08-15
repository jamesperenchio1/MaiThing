import { View } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { SearchBar } from '@/src/components/layout/SearchBar';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { cn } from '@/src/lib/utils';

interface SearchHeaderProps {
  searchQuery: string;
  onChangeText: (text: string) => void;
  onSubmit: (value: string) => void;
  onFilterPress: () => void;
  activeFilterCount: number;
  searchPlaceholder: string;
  filterAccessibilityLabel: string;
}

export function SearchHeader({
  searchQuery,
  onChangeText,
  onSubmit,
  onFilterPress,
  activeFilterCount,
  searchPlaceholder,
  filterAccessibilityLabel,
}: SearchHeaderProps) {
  const colors = useThemeColor();

  return (
    <View className="mb-4 flex-row items-center gap-3 px-4">
      <View className="flex-1">
        <SearchBar
          testID="discover-search-bar"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChangeText={onChangeText}
          onSubmit={onSubmit}
        />
      </View>
      <PressableScale
        onPress={onFilterPress}
        scale={0.95}
        accessibilityRole="button"
        accessibilityLabel={filterAccessibilityLabel}
        accessibilityState={{ selected: activeFilterCount > 0 }}
      >
        <View
          className={cn(
            'relative rounded-2xl border border-border bg-card p-3.5',
            activeFilterCount > 0 && 'border-primary bg-primary/10'
          )}
        >
          <SlidersHorizontal
            size={20}
            color={activeFilterCount > 0 ? colors.primary : colors.foreground}
          />
          {activeFilterCount > 0 && (
            <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5">
              <Text variant="caption" className="text-white">
                {activeFilterCount}
              </Text>
            </View>
          )}
        </View>
      </PressableScale>
    </View>
  );
}
