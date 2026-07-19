function getEnvString(key: string): string | undefined {
  const value: unknown = process.env[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return undefined;
  return value;
}

const API_KEY =
  getEnvString('EXPO_PUBLIC_POSTHOG_API_KEY') ?? getEnvString('POSTHOG_API_KEY_CONSUMER');
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Zero-dependency PostHog stub for the Expo app.
 * The export shape matches the real SDK so the stub can be replaced later.
 */
export function capture(event: string, properties?: Record<string, unknown>): void {
  if (!API_KEY) {
    if (isDev) {
      console.warn('[PostHog] capture (dev stub):', event, properties);
    }
    return;
  }
  console.warn('[PostHog] capture (stub):', event, properties);
}

export function identify(userId: string, properties?: Record<string, unknown>): void {
  if (!API_KEY) {
    if (isDev) {
      console.warn('[PostHog] identify (dev stub):', userId, properties);
    }
    return;
  }
  console.warn('[PostHog] identify (stub):', userId, properties);
}
