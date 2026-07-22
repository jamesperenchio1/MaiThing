import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type ColorScheme = 'light' | 'dark';

type Colors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryHover: string;
  primaryMuted: string;
  danger: string;
  dangerMuted: string;
  warning: string;
  warningMuted: string;
  success: string;
  successMuted: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderSubtle: string;
  overlay: string;
  shadow: string;
};

const lightColors: Colors = {
  background: '#ffffff',
  surface: '#f9fafb',
  surfaceElevated: '#ffffff',
  primary: '#16a34a',
  primaryHover: '#15803d',
  primaryMuted: '#f0fdf4',
  danger: '#dc2626',
  dangerMuted: '#fef2f2',
  warning: '#d97706',
  warningMuted: '#fffbeb',
  success: '#16a34a',
  successMuted: '#f0fdf4',
  text: '#111827',
  textMuted: '#6b7280',
  textInverse: '#ffffff',
  border: '#e5e7eb',
  borderSubtle: '#f3f4f6',
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: 'rgba(0, 0, 0, 0.06)',
};

const darkColors: Colors = {
  background: '#09090b',
  surface: '#121214',
  surfaceElevated: '#18181b',
  primary: '#22c55e',
  primaryHover: '#16a34a',
  primaryMuted: '#14532d',
  danger: '#ef4444',
  dangerMuted: '#450a0a',
  warning: '#f59e0b',
  warningMuted: '#451a03',
  success: '#22c55e',
  successMuted: '#14532d',
  text: '#fafafa',
  textMuted: '#a1a1aa',
  textInverse: '#09090b',
  border: '#27272a',
  borderSubtle: '#1f1f22',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
} as const;

const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

const fontSizes = {
  xs: 12,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

const lineHeights = {
  tight: 1.25,
  normal: 1.4,
  relaxed: 1.5,
} as const;

const opacity = {
  disabled: 0.5,
  hover: 0.8,
} as const;

export type Theme = {
  colors: Colors;
  colorScheme: ColorScheme;
  spacing: typeof spacing;
  radii: typeof radii;
  fontSizes: typeof fontSizes;
  fontWeights: typeof fontWeights;
  lineHeights: typeof lineHeights;
  opacity: typeof opacity;
  isDark: boolean;
};

const makeTheme = (colorScheme: ColorScheme): Theme => ({
  colors: colorScheme === 'dark' ? darkColors : lightColors,
  colorScheme,
  spacing,
  radii,
  fontSizes,
  fontWeights,
  lineHeights,
  opacity,
  isDark: colorScheme === 'dark',
});

type ThemeContextValue = {
  theme: Theme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() ?? 'light';
  const [colorScheme, setColorScheme] = useState<ColorScheme>(systemScheme);

  useEffect(() => {
    setColorScheme(systemScheme);
  }, [systemScheme]);

  const theme = useMemo(() => makeTheme(colorScheme), [colorScheme]);

  return (
    <ThemeContext.Provider value={{ theme, setColorScheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.theme;
}
