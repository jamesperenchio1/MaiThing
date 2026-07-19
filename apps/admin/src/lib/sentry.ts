function getEnvString(key: string): string | undefined {
  const value: unknown = process.env[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return undefined;
  return value;
}

const DSN = getEnvString('SENTRY_DSN_ADMIN') ?? getEnvString('NEXT_PUBLIC_SENTRY_DSN');

/**
 * Zero-dependency Sentry stub for the Next.js admin app.
 * Keeps the same API as the real Sentry SDK so swapping is trivial once a DSN
 * is provided.
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
