import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Coordinates, Merchant } from '@/src/types';

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

function averageCoordinate(merchants: Merchant[]): Coordinates {
  if (merchants.length === 0) return { latitude: 13.7462, longitude: 100.5347 };
  const lat = merchants.reduce((sum, m) => sum + m.coordinates.latitude, 0) / merchants.length;
  const lng = merchants.reduce((sum, m) => sum + m.coordinates.longitude, 0) / merchants.length;
  return { latitude: lat, longitude: lng };
}

/**
 * Build a Google Static Maps URL showing multiple merchant markers.
 * This is NOT deterministic (it depends on the merchant list), so it should
 * only be used for previews that are generated per view, not cached in the DB.
 */
export function buildStaticMapUrlForMerchants(
  merchants: Merchant[],
  options: { width?: number; height?: number; markerColor?: string; maxMarkers?: number } = {}
): string | null {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || merchants.length === 0) return null;

  const width = Math.min(options.width ?? 600, 640);
  const height = Math.min(options.height ?? 300, 640);
  const markerColor = encodeURIComponent(options.markerColor ?? '0x16A34A');
  const size = `${width}x${height}`;
  const center = averageCoordinate(merchants);
  const maxMarkers = Math.min(options.maxMarkers ?? 20, 50);
  const visibleMerchants = merchants.slice(0, maxMarkers);
  const markersParam = visibleMerchants
    .map((m) => `${m.coordinates.latitude},${m.coordinates.longitude}`)
    .join('%7C');

  return `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&size=${size}&scale=2&maptype=roadmap&markers=color:${markerColor}%7C${markersParam}&key=${apiKey}`;
}

/**
 * Build a Google Maps Embed URL for a free interactive web map centered on a location.
 * The Embed API is free with unlimited usage, but only supports a single search/marker.
 */
export function buildGoogleMapsEmbedUrl(coords: Coordinates, label?: string): string | null {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;
  const q = encodeURIComponent(label ?? `${coords.latitude},${coords.longitude}`);
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${q}&center=${coords.latitude},${coords.longitude}&zoom=15`;
}
