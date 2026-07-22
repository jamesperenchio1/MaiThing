import { TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../../hooks/useFavorites';
import { Icon } from '../ui/Icon';

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
      <Icon name={active ? 'heart' : 'heart-outline'} size={size} color="#ef4444" />
    </TouchableOpacity>
  );
}
