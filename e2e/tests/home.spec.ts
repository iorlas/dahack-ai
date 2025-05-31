import { type Page, expect, test } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }: { page: Page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DAHack AI/);
  });

  test('should have main navigation elements', async ({ page }: { page: Page }) => {
    await page.goto('/');

    // Check for main navigation elements
    await expect(page.getByRole('navigation')).toBeVisible();

    // Add more specific navigation checks based on your UI
    // Example:
    // await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    // await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
  });
});
