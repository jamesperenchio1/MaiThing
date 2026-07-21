import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useAuthStore } from '../src/stores/auth';
import { hasCompletedOnboarding } from '../src/lib/onboarding';
import { useTheme } from '../src/theme';

export default function Index() {
  const { session, isLoading: authLoading } = useAuthStore();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkOnboarding = async () => {
      const completed = await hasCompletedOnboarding();
      if (mounted) {
        setOnboardingCompleted(completed);
        setIsLoading(false);
      }
    };

    void checkOnboarding();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading || authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(buyer)/discover" />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
