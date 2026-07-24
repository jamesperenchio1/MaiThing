import { Linking, Platform } from 'react-native';
import type { Coordinates } from '@/src/types';

export function openDirections(coords: Coordinates, label?: string) {
  const { latitude, longitude } = coords;
  const name = encodeURIComponent(label ?? `${latitude}, ${longitude}`);

  if (Platform.OS === 'ios') {
    Linking.openURL(`http://maps.apple.com/?daddr=${latitude},${longitude}&q=${name}`);
  } else {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&query=${name}`
    );
  }
}
