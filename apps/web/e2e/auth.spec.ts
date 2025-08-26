import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should be redirected to sign-in
    await expect(page).toHaveURL(/.*sign-in/);
    
    // Sign-in page should be visible
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should allow users to sign up', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Fill in sign-up form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after successful sign-up
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should allow users to sign in', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Fill in sign-in form
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'ExistingPassword123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after successful sign-in
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should allow users to sign out', async ({ page, context }) => {
    // First sign in
    await context.addCookies([
      {
        name: '__session',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await page.goto('/dashboard');
    
    // Click sign out button
    await page.click('button[aria-label="Sign out"]');
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
  });
});