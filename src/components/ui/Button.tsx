import { cva, type VariantProps } from 'class-variance-authority';
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { cn } from '@/src/lib/utils';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const buttonVariants = cva('flex-row items-center justify-center rounded-2xl px-5 py-3.5', {
  variants: {
    variant: {
      primary: 'bg-primary shadow-sm shadow-primary/20',
      secondary: 'bg-muted/10',
      outline: 'border border-border bg-transparent',
      ghost: 'bg-transparent',
      danger: 'bg-danger',
    },
    size: {
      sm: 'px-4 py-2.5 rounded-xl',
      md: 'px-5 py-3.5 rounded-2xl',
      lg: 'px-6 py-4 rounded-2xl',
      icon: 'p-3 rounded-full',
    },
    fullWidth: {
      true: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function Button({
  children,
  variant,
  size,
  fullWidth,
  loading,
  leftIcon,
  rightIcon,
  className,
  textClassName,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;
  const colors = useThemeColor();

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? 'text-white'
      : variant === 'secondary' || variant === 'outline' || variant === 'ghost'
        ? 'text-foreground'
        : 'text-white';

  return (
    <AnimatedPressable
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPressIn={(e) => {
        if (!reducedMotion) {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reducedMotion) {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }
        onPressOut?.(e);
      }}
      style={reducedMotion ? undefined : animatedStyle}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.foreground}
          className="mr-2"
        />
      )}
      {!loading && leftIcon && <View className="mr-2">{leftIcon}</View>}
      <Text className={cn(textColor, 'font-semibold', textClassName)}>{children}</Text>
      {!loading && rightIcon && <View className="ml-2">{rightIcon}</View>}
    </AnimatedPressable>
  );
}
