import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { useTheme } from '../../theme';

type EmptyStateProps = {
  title: string;
  description?: string | undefined;
  icon?: IconName | undefined;
  action?: { label: string; onPress: () => void } | undefined;
  style?: import('react-native').ViewStyle;
};

export function EmptyState({ title, description, icon, action, style }: EmptyStateProps) {
  const { colors, spacing, fontSizes } = useTheme();
  const styles = makeEmptyStateStyles(colors, spacing, fontSizes);

  return (
    <View style={[styles.container, style]}>
      {icon ? <Icon name={icon} size={48} /> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? <Button onPress={action.onPress}>{action.label}</Button> : null}
    </View>
  );
}

function makeEmptyStateStyles(
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
