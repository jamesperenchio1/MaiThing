import { cva, type VariantProps } from 'class-variance-authority';
import { Children } from 'react';
import { View } from 'react-native';
import { cn } from '@/src/lib/utils';
import { Text } from './Text';

const badgeVariants = cva(
  'items-center justify-center rounded-full px-2.5 py-1 whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary/10',
        success: 'bg-green-100',
        warning: 'bg-amber-100',
        danger: 'bg-red-100',
        info: 'bg-blue-100',
        muted: 'bg-gray-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const textVariants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'text-primary',
  success: 'text-green-800',
  warning: 'text-amber-800',
  danger: 'text-red-800',
  info: 'text-blue-800',
  muted: 'text-gray-800',
};

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const resolvedVariant = variant ?? 'default';
  const childArray = Children.toArray(children);
  const allText = childArray.every(
    (child) => typeof child === 'string' || typeof child === 'number'
  );
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      {allText ? (
        <Text className={cn('text-xs font-semibold', textVariants[resolvedVariant])}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
