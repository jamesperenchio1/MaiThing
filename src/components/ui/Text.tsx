import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '@/src/lib/utils';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'caption' | 'label';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
  as?: typeof RNText;
}

const variantStyles: Record<TextVariant, string> = {
  h1: 'text-4xl font-bold tracking-tight text-foreground',
  h2: 'text-2xl font-semibold tracking-tight text-foreground',
  h3: 'text-xl font-semibold tracking-tight text-foreground',
  h4: 'text-lg font-semibold text-foreground',
  body: 'text-base leading-6 text-foreground',
  'body-sm': 'text-sm leading-5 text-foreground',
  caption: 'text-xs text-muted',
  label: 'text-xs font-semibold uppercase tracking-wider text-muted',
};

export function Text({ variant = 'body', className, as, ...props }: TextProps) {
  const Component = as ?? RNText;
  return <Component className={cn(variantStyles[variant], className)} {...props} />;
}
