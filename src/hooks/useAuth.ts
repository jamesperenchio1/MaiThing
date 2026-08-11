import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { supabase } from '@/src/lib/supabase';
import { repositories } from '@/src/repositories';
import { TEST_CUSTOMER, TEST_MERCHANT_USER } from '@/src/repositories/seed';
import { useAuthStore } from '@/src/stores/auth';
import type { UserRole } from '@/src/types';

const IS_SUPABASE = process.env.EXPO_PUBLIC_REPOSITORY_MODE === 'supabase';

export function useAuth() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setRole = useAuthStore((s) => s.setRole);
  const [socialLoading, setSocialLoading] = useState(false);

  const signInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      repositories.auth.signIn(email, password),
    onSuccess: (user) => {
      setUser(user);
      const selectedRole = useAuthStore.getState().selectedRole;
      router.replace(
        (selectedRole === 'merchant' ? '/(merchant)/(tabs)' : '/(customer)/(tabs)') as any
      );
    },
  });

  const signUpMutation = useMutation({
    mutationFn: ({ email, password, name }: { email: string; password: string; name: string }) =>
      repositories.auth.signUp(email, password, name),
    onSuccess: (user) => {
      setUser(user);
      const selectedRole = useAuthStore.getState().selectedRole;
      router.replace(
        (selectedRole === 'merchant' ? '/(merchant)/(tabs)' : '/(customer)/(tabs)') as any
      );
    },
  });

  const registerMerchantMutation = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      name: string;
      businessName: string;
      phone: string;
    }) => repositories.auth.registerMerchant(data),
    onSuccess: (user) => {
      setUser(user);
      setRole('merchant');
      router.replace('/(merchant)/onboarding' as any);
    },
  });

  const continueAsTest = useCallback(
    async (role: UserRole) => {
      if (!__DEV__) {
        Alert.alert('Not available', 'Test accounts are only available in development builds.');
        return;
      }

      if (IS_SUPABASE) {
        const email =
          role === 'merchant' ? 'merchant@maithing.test' : 'customer@maithing.test';
        try {
          const user = await repositories.auth.signIn(email, 'password');
          setUser({ ...user, roles: ['customer', 'merchant'] as UserRole[] });
          setRole(role);
          router.replace(
            (role === 'merchant' ? '/(merchant)/(tabs)' : '/(customer)/(tabs)') as any
          );
        } catch (e) {
          // Fall back to mock user if Supabase auth fails (no network, etc.)
          Alert.alert('Offline', 'You appear to be offline. Using offline mode.');
          const fallback = role === 'customer' ? TEST_CUSTOMER : TEST_MERCHANT_USER;
          setUser({ ...fallback, roles: ['customer', 'merchant'] as UserRole[] });
          setRole(role);
          router.replace(
            (role === 'merchant' ? '/(merchant)/(tabs)' : '/(customer)/(tabs)') as any
          );
        }
      } else {
        const user = role === 'customer' ? TEST_CUSTOMER : TEST_MERCHANT_USER;
        setUser({ ...user, roles: ['customer', 'merchant'] as UserRole[] });
        setRole(role);
        router.replace((role === 'merchant' ? '/(merchant)/(tabs)' : '/(customer)/(tabs)') as any);
      }
    },
    [setUser, setRole, router]
  );

  const switchRole = useCallback(
    (role: UserRole) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      // In mock / dev mode the test customer does not own a merchant, so always swap
      // to the dedicated test merchant/customer user when switching roles. In
      // Supabase mode we only swap when the current user lacks the target role.
      // In production, never fall back to hardcoded seed users.
      if (__DEV__ && (!IS_SUPABASE || !currentUser.roles.includes(role))) {
        const targetUser = role === 'merchant' ? TEST_MERCHANT_USER : TEST_CUSTOMER;
        setUser({ ...targetUser, roles: ['customer', 'merchant'] });
      }

      setRole(role);
      const targetRoute =
        role === 'merchant' ? '/(merchant)/(tabs)' : '/(customer)/(tabs)';
      router.replace(targetRoute as any);
    },
    [setUser, setRole, router]
  );

  const signInWithProvider = useCallback(
    async (provider: 'google' | 'apple') => {
      // In mock / dev mode we don't have real OAuth, so fall back to the test customer.
      if (!IS_SUPABASE) {
        if (!__DEV__) {
          Alert.alert('Not available', 'Social sign-in is only available in production builds with Supabase.');
          return;
        }
        const user = await repositories.auth.signIn(TEST_CUSTOMER.email, 'password');
        setUser({ ...user, roles: ['customer', 'merchant'] as UserRole[] });
        setRole('customer');
        router.replace('/(customer)/(tabs)' as any);
        return;
      }

      setSocialLoading(true);
      try {
        const redirectTo =
          Platform.OS === 'web'
            ? (typeof window !== 'undefined' ? window.location.origin : '')
            : 'maithing://';

        if (Platform.OS === 'web') {
          // On web Supabase redirects the browser back to the current origin.
          await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
          return;
        }

        // Native: open the provider's OAuth page in an in-app browser.
        // NOTE: full native OAuth also requires the iOS/Android bundle to
        // handle the maithing:// deep-link callback and exchange the URL tokens
        // for a session. The flow below parses the result returned by the browser
        // on platforms that support it; on others the app must handle the deep
        // link via a global Linking listener.
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) throw error;
        if (!data.url) throw new Error('No OAuth URL returned');

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.replace('#', ''));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
            const user = await repositories.users.getCurrentUser();
            setUser(user);
            const selectedRole = useAuthStore.getState().selectedRole;
            router.replace(
              (selectedRole === 'merchant' ? '/(merchant)/(tabs)' : '/(customer)/(tabs)') as any
            );
          }
        }
      } finally {
        setSocialLoading(false);
      }
    },
    [router, setUser, setRole]
  );

  const logout = useCallback(async () => {
    await repositories.auth.signOut();
    useAuthStore.getState().logout();
    router.replace('/(auth)/welcome' as any);
  }, [router]);

  return {
    signIn: signInMutation.mutate,
    signInLoading: signInMutation.isPending,
    signInError: signInMutation.error,
    signUp: signUpMutation.mutate,
    signUpLoading: signUpMutation.isPending,
    signUpError: signUpMutation.error,
    registerMerchant: registerMerchantMutation.mutate,
    registerMerchantLoading: registerMerchantMutation.isPending,
    registerMerchantError: registerMerchantMutation.error,
    continueAsTest,
    switchRole,
    logout,
    signInWithProvider,
    signInWithProviderLoading: socialLoading,
  };
}
