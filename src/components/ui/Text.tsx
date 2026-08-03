import {
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
  useWindowDimensions,
} from 'react-native';
import { cn } from '@/src/lib/utils';
import { getFontScale } from '@/src/lib/responsive';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'caption' | 'label';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
  as?: typeof RNText;
}

// Base sizes for a ~390 logical-pt reference device.
const variantBase: Record<
  TextVariant,
  { size: number; lineHeight: number; weight: TextStyle['fontWeight']; letterSpacing?: number }
> = {
  h1: { size: 36, lineHeight: 40, weight: '700' },
  h2: { size: 24, lineHeight: 32, weight: '600' },
  h3: { size: 20, lineHeight: 28, weight: '600' },
  h4: { size: 18, lineHeight: 24, weight: '600' },
  body: { size: 16, lineHeight: 24, weight: '400' },
  'body-sm': { size: 14, lineHeight: 20, weight: '400' },
  caption: { size: 12, lineHeight: 16, weight: '400' },
  label: { size: 12, lineHeight: 16, weight: '600', letterSpacing: 0.5 },
};

// Variant color/tracking classes. Font sizes are applied dynamically so they
// respond to screen width and accessibility settings.
const variantStyles: Record<TextVariant, string> = {
  h1: 'text-foreground',
  h2: 'text-foreground',
  h3: 'text-foreground',
  h4: 'text-foreground',
  body: 'text-foreground',
  'body-sm': 'text-foreground',
  caption: 'text-muted',
  label: 'uppercase text-muted',
};

export function Text({ variant = 'body', className, as, style, ...props }: TextProps) {
  const Component = as ?? RNText;
  const { width, fontScale } = useWindowDimensions();
  const base = variantBase[variant];
  const scale = getFontScale(width, fontScale);

  return (
    <Component
      className={cn(variantStyles[variant], className)}
      style={[
        {
          fontSize: Math.round(base.size * scale),
          lineHeight: Math.round(base.lineHeight * scale),
          fontWeight: base.weight,
          letterSpacing: base.letterSpacing,
        },
        style,
      ]}
      allowFontScaling
      maxFontSizeMultiplier={1.3}
      {...props}
    />
  );
}
