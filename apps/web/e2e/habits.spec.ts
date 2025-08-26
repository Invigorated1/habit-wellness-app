import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/auth';

test.describe('Habit Management', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authentication
    await mockAuthenticatedUser(context);
    await page.goto('/dashboard');
  });

  test('should display empty state when no habits exist', async ({ page }) => {
    // Check for empty state
    await expect(page.getByText(/no habits yet/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create.*habit/i })).toBeVisible();
  });

  test('should create a new habit', async ({ page }) => {
    // Click create habit button
    await page.click('button:has-text("Create Habit")');
    
    // Fill in habit form
    await page.fill('input[name="name"]', 'Exercise Daily');
    await page.fill('textarea[name="description"]', 'Go for a 30-minute run every morning');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify habit was created
    await expect(page.getByText('Exercise Daily')).toBeVisible();
    await expect(page.getByText('Go for a 30-minute run every morning')).toBeVisible();
    
    // Check for success message
    await expect(page.getByText(/habit created successfully/i)).toBeVisible();
  });

  test('should validate habit creation form', async ({ page }) => {
    // Click create habit button
    await page.click('button:has-text("Create Habit")');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    
    // Fill in name with too many characters
    await page.fill('input[name="name"]', 'a'.repeat(101));
    await page.click('button[type="submit"]');
    
    // Should show length validation error
    await expect(page.getByText(/must be.*100.*characters/i)).toBeVisible();
  });

  test('should mark habit as complete', async ({ page }) => {
    // Create a habit first
    await page.click('button:has-text("Create Habit")');
    await page.fill('input[name="name"]', 'Read Books');
    await page.click('button[type="submit"]');
    
    // Wait for habit to appear
    await expect(page.getByText('Read Books')).toBeVisible();
    
    // Click the checkbox to mark as complete
    const checkbox = page.getByRole('checkbox', { name: /mark.*complete/i });
    await checkbox.click();
    
    // Verify checkbox is checked
    await expect(checkbox).toBeChecked();
    
    // Verify streak is updated
    await expect(page.getByText('1 day')).toBeVisible();
  });

  test('should edit an existing habit', async ({ page }) => {
    // Create a habit first
    await page.click('button:has-text("Create Habit")');
    await page.fill('input[name="name"]', 'Meditate');
    await page.click('button[type="submit"]');
    
    // Click edit button
    await page.click('button[aria-label="Edit habit"]');
    
    // Update habit details
    await page.fill('input[name="name"]', 'Meditate Daily');
    await page.fill('textarea[name="description"]', '10 minutes of mindfulness');
    
    // Save changes
    await page.click('button:has-text("Save")');
    
    // Verify changes were saved
    await expect(page.getByText('Meditate Daily')).toBeVisible();
    await expect(page.getByText('10 minutes of mindfulness')).toBeVisible();
  });

  test('should delete a habit', async ({ page }) => {
    // Create a habit first
    await page.click('button:has-text("Create Habit")');
    await page.fill('input[name="name"]', 'Temporary Habit');
    await page.click('button[type="submit"]');
    
    // Click delete button
    await page.click('button[aria-label="Delete habit"]');
    
    // Confirm deletion in dialog
    await page.click('button:has-text("Delete"):visible');
    
    // Verify habit was deleted
    await expect(page.getByText('Temporary Habit')).not.toBeVisible();
    await expect(page.getByText(/habit deleted/i)).toBeVisible();
  });

  test('should filter habits', async ({ page }) => {
    // Create multiple habits
    const habits = ['Exercise', 'Read Books', 'Meditate'];
    for (const habit of habits) {
      await page.click('button:has-text("Create Habit")');
      await page.fill('input[name="name"]', habit);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500); // Wait between creations
    }
    
    // Search for specific habit
    await page.fill('input[placeholder*="Search"]', 'Read');
    
    // Verify filtered results
    await expect(page.getByText('Read Books')).toBeVisible();
    await expect(page.getByText('Exercise')).not.toBeVisible();
    await expect(page.getByText('Meditate')).not.toBeVisible();
    
    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
    
    // All habits should be visible again
    for (const habit of habits) {
      await expect(page.getByText(habit)).toBeVisible();
    }
  });

  test('should show habit progress chart', async ({ page }) => {
    // Create a habit with some history
    await page.click('button:has-text("Create Habit")');
    await page.fill('input[name="name"]', 'Track Progress');
    await page.click('button[type="submit"]');
    
    // Mark as complete for multiple days (mocked)
    const checkbox = page.getByRole('checkbox', { name: /mark.*complete/i });
    await checkbox.click();
    
    // Navigate to habit details
    await page.click('text=Track Progress');
    
    // Verify progress chart is visible
    await expect(page.getByTestId('progress-chart')).toBeVisible();
    await expect(page.getByText(/completion rate/i)).toBeVisible();
  });
});