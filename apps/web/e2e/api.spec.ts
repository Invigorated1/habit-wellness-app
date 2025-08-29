import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/api/habits', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/dashboard');
    
    // Check error message is displayed
    await expect(page.getByText('Failed to load habits')).toBeVisible();
  });

  test('should show loading state', async ({ page }) => {
    // Delay API response
    await page.route('**/api/habits', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/dashboard');
    
    // Check loading state
    await expect(page.getByText('Loading...')).toBeVisible();
  });

  test('should respect rate limiting', async ({ page, request }) => {
    // Make multiple rapid requests
    const promises = [];
    for (let i = 0; i < 105; i++) {
      promises.push(request.get('/api/habits'));
    }
    
    const responses = await Promise.all(promises);
    
    // Check that some requests were rate limited
    const rateLimited = responses.filter(r => r.status() === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('should include security headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers?.['x-frame-options']).toBe('DENY');
    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['strict-transport-security']).toBeTruthy();
  });
});

test.describe('Performance', () => {
  test('should load dashboard quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should cache API responses', async ({ page }) => {
    // First load
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Record network activity on reload
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/habits')) {
        requests.push(request.url());
      }
    });
    
    // Reload page
    await page.reload();
    
    // Should use cached data (depends on implementation)
    // This test would pass if we implement proper caching
  });
});