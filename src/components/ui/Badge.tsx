import { cva, type VariantProps } from 'class-variance-authority';
import { View } from 'react-native';
import { cn } from '@/src/lib/utils';
import { Text } from './Text';

const badgeVariants = cva('items-center justify-center rounded-full px-2.5 py-1', {
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
});

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      <Text className="text-xs font-semibold text-foreground">{children}</Text>
    </View>
  );
}
