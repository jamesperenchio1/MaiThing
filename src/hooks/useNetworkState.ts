import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

const POLL_INTERVAL = 10000;
const CHECK_URL = 'https://www.google.com/generate_204';

interface NetworkState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnlineAt: Date | null;
}

export function useNetworkState(): NetworkState & { checkNetwork: () => Promise<void> } {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkNetwork = useCallback(async () => {
    try {
      const response = await fetch(CHECK_URL, { method: 'HEAD', mode: 'no-cors' });
      if (response.ok || response.status === 204 || response.status === 0) {
        setIsOnline(true);
        setLastOnlineAt(new Date());
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => {
        setIsOnline(true);
        setLastOnlineAt(new Date());
      };
      const handleOffline = () => {
        setIsOnline(false);
      };

      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        setLastOnlineAt(new Date());
      }

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Native: poll with fetch
    checkNetwork();
    intervalRef.current = setInterval(checkNetwork, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkNetwork]);

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnlineAt,
    checkNetwork,
  };
}
