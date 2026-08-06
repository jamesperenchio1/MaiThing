import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/src/lib/utils';

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
  contentClassName?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboardAvoiding?: boolean;
}

export function Screen({
  children,
  scrollable = true,
  className,
  contentClassName,
  edges = ['top', 'bottom'],
  refreshing,
  onRefresh,
  keyboardAvoiding = false,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? insets.bottom : 0;
  const paddingLeft = edges.includes('left') ? insets.left : 0;
  const paddingRight = edges.includes('right') ? insets.right : 0;

  const content = (
    <View
      className={cn('flex-1 bg-background', contentClassName)}
      style={{
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
      }}
      {...props}
    >
      {children}
    </View>
  );

  const refreshControl =
    onRefresh !== undefined ? (
      <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} />
    ) : undefined;

  const screenBody = scrollable ? (
    <View className={cn('flex-1 bg-background', className)}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </ScrollView>
    </View>
  ) : (
    <View className={cn('flex-1 bg-background', className)}>{content}</View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {screenBody}
      </KeyboardAvoidingView>
    );
  }

  return screenBody;
}
