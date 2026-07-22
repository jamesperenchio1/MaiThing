import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onPress?: () => void;
}

export function SectionHeader({ title, action, onPress }: SectionHeaderProps) {
  const colors = useThemeColor();
  return (
    <View className="mb-3 flex-row items-center justify-between px-4">
      <Text variant="h3">{title}</Text>
      {action && onPress && (
        <PressableScale onPress={onPress} className="flex-row items-center">
          <Text variant="body-sm" className="text-primary">
            {action}
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </PressableScale>
      )}
    </View>
  );
}
