import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'muted' | 'primary';

type BadgeProps = {
  children: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: import('react-native').ViewStyle;
};

export function Badge({ children, variant = 'default', size = 'sm', style }: BadgeProps) {
  const { colors, spacing, radii, fontSizes } = useTheme();
  const styles = makeBadgeStyles(colors, spacing, radii, fontSizes);

  return (
    <View style={[styles.base, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`${variant}Text` as const]]}>{children}</Text>
    </View>
  );
}

function makeBadgeStyles(
  colors: ReturnType<typeof import('../../theme').useTheme>['colors'],
  spacing: ReturnType<typeof import('../../theme').useTheme>['spacing'],
  radii: ReturnType<typeof import('../../theme').useTheme>['radii'],
  fontSizes: ReturnType<typeof import('../../theme').useTheme>['fontSizes'],
) {
  return StyleSheet.create({
    base: {
      alignSelf: 'flex-start',
      borderRadius: radii.full,
    },
    sm: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[0],
      minHeight: 20,
    },
    md: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      minHeight: 28,
    },
    text: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
    },
    default: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    defaultText: {
      color: colors.text,
    },
    primary: {
      backgroundColor: colors.primaryMuted,
    },
    primaryText: {
      color: colors.primaryHover,
    },
    success: {
      backgroundColor: colors.successMuted,
    },
    successText: {
      color: colors.success,
    },
    warning: {
      backgroundColor: colors.warningMuted,
    },
    warningText: {
      color: colors.warning,
    },
    danger: {
      backgroundColor: colors.dangerMuted,
    },
    dangerText: {
      color: colors.danger,
    },
    muted: {
      backgroundColor: colors.borderSubtle,
    },
    mutedText: {
      color: colors.textMuted,
    },
  });
}
