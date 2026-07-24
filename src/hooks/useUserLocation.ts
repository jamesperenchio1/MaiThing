import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_USER_LOCATION } from '@/src/lib/constants';
import type { Coordinates } from '@/src/types';

export type LocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

export function useUserLocation() {
  const [location, setLocation] = useState<Coordinates>(DEFAULT_USER_LOCATION);
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus('denied');
        setLocation(DEFAULT_USER_LOCATION);
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      setStatus('granted');
    } catch (err) {
      setStatus('unavailable');
      setError(err instanceof Error ? err.message : 'Location unavailable');
      setLocation(DEFAULT_USER_LOCATION);
    }
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { location, status, error, request };
}
