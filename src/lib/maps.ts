import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
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

function getMapsPluginConfig(): Record<string, string> | null {
  const plugins = (Constants.expoConfig?.plugins ?? []) as Array<
    string | [string, Record<string, string>]
  >;
  const mapsPlugin = plugins.find(
    (p): p is [string, Record<string, string>] => Array.isArray(p) && p[0] === 'react-native-maps'
  );
  return mapsPlugin?.[1] ?? null;
}

export function getGoogleMapsApiKey(): string | null {
  const config = getMapsPluginConfig();
  if (!config) return null;
  return Platform.select({
    ios: config.iosGoogleMapsApiKey,
    android: config.androidGoogleMapsApiKey,
    default: config.androidGoogleMapsApiKey ?? config.iosGoogleMapsApiKey,
  });
}

/**
 * Build a Google Static Maps URL for the given coordinates.
 * This is intentionally deterministic: the same coordinates always produce
 * the same URL, so it can be cached in the database and reused by every client.
 */
export function buildStaticMapUrl(
  coords: Coordinates,
  options: { width?: number; height?: number; markerColor?: string } = {}
): string | null {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  const { latitude, longitude } = coords;
  const width = Math.min(options.width ?? 600, 640);
  const height = Math.min(options.height ?? 300, 640);
  const markerColor = encodeURIComponent(options.markerColor ?? '0x16A34A');
  const size = `${width}x${height}`;

  return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=${size}&scale=2&maptype=roadmap&markers=color:${markerColor}%7C${latitude},${longitude}&key=${apiKey}`;
}
