import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
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
import { mockRepositories } from '@/src/repositories/mock';

configureReanimatedLogger({ level: ReanimatedLogLevel.error });
LogBox.ignoreAllLogs(true);

initializeI18n('en');
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
  const setUser = useAuthStore((s) => s.setUser);

  const init = useCallback(async () => {
    try {
      const currentUser = await mockRepositories.users.getCurrentUser();
      setUser(currentUser);
    } finally {
      setReady(true);
    }
  }, [setUser]);

  useEffect(() => {
    useThemeStore.getState().syncSystem();
    init();
  }, [init]);

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
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(customer)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(merchant)" options={{ animation: 'fade' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </View>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
