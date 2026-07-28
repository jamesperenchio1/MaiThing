import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { cn } from '@/src/lib/utils';
import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  className?: string;
  onBack?: () => void;
  testID?: string;
}

export function Header({ title, showBack = true, right, className, onBack, testID }: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();

  return (
    <View
      testID={testID}
      className={cn('flex-row items-center justify-between border-b border-border px-4 pb-3 pt-2', className)}
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="w-12">
        {showBack && (
          <Button
            testID="header-back-button"
            variant="ghost"
            size="icon"
            onPress={onBack ?? (() => router.back())}
            className="self-start"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <ChevronLeft size={24} color={colors.foreground} />
          </Button>
        )}
      </View>
      {title && (
        <Text variant="h3" className="flex-1 text-center" numberOfLines={1}>
          {title}
        </Text>
      )}
      <View className="w-12 items-end">{right}</View>
    </View>
  );
}
