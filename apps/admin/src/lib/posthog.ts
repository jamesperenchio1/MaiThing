function getEnvString(key: string): string | undefined {
  const value: unknown = process.env[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return undefined;
  return value;
}

const API_KEY =
  getEnvString('NEXT_PUBLIC_POSTHOG_API_KEY') ?? getEnvString('POSTHOG_API_KEY_ADMIN');
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Zero-dependency PostHog stub for the Next.js admin app.
 * Matches the real SDK shape so replacement is straightforward.
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
