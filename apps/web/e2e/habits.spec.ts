import { test, expect } from '@playwright/test';

test.describe('Habits Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display habits dashboard', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Habit Wellness App/);
    
    // Check dashboard heading
    await expect(page.getByRole('heading', { name: 'Habit Dashboard' })).toBeVisible();
  });

  test('should create a new habit', async ({ page }) => {
    // Click create habit button (when implemented)
    await page.getByRole('button', { name: 'Create Habit' }).click();
    
    // Fill in habit details
    await page.getByLabel('Name').fill('Test Exercise Habit');
    await page.getByLabel('Description').fill('Daily morning exercise routine');
    
    // Submit form
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify habit appears in list
    await expect(page.getByText('Test Exercise Habit')).toBeVisible();
    await expect(page.getByText('Daily morning exercise routine')).toBeVisible();
  });

  test('should edit an existing habit', async ({ page }) => {
    // Click edit button on first habit
    await page.getByRole('button', { name: 'Edit' }).first().click();
    
    // Update habit name
    await page.getByLabel('Name').clear();
    await page.getByLabel('Name').fill('Updated Habit Name');
    
    // Save changes
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify update
    await expect(page.getByText('Updated Habit Name')).toBeVisible();
  });

  test('should delete a habit', async ({ page }) => {
    // Get initial habit count
    const initialCount = await page.locator('[data-testid="habit-card"]').count();
    
    // Click delete on first habit
    await page.getByRole('button', { name: 'Delete' }).first().click();
    
    // Confirm deletion
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Verify habit is removed
    const newCount = await page.locator('[data-testid="habit-card"]').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should mark habit as complete for today', async ({ page }) => {
    // Click checkbox for first habit
    await page.getByRole('checkbox', { name: 'Mark complete' }).first().check();
    
    // Verify streak updates
    await expect(page.getByText(/Streak: \d+ days/)).toBeVisible();
  });

  test('should handle empty habits state', async ({ page }) => {
    // Navigate to page with no habits
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    
    // Check empty state message
    await expect(page.getByText('No habits found')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be usable on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that dashboard is visible
    await expect(page.getByRole('heading', { name: 'Habit Dashboard' })).toBeVisible();
    
    // Check that habits are displayed properly
    const habits = page.locator('[data-testid="habit-card"]');
    await expect(habits.first()).toBeVisible();
  });
});