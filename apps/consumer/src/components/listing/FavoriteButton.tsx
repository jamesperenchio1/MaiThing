import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { Icon } from '../ui';
import { getIcon } from '../../icons';
import { useFavorites } from '../../hooks/useFavorites';

interface Props {
  locationId: string;
  size?: number;
}

export default function FavoriteButton({ locationId, size = 24 }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(locationId);

  return (
    <TouchableOpacity
      onPress={() => toggle.mutate({ locationId, isFavorite: active })}
      accessibilityRole="button"
      accessibilityLabel={active ? t('listing.unfavorite') : t('listing.favorite')}
      disabled={toggle.isPending}
      style={[styles.button, { opacity: toggle.isPending ? 0.5 : 1 }]}
    >
      <Icon
        name={active ? getIcon('heartFilled') : getIcon('heart')}
        size={size}
        color={colors.danger}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { padding: 4 },
});
