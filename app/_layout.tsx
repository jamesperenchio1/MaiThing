import '../global.css';

import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  NotoSansThai_400Regular,
  NotoSansThai_500Medium,
  NotoSansThai_600SemiBold,
  NotoSansThai_700Bold,
} from '@expo-google-fonts/noto-sans-thai';

import { queryClient, persistOptions } from '@/src/services/queryClient';
import { initializeI18n } from '@/src/i18n';
import { useThemeStore } from '@/src/stores/theme';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { repositories } from '@/src/repositories';
import {
  setNotificationHandler,
  requestNotificationPermissions,
} from '@/src/services/notifications';
import { ErrorBoundary } from '@/src/components/layout/ErrorBoundary';
import { registerPushToken } from '@/src/services/pushToken';
import { useRealtimeOrders } from '@/src/hooks/useRealtimeOrders';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { useOfflineQueue } from '@/src/hooks/useOfflineQueue';
import { offlineQueue } from '@/src/lib/offlineQueue';
import {
  CURRENT_CACHE_VERSION,
  getStoredCacheVersion,
  setStoredCacheVersion,
} from '@/src/lib/cacheVersion';
import { useNotificationPermission } from '@/src/hooks/useNotificationPermission';
import { useBackgroundNotifications } from '@/src/hooks/useBackgroundNotifications';

configureReanimatedLogger({ level: ReanimatedLogLevel.error });
LogBox.ignoreAllLogs(true);

initializeI18n();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansThai_400Regular,
    NotoSansThai_500Medium,
    NotoSansThai_600SemiBold,
    NotoSansThai_700Bold,
  });
  const isDark = useThemeStore((s) => s.isDark);
  const colors = useThemeColor();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const selectedRole = useAuthStore((s) => s.selectedRole);

  useRealtimeOrders(user?.id, selectedRole ?? undefined);
  useOfflineQueue();
  useBackgroundNotifications();

  const { request: requestNotificationPermission, hasAsked } = useNotificationPermission();

  const init = useCallback(async () => {
    try {
      const currentUser = await repositories.users.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        await Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: ['wallet', currentUser.id],
            queryFn: () => repositories.wallet.getWallet(currentUser.id),
          }),
          queryClient.prefetchQuery({
            queryKey: ['orders', currentUser.id, 'customer'],
            queryFn: () => repositories.orders.getOrders(currentUser.id, 'customer'),
          }),
          queryClient.prefetchQuery({
            queryKey: ['customer-profile', currentUser.id],
            queryFn: () => repositories.users.getCustomerProfile(currentUser.id),
          }),
        ]);
      }
    } finally {
      setReady(true);
    }
  }, [setUser]);

  const onRestoreSuccess = useCallback(() => {
    const user = useAuthStore.getState().user;
    if (user) {
      Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ['wallet', user.id],
          queryFn: () => repositories.wallet.getWallet(user.id),
        }),
        queryClient.prefetchQuery({
          queryKey: ['orders', user.id, 'customer'],
          queryFn: () => repositories.orders.getOrders(user.id, 'customer'),
        }),
        queryClient.prefetchQuery({
          queryKey: ['customer-profile', user.id],
          queryFn: () => repositories.users.getCustomerProfile(user.id),
        }),
      ]);
    }
  }, []);

  useEffect(() => {
    useThemeStore.getState().syncSystem();
    setNotificationHandler();

    // Request notification permissions on first app open
    if (!hasAsked) {
      requestNotificationPermission().catch(() => {});
    }

    // Cache schema version check — clear stale cache after schema changes
    const storedVersion = getStoredCacheVersion();
    if (storedVersion !== CURRENT_CACHE_VERSION) {
      queryClient.clear();
      offlineQueue.clear();
      setStoredCacheVersion(CURRENT_CACHE_VERSION);
    }

    init().then(() => {
      // After auth is hydrated, register push token if we have a user
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        requestNotificationPermissions()
          .then(() => registerPushToken(currentUser.id))
          .catch(() => {});
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url as string | undefined;
      if (url) {
        router.push(url as never);
      }
    });

    return () => subscription.remove();
  }, [init, router, hasAsked, requestNotificationPermission]);

  useEffect(() => {
    if (fontsLoaded && ready) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, ready]);

  if (!fontsLoaded || !ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={persistOptions}
            onSuccess={onRestoreSuccess}
          >
            <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
              <OfflineBanner />
              <ErrorBoundary>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                  }}
                >
                  <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                  <Stack.Screen name="(customer)" options={{ animation: 'default' }} />
                  <Stack.Screen name="(merchant)" options={{ animation: 'default' }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </ErrorBoundary>
            </View>
            <StatusBar style={isDark ? 'light' : 'dark'} />
          </PersistQueryClientProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
