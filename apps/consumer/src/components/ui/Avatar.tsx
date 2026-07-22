import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from './Icon';

type AvatarProps = {
  uri?: string | null;
  name?: string;
  size?: number;
};

export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const { colors, radii } = useTheme();
  const styles = makeAvatarStyles(colors, radii, size);

  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />;
  }

  const initials = name ? name.slice(0, 2).toUpperCase() : '??';

  return (
    <View style={styles.avatar}>
      {name ? (
        <Text style={styles.initials}>{initials}</Text>
      ) : (
        <Icon name="person" size={size * 0.5} />
      )}
    </View>
  );
}

function makeAvatarStyles(
  colors: ReturnType<typeof import('../../theme').useTheme>['colors'],
  radii: ReturnType<typeof import('../../theme').useTheme>['radii'],
  size: number,
) {
  return StyleSheet.create({
    avatar: {
      width: size,
      height: size,
      borderRadius: radii.full,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    initials: {
      fontSize: size * 0.4,
      fontWeight: '600',
      color: colors.textMuted,
    },
  });
}
