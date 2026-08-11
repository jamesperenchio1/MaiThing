/**
 * Simple feature flag system for Maithing.
 * In production, flags can be loaded from Supabase (remote_config table)
 * or from environment variables.
 *
 * Usage:
 *   if (featureFlags.enablePersonalityOnboarding) { ... }
 */

interface FeatureFlags {
  enablePersonalityOnboarding: boolean;
  enableMerchantPersonality: boolean;
  enableOfflineBanner: boolean;
  enableAnalytics: boolean;
  enableSocialSharing: boolean;
  enableWaitlist: boolean;
  enableFlashSales: boolean;
  enableAutoWelcomeMessage: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  enablePersonalityOnboarding: true,
  enableMerchantPersonality: true,
  enableOfflineBanner: true,
  enableAnalytics: true,
  enableSocialSharing: false,
  enableWaitlist: true,
  enableFlashSales: true,
  enableAutoWelcomeMessage: true,
};

let _overrides: Partial<FeatureFlags> = {};

export function setFeatureFlags(overrides: Partial<FeatureFlags>) {
  _overrides = { ..._overrides, ...overrides };
}

export const featureFlags: FeatureFlags = new Proxy(DEFAULT_FLAGS, {
  get(target, key: string) {
    if (key in _overrides) {
      return _overrides[key as keyof FeatureFlags];
    }
    return target[key as keyof FeatureFlags];
  },
});

export function isEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag];
}
