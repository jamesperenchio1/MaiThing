import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

type CardProps = {
  children: React.ReactNode;
  style?: import('react-native').ViewStyle;
  padding?: 'sm' | 'md' | 'lg';
};

export function Card({ children, style, padding = 'md' }: CardProps) {
  const { colors, spacing, radii } = useTheme();
  const paddingMap = {
    sm: spacing[3],
    md: spacing[4],
    lg: spacing[5],
  };

  const styles = makeCardStyles(colors, radii, paddingMap[padding]);

  return <View style={[styles.card, style]}>{children}</View>;
}

function makeCardStyles(
  colors: ReturnType<typeof import('../../theme').useTheme>['colors'],
  radii: ReturnType<typeof import('../../theme').useTheme>['radii'],
  padding: number,
) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.lg,
      padding,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
