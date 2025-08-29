import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Go to sign in page
  await page.goto('/sign-in');
  
  // Fill in credentials
  await page.getByLabel('Email address').fill(process.env.E2E_TEST_EMAIL!);
  await page.getByLabel('Password').fill(process.env.E2E_TEST_PASSWORD!);
  
  // Click sign in
  await page.getByRole('button', { name: 'Sign in' }).click();
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
  
  // Save auth state
  await page.context().storageState({ path: authFile });
});