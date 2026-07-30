import { ScrollView, View } from 'react-native';
import { Sunrise, Sun, Sunset, Moon } from 'lucide-react-native';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { cn } from '@/src/lib/utils';
import { MEAL_TIMES, type MealTimeId } from '@/src/lib/constants';

const ICONS: Record<MealTimeId, typeof Sunrise> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Sunset,
  late_night: Moon,
};

interface MealTimeShortcutsProps {
  selected?: MealTimeId | null;
  onSelect?: (id: MealTimeId | null) => void;
  locale?: 'en' | 'th';
}

export function MealTimeShortcuts({ selected, onSelect, locale = 'en' }: MealTimeShortcutsProps) {
  const colors = useThemeColor();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 16 }}
      className="mb-6"
    >
      {MEAL_TIMES.map((meal) => {
        const Icon = ICONS[meal.id];
        const isActive = selected === meal.id;
        return (
          <PressableScale
            key={meal.id}
            onPress={() => onSelect?.(isActive ? null : meal.id)}
            scale={0.95}
          >
            <View
              className={cn(
                'mr-3 flex-row items-center rounded-2xl border px-4 py-3',
                isActive
                  ? 'border-primary bg-primary'
                  : 'border-border bg-card'
              )}
            >
              <Icon size={18} color={isActive ? colors.white : colors.foreground} />
              <Text
                className={cn(
                  'ml-2 font-semibold',
                  isActive ? 'text-white' : 'text-foreground'
                )}
              >
                {locale === 'th' ? meal.nameTh : meal.name}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}
