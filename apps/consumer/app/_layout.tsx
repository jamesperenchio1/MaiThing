import { useEffect, Component, type ReactNode } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { supabase } from '../src/lib/supabase';
import { initSentry, captureException } from '../src/lib/sentry';
import { capture, identify } from '../src/lib/posthog';
import { queryClient } from '../src/lib/queryClient';
import { useAuthStore } from '../src/stores/auth';
import { Text, View } from 'react-native';
import '../src/i18n';

const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    console.error('ErrorBoundary caught:', error);
    return { error };
  }
  override render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: 'red' }}>{this.state.error.message}</Text>
          <Text style={{ fontSize: 12, marginTop: 10 }}>{this.state.error.stack}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    initSentry();
    capture('app_open');

    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
        if (session?.user) {
          identify(session.user.id);
        }
      })
      .catch((err: unknown) => {
        captureException(err);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);

  return (
    <ErrorBoundary>
      <StripeProvider publishableKey={STRIPE_KEY}>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </StripeProvider>
    </ErrorBoundary>
  );
}
