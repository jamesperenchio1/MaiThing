import { View, type ViewProps } from 'react-native';
import { cn } from '@/src/lib/utils';

interface CardProps extends ViewProps {
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated';
}

export function Card({ children, className, variant = 'default', ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-3xl bg-card p-4',
        variant === 'outlined' && 'border border-border',
        variant === 'elevated' && 'shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
