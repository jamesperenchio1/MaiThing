import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let permissionGranted: boolean | null = null;

export async function requestNotificationPermissions(): Promise<boolean> {
  if (permissionGranted !== null) return permissionGranted;
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    status = result.status;
  }
  permissionGranted = status === 'granted';
  return permissionGranted;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  if (Platform.OS === 'web') return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null,
  });
}

export function setNotificationHandler() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
