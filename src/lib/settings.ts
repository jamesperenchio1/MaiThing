import { Linking } from 'react-native';

export async function openLocationSettings() {
  return Linking.openSettings();
}
