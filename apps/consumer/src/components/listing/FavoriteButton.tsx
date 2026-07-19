import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../../hooks/useFavorites';

interface Props {
  locationId: string;
  size?: number;
}

export default function FavoriteButton({ locationId, size = 24 }: Props) {
  const { t } = useTranslation();
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(locationId);

  return (
    <TouchableOpacity
      onPress={() => toggle.mutate({ locationId, isFavorite: active })}
      accessibilityRole="button"
      accessibilityLabel={active ? t('listing.unfavorite') : t('listing.favorite')}
      disabled={toggle.isPending}
    >
      <Text style={[styles.heart, { fontSize: size }]}>{active ? '♥' : '♡'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heart: { color: '#ef4444' },
});
