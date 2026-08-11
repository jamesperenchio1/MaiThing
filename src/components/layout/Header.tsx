import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { cn } from '@/src/lib/utils';
import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface HeaderProps {
  title?: string;
  titleTestID?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  className?: string;
  onBack?: () => void;
  testID?: string;
}

export function Header({ title, titleTestID, showBack = true, right, className, onBack, testID }: HeaderProps) {
  const router = useRouter();
  const colors = useThemeColor();

  return (
    <View
      testID={testID}
      className={cn(
        'flex-row items-center justify-between border-b border-border px-4 pb-3',
        className
      )}
      style={{ paddingTop: 8 }}
    >
      <View className="w-12 items-start">
        {showBack && (
          <PressableScale
            testID="header-back-button"
            onPress={onBack ?? (() => router.back())}
            scale={0.92}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-muted/10"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={colors.foreground} />
          </PressableScale>
        )}
      </View>
      {title && (
        <Text testID={titleTestID} variant="h3" className="flex-1 text-center" numberOfLines={1}>
          {title}
        </Text>
      )}
      <View className="w-12 items-end">{right}</View>
    </View>
  );
}
