import { expect, test, type Page } from '@playwright/test';

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

    test('should be responsive', async ({ page }: { page: Page }) => {
        await page.goto('/');

        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(page.getByRole('navigation')).toBeVisible();

        // Test tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });
        await expect(page.getByRole('navigation')).toBeVisible();

        // Test desktop viewport
        await page.setViewportSize({ width: 1280, height: 800 });
        await expect(page.getByRole('navigation')).toBeVisible();
    });
});
