import { ScrollView, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/src/lib/utils';

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
  contentClassName?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({
  children,
  scrollable = true,
  className,
  contentClassName,
  edges = ['top', 'bottom'],
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
        paddingLeft,
        paddingRight,
      }}
      {...props}
    >
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <View className={cn('flex-1 bg-background', className)} style={{ paddingTop, paddingBottom }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </View>
    );
  }

  return (
    <View className={cn('flex-1 bg-background', className)} style={{ paddingTop, paddingBottom }}>
      {content}
    </View>
  );
}
