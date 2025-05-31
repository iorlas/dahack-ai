import { type Page, expect, test } from '@playwright/test';
import { AuthHelper, type UserCredentials } from './helpers/auth';

test.describe('User Registration', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }: { page: Page }) => {
    authHelper = new AuthHelper(page);
    await page.goto('/');
  });

  test('should display registration form', async ({ page }: { page: Page }) => {
    await authHelper.goToRegistration();

    // Check that registration form elements are present
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByLabel(/confirm password|repeat password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /register|sign up/i })).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }: { page: Page }) => {
    const user = AuthHelper.generateTestUser();

    await authHelper.goToRegistration();
    await authHelper.fillRegistrationForm(user);
    await authHelper.submitRegistration();

    // Check for successful registration (redirect to chat interface or login)
    await expect(page).toHaveURL(/\/(chat|rooms|login)/);

    // Or check for success message if staying on same page
    await expect(page.getByText(/registration successful|welcome|account created/i)).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }: { page: Page }) => {
    const user = AuthHelper.generateTestUser();

    await authHelper.goToRegistration();

    await page.getByLabel(/username/i).fill(user.username);
    await page.getByLabel(/^password/i).fill(user.password);
    await page.getByLabel(/confirm password|repeat password/i).fill('differentpassword');

    await authHelper.submitRegistration();

    // Check for password mismatch error
    await expect(page.getByText(/passwords do not match|password mismatch/i)).toBeVisible();
  });

  test('should show error when username is empty', async ({ page }: { page: Page }) => {
    await authHelper.goToRegistration();

    await page.getByLabel(/^password/i).fill('password123');
    await page.getByLabel(/confirm password|repeat password/i).fill('password123');

    await authHelper.submitRegistration();

    // Check for username required error
    await expect(page.getByText(/username is required|username cannot be empty/i)).toBeVisible();
  });

  test('should show error when password is empty', async ({ page }: { page: Page }) => {
    const user = AuthHelper.generateTestUser();

    await authHelper.goToRegistration();
    await page.getByLabel(/username/i).fill(user.username);

    await authHelper.submitRegistration();

    // Check for password required error
    await expect(page.getByText(/password is required|password cannot be empty/i)).toBeVisible();
  });

  test('should show error when username already exists', async ({ page }: { page: Page }) => {
    const user: UserCredentials = {
      username: 'existinguser',
      password: 'password123',
    };

    // First, register a user
    await authHelper.registerUser(user);

    // Navigate back to registration
    await authHelper.goToRegistration();

    // Try to register with same username
    await authHelper.fillRegistrationForm(user);
    await authHelper.submitRegistration();

    // Check for username already exists error
    await expect(page.getByText(/username already exists|username is taken/i)).toBeVisible();
  });

  test('should handle form validation for weak passwords', async ({ page }: { page: Page }) => {
    const user = AuthHelper.generateTestUser();
    const weakPasswordUser: UserCredentials = {
      username: user.username,
      password: '123',
    };

    await authHelper.goToRegistration();
    await authHelper.fillRegistrationForm(weakPasswordUser);
    await authHelper.submitRegistration();

    // Check for weak password error (if password policy is implemented)
    await expect(
      page.getByText(/password too weak|password must be|minimum password/i)
    ).toBeVisible();
  });

  test('should navigate to login page from registration', async ({ page }: { page: Page }) => {
    await authHelper.goToRegistration();

    // Check for link to login page
    await page.getByRole('link', { name: /login|sign in|already have account/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }: { page: Page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await authHelper.goToRegistration();

    // Check that form elements are visible and usable on mobile
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password|repeat password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /register|sign up/i })).toBeVisible();

    // Test form submission on mobile
    const user = AuthHelper.generateTestUser('mobile_user');

    await authHelper.fillRegistrationForm(user);
    await authHelper.submitRegistration();

    // Verify registration works on mobile (redirect to chat interface)
    await expect(page).toHaveURL(/\/(chat|rooms|login)/);
  });

  test('should handle special characters in username', async ({ page }: { page: Page }) => {
    const specialUser: UserCredentials = {
      username: `test_user-${Date.now()}.special`,
      password: 'SecurePassword123!',
    };

    await authHelper.goToRegistration();
    await authHelper.fillRegistrationForm(specialUser);
    await authHelper.submitRegistration();

    // Should either succeed or show appropriate validation message
    const isSuccess = await page
      .getByText(/registration successful|welcome|account created/i)
      .isVisible()
      .catch(() => false);
    const hasValidationError = await page
      .getByText(/invalid characters|username format/i)
      .isVisible()
      .catch(() => false);

    expect(isSuccess || hasValidationError).toBeTruthy();
  });

  test('should handle very long username', async ({ page }: { page: Page }) => {
    const longUser: UserCredentials = {
      username: 'a'.repeat(100), // Very long username
      password: 'SecurePassword123!',
    };

    await authHelper.goToRegistration();
    await authHelper.fillRegistrationForm(longUser);
    await authHelper.submitRegistration();

    // Should show validation error for username too long
    await expect(page.getByText(/username too long|maximum length/i)).toBeVisible();
  });
});
