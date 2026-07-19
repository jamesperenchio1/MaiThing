import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '../src/lib/supabase';
import { initSentry, captureException } from '../src/lib/sentry';
import { capture, identify } from '../src/lib/posthog';
import { queryClient } from '../src/lib/queryClient';
import { useAuthStore } from '../src/stores/auth';
import '../src/i18n';

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
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
