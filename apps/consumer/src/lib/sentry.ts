function getEnvString(key: string): string | undefined {
  const value: unknown = process.env[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return undefined;
  return value;
}

const DSN = getEnvString('EXPO_PUBLIC_SENTRY_DSN') ?? getEnvString('SENTRY_DSN_CONSUMER');

/**
 * Zero-dependency Sentry stub for the Expo app.
 * If a real DSN is configured, the API shape stays identical so swapping to
 * `@sentry/react-native` is a drop-in replacement.
 */
export function initSentry(): void {
  if (!DSN) {
    console.warn('[Sentry] DSN not configured; Sentry is disabled.');
    return;
  }
  console.warn('[Sentry] DSN present but the zero-dependency stub is in use.');
}

export function captureException(error: unknown): void {
  if (!DSN) {
    console.warn('[Sentry] Exception swallowed by no-op stub:', error);
    return;
  }
  console.error('[Sentry] captureException (stub):', error);
}
