import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

const POLL_INTERVAL = 10000;
const CHECK_URL = 'https://www.google.com/generate_204';
const NETWORK_TIMEOUT_MS = 5000;

interface NetworkState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnlineAt: Date | null;
}

let _forceOffline = false;
const _listeners = new Set<() => void>();

function notifyForceOfflineListeners() {
  _listeners.forEach((cb) => cb());
}

/**
 * DEV-only override to simulate offline mode. Used by Maestro E2E flows and
 * manual QA to verify offline queue behavior without toggling system network.
 */
export function setForceOffline(force: boolean): void {
  _forceOffline = force;
  notifyForceOfflineListeners();
}

export function getForceOffline(): boolean {
  return _forceOffline;
}

function subscribeToForceOffline(callback: () => void): () => void {
  _listeners.add(callback);
  return () => {
    _listeners.delete(callback);
  };
}

export function useNetworkState(): NetworkState & { checkNetwork: () => Promise<void> } {
  const forceOffline = useSyncExternalStore(subscribeToForceOffline, getForceOffline, () => false);
  const [isOnline, setIsOnline] = useState(!forceOffline);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // React to DEV force-offline toggles immediately.
  useEffect(() => {
    setIsOnline(!forceOffline);
  }, [forceOffline]);

  const checkNetwork = useCallback(async () => {
    if (forceOffline || _forceOffline) {
      setIsOnline(false);
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
      const response = await fetch(CHECK_URL, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok || response.status === 204 || response.status === 0) {
        setIsOnline(true);
        setLastOnlineAt(new Date());
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
    }
  }, [forceOffline]);

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
