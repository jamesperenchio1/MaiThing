import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { createSSRSafeMMKV } from '@/src/lib/mmkvStorage';

const storage = createSSRSafeMMKV({ id: 'maithing-notifications' });
const ASKED_KEY = 'notification_permission_asked';

export function useNotificationPermission() {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [hasAsked, setHasAsked] = useState(() => storage.getBoolean(ASKED_KEY) ?? false);

  const check = useCallback(async () => {
    if (Platform.OS === 'web') {
      setGranted(false);
      return false;
    }
    const { status } = await Notifications.getPermissionsAsync();
    const isGranted = status === 'granted';
    setGranted(isGranted);
    return isGranted;
  }, []);

  const request = useCallback(async () => {
    if (Platform.OS === 'web') {
      setGranted(false);
      return false;
    }
    storage.set(ASKED_KEY, true);
    setHasAsked(true);
    const { status } = await Notifications.requestPermissionsAsync();
    const isGranted = status === 'granted';
    setGranted(isGranted);
    return isGranted;
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return {
    granted,
    hasAsked,
    check,
    request,
  };
}
