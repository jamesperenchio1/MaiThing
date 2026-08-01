import '../global.css';

import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
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

import { queryClient } from '@/src/services/queryClient';
import { initializeI18n } from '@/src/i18n';
import { useThemeStore } from '@/src/stores/theme';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { mockRepositories } from '@/src/repositories/mock';
import {
  setNotificationHandler,
  requestNotificationPermissions,
} from '@/src/services/notifications';
import { ErrorBoundary } from '@/src/components/layout/ErrorBoundary';
import { registerPushToken } from '@/src/services/pushToken';

configureReanimatedLogger({ level: ReanimatedLogLevel.error });
LogBox.ignoreAllLogs(true);

initializeI18n('en');
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

  const init = useCallback(async () => {
    try {
      const currentUser = await mockRepositories.users.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        await Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: ['wallet', currentUser.id],
            queryFn: () => mockRepositories.wallet.getWallet(currentUser.id),
          }),
          queryClient.prefetchQuery({
            queryKey: ['orders', currentUser.id, 'customer'],
            queryFn: () => mockRepositories.orders.getOrders(currentUser.id, 'customer'),
          }),
          queryClient.prefetchQuery({
            queryKey: ['customer-profile', currentUser.id],
            queryFn: () => mockRepositories.users.getCustomerProfile(currentUser.id),
          }),
        ]);
      }
    } finally {
      setReady(true);
    }
  }, [setUser]);

  useEffect(() => {
    useThemeStore.getState().syncSystem();
    setNotificationHandler();
    requestNotificationPermissions()
      .then(() => {
        const user = useAuthStore.getState().user;
        if (user) registerPushToken(user.id).catch(() => {});
      })
      .catch(() => {});
    init();

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url as string | undefined;
      if (url) {
        router.push(url as never);
      }
    });

    return () => subscription.remove();
  }, [init, router]);

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
      <QueryClientProvider client={queryClient}>
        <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
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
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
