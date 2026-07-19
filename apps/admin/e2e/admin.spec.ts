import { test, expect } from '@playwright/test';

/**
 * Admin console E2E smoke tests.
 *
 * These tests assume a running Next.js dev server and a seeded Supabase dev
 * project with the test admin credentials below. They are skipped when the
 * admin credentials are not configured.
 */

const adminBaseUrl = process.env.ADMIN_E2E_BASE_URL ?? 'http://localhost:3000';
const adminEmail = process.env.ADMIN_E2E_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.ADMIN_E2E_PASSWORD ?? 'AdminPassword123!';

const hasCredentials = Boolean(adminEmail && adminPassword);

const skipIfNoCredentials = hasCredentials ? test : test.skip;

test.describe('admin login', () => {
  test('login page renders', async ({ page }) => {
    await page.goto(`${adminBaseUrl}/login`);
    await expect(page.locator('body')).toContainText('MaiThing');
  });

  skipIfNoCredentials('admin can log in and view dashboard', async ({ page }) => {
    await page.goto(`${adminBaseUrl}/login`);
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${adminBaseUrl}/dashboard`);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});

test.describe('admin dashboard', () => {
  skipIfNoCredentials('navigate to merchants and approval queue', async ({ page }) => {
    await page.goto(`${adminBaseUrl}/login`);
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${adminBaseUrl}/dashboard`);

    await page.click('text=Merchants');
    await page.waitForURL(`${adminBaseUrl}/dashboard/merchants`);
    await expect(page.locator('body')).toContainText('Merchants');

    await page.click('text=Users');
    await page.waitForURL(`${adminBaseUrl}/dashboard/users`);
    await expect(page.locator('body')).toContainText('Users');
  });
});
