import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme } from '../../theme';

export type InputProps = TextInputProps & {
  label?: string | undefined;
  helper?: string | undefined;
  error?: string | undefined;
};

export function Input({ label, helper, error, style, ...props }: InputProps) {
  const { colors, spacing, radii, fontSizes } = useTheme();

  const styles = makeInputStyles(colors, spacing, radii, fontSizes);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {helper && !error ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

function makeInputStyles(
  colors: ReturnType<typeof import('../../theme').useTheme>['colors'],
  spacing: ReturnType<typeof import('../../theme').useTheme>['spacing'],
  radii: ReturnType<typeof import('../../theme').useTheme>['radii'],
  fontSizes: ReturnType<typeof import('../../theme').useTheme>['fontSizes'],
) {
  return StyleSheet.create({
    container: {
      gap: spacing[1],
    },
    label: {
      fontSize: fontSizes.sm,
      fontWeight: '500',
      color: colors.text,
    },
    input: {
      minHeight: 48,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      color: colors.text,
      fontSize: fontSizes.md,
    },
    inputError: {
      borderColor: colors.danger,
      backgroundColor: colors.dangerMuted,
    },
    helper: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
    },
    error: {
      fontSize: fontSizes.sm,
      color: colors.danger,
    },
  });
}
