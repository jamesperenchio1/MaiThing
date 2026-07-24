import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { cn } from '@/src/lib/utils';

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
  containerClassName?: string;
}

export function PressableScale({
  children,
  className,
  containerClassName,
  scale = 0.97,
  onPressIn,
  onPressOut,
  testID,
  ...props
}: PressableScaleProps) {
  const sharedValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sharedValue.value }],
  }));

  // Propagate flex-1 to the Animated.View wrapper so layout works correctly
  const hasFlex1 = typeof className === 'string' && /\bflex-1\b/.test(className);

  return (
    <Animated.View
      style={[animatedStyle, hasFlex1 ? { flex: 1 } : undefined]}
      testID={testID}
      className={containerClassName}
    >
      <Pressable
        className={cn(hasFlex1 ? 'flex-1' : '', className)}
        onPressIn={(e) => {
          sharedValue.value = withSpring(scale, { damping: 15, stiffness: 300 });
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          sharedValue.value = withSpring(1, { damping: 15, stiffness: 300 });
          onPressOut?.(e);
        }}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
