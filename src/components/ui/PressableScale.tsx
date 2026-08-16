import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { cssInterop } from 'nativewind';
import { cn } from '@/src/lib/utils';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
// See Button.tsx — Animated.createAnimatedComponent() needs explicit
// cssInterop registration or `className` is a no-op (renders unstyled on web).
cssInterop(AnimatedPressable, { className: 'style' });

export function PressableScale({
  children,
  className,
  style,
  scale = 0.97,
  onPressIn,
  onPressOut,
  testID,
  ...props
}: PressableScaleProps) {
  const reducedMotion = useReducedMotion();
  const sharedValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sharedValue.value }],
  }));

  return (
    <AnimatedPressable
      testID={testID}
      className={cn(className)}
      style={reducedMotion ? style : [animatedStyle, style]}
      onPressIn={(e) => {
        if (!reducedMotion) {
          sharedValue.value = withSpring(scale, { damping: 15, stiffness: 300 });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reducedMotion) {
          sharedValue.value = withSpring(1, { damping: 15, stiffness: 300 });
        }
        onPressOut?.(e);
      }}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
