import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { cn } from '@/src/lib/utils';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onPress?: () => void;
  className?: string;
  size?: 'default' | 'compact';
}

export function SectionHeader({
  title,
  action,
  onPress,
  className,
  size = 'default',
}: SectionHeaderProps) {
  const colors = useThemeColor();
  return (
    <View
      className={cn(
        'flex-row items-center justify-between px-4',
        size === 'compact' ? 'mb-2' : 'mb-3',
        className
      )}
    >
      <Text variant={size === 'compact' ? 'h4' : 'h3'}>{title}</Text>
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
