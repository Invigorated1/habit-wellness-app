import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/auth';

test.describe('Performance and Loading States', () => {
  test.beforeEach(async ({ page, context }) => {
    await mockAuthenticatedUser(context);
  });

  test('should show loading states for data fetching', async ({ page }) => {
    // Slow down network to see loading states
    await page.route('**/api/habits', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/dashboard');
    
    // Should show loading skeleton
    await expect(page.getByTestId('loading-skeleton')).toBeVisible();
    
    // Should eventually show content
    await expect(page.getByTestId('habits-list')).toBeVisible({ timeout: 5000 });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/habits', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/dashboard');
    
    // Should show error state
    await expect(page.getByText(/failed to load/i)).toBeVisible();
    
    // Should have retry button
    const retryButton = page.getByRole('button', { name: /try again/i });
    await expect(retryButton).toBeVisible();
    
    // Mock successful response for retry
    await page.route('**/api/habits', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    
    // Click retry
    await retryButton.click();
    
    // Should show empty state after successful retry
    await expect(page.getByText(/no habits yet/i)).toBeVisible();
  });

  test('should handle network errors', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    await page.goto('/dashboard');
    
    // Should show network error
    await expect(page.getByText(/connection problem/i)).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Click retry
    await page.click('button:has-text("Try Again")');
    
    // Should load successfully
    await expect(page.getByTestId('habits-list')).toBeVisible({ timeout: 5000 });
  });

  test('should measure page load performance', async ({ page }) => {
    // Navigate and wait for load
    await page.goto('/dashboard');
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
    
    // Assert performance thresholds
    expect(metrics.domContentLoaded).toBeLessThan(3000);
    expect(metrics.loadComplete).toBeLessThan(5000);
    expect(metrics.firstContentfulPaint).toBeLessThan(2000);
  });

  test('should handle form submission errors', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Mock API error for habit creation
    await page.route('**/api/habits', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Validation failed',
            details: [{ field: 'name', message: 'Name already exists' }]
          }),
        });
      } else {
        route.continue();
      }
    });
    
    // Try to create a habit
    await page.click('button:has-text("Create Habit")');
    await page.fill('input[name="name"]', 'Duplicate Habit');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.getByText(/name already exists/i)).toBeVisible();
    
    // Form should still be visible for correction
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should handle session expiration', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Mock unauthorized response
    await page.route('**/api/habits', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });
    
    // Trigger a request (e.g., by refreshing data)
    await page.reload();
    
    // Should show auth error
    await expect(page.getByText(/authentication required/i)).toBeVisible();
    
    // Should have sign in button
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});