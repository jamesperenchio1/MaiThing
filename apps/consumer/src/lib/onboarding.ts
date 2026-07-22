import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'has_completed_onboarding';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
  return value === 'true';
}

export async function markOnboardingComplete(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
}
