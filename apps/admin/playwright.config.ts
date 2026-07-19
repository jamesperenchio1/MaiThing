import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for the admin console.
 *
 * Run against the local dev server by default. Set ADMIN_E2E_BASE_URL to point
 * at a deployed preview/production URL.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: 'list',
  use: {
    baseURL: process.env.ADMIN_E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
