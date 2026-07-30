import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { mockRepositories } from '@/src/repositories/mock';
import { TEST_CUSTOMER, TEST_MERCHANT_USER } from '@/src/repositories/seed';
import { useAuthStore } from '@/src/stores/auth';
import type { UserRole } from '@/src/types';

export function useAuth() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setRole = useAuthStore((s) => s.setRole);

  const signInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      mockRepositories.auth.signIn(email, password),
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
      mockRepositories.auth.signUp(email, password, name),
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
    }) => mockRepositories.auth.registerMerchant(data),
    onSuccess: (user) => {
      setUser(user);
      setRole('merchant');
      router.replace('/(merchant)/onboarding' as any);
    },
  });

  const continueAsTest = useCallback(
    (role: UserRole) => {
      const user = role === 'customer' ? TEST_CUSTOMER : TEST_MERCHANT_USER;
      const userWithRoles = { ...user, roles: ['customer', 'merchant'] as UserRole[] };
      console.log('[continueAsTest] setting user with roles:', userWithRoles.roles);
      setUser(userWithRoles);
      setRole(role);
      router.replace((role === 'merchant' ? '/(merchant)/(tabs)' : '/(customer)/(tabs)') as any);
    },
    [setUser, setRole, router]
  );

  const switchRole = useCallback(
    (role: UserRole) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      if (!currentUser.roles.includes(role)) {
        // If current user doesn't have the target role, fall back to test account flow
        const targetUser = role === 'merchant' ? TEST_MERCHANT_USER : TEST_CUSTOMER;
        setUser({ ...targetUser, roles: ['customer', 'merchant'] });
      }

      setRole(role);
      // Navigate to a non-index tab to avoid URL collisions between customer and merchant groups
      const targetRoute =
        role === 'merchant' ? '/(merchant)/(tabs)/orders' : '/(customer)/(tabs)/discover';
      router.replace(targetRoute as any);
    },
    [setUser, setRole, router]
  );

  const logout = useCallback(async () => {
    await mockRepositories.auth.signOut();
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
  };
}
