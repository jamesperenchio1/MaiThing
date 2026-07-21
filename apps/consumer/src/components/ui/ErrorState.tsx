import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Icon } from './Icon';
import { useTheme } from '../../theme';

type ErrorStateProps = {
  title: string;
  description?: string | undefined;
  onRetry?: (() => void) | undefined;
  retryLabel?: string | undefined;
  style?: import('react-native').ViewStyle;
};

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = 'Try again',
  style,
}: ErrorStateProps) {
  const { colors, spacing, fontSizes } = useTheme();
  const styles = makeErrorStateStyles(colors, spacing, fontSizes);

  return (
    <View style={[styles.container, style]}>
      <Icon name="alert-circle-outline" size={48} />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {onRetry ? <Button onPress={onRetry}>{retryLabel}</Button> : null}
    </View>
  );
}

function makeErrorStateStyles(
  colors: ReturnType<typeof import('../../theme').useTheme>['colors'],
  spacing: ReturnType<typeof import('../../theme').useTheme>['spacing'],
  fontSizes: ReturnType<typeof import('../../theme').useTheme>['fontSizes'],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing[6],
      gap: spacing[3],
    },
    title: {
      fontSize: fontSizes.lg,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
}
