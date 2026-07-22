import { ActivityIndicator, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: import('react-native').ViewStyle;
  testID?: string;
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const { colors, spacing, radii, fontSizes, fontWeights } = useTheme();
  const isDisabled = disabled || loading;

  const styles = makeButtonStyles(colors, spacing, radii, fontSizes, fontWeights);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={children}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'danger' ? colors.textInverse : colors.primary
          }
        />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text` as const]]}>{children}</Text>
      )}
    </Pressable>
  );
}

function makeButtonStyles(
  colors: ReturnType<typeof import('../../theme').useTheme>['colors'],
  spacing: ReturnType<typeof import('../../theme').useTheme>['spacing'],
  radii: ReturnType<typeof import('../../theme').useTheme>['radii'],
  fontSizes: ReturnType<typeof import('../../theme').useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof import('../../theme').useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.lg,
      flexDirection: 'row',
      gap: spacing[2],
    },
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: colors.danger,
    },
    sm: {
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[3],
      minHeight: 36,
    },
    md: {
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      minHeight: 48,
    },
    lg: {
      paddingVertical: spacing[4],
      paddingHorizontal: spacing[5],
      minHeight: 56,
    },
    text: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
    },
    primaryText: {
      color: colors.textInverse,
    },
    secondaryText: {
      color: colors.text,
    },
    ghostText: {
      color: colors.primary,
    },
    dangerText: {
      color: colors.textInverse,
    },
    pressed: {
      opacity: 0.9,
    },
    disabled: {
      opacity: 0.5,
    },
  });
}
