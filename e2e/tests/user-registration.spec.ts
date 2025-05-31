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

    // Wait a bit for the form submission to process
    await page.waitForTimeout(1000);

    // Check if there's an error message
    const errorElement = page.locator('.text-red-600');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      throw new Error(`Registration failed with error: ${errorText}`);
    }

    // First check for success message OR redirect to login
    try {
      await expect(page.getByText(/account created successfully|registration successful/i)).toBeVisible();
    } catch {
      // If no success message, check if we redirected to login
      await expect(page).toHaveURL(/\/(login)/, { timeout: 5000 });
      return; // Test passes if we're on login page
    }

    // If we saw success message, now wait for redirect
    await expect(page).toHaveURL(/\/(login)/, { timeout: 10000 });
  });

  test('should show error when passwords do not match', async ({ page }: { page: Page }) => {
    const user = AuthHelper.generateTestUser();

    await authHelper.goToRegistration();

    // Fill form directly
    await page.locator('#username').click();
    await page.locator('#username').clear();
    await page.locator('#username').fill(user.username);

    await page.locator('#password').click();
    await page.locator('#password').clear();
    await page.locator('#password').fill(user.password);

    await page.locator('#confirmPassword').click();
    await page.locator('#confirmPassword').clear();
    await page.locator('#confirmPassword').fill('differentpassword');

    // Submit directly
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Check for password mismatch error
    await expect(page.getByText(/passwords do not match|password mismatch/i)).toBeVisible();
  });

  test('should show error when username is empty', async ({ page }: { page: Page }) => {
    await authHelper.goToRegistration();

    await page.locator('#password').fill('password123');
    await page.locator('#confirmPassword').fill('password123');

    await authHelper.submitRegistration();

    // Check for username required error
    await expect(page.getByText(/username is required|username cannot be empty/i)).toBeVisible();
  });

  test('should show error when password is empty', async ({ page }: { page: Page }) => {
    const user = AuthHelper.generateTestUser();

    await authHelper.goToRegistration();

    // Fill only username directly
    await page.locator('#username').click();
    await page.locator('#username').clear();
    await page.locator('#username').fill(user.username);

    // Submit directly without filling password
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Check for password required error
    await expect(page.getByText(/password is required|password cannot be empty/i)).toBeVisible();
  });

  test('should show error when username already exists', async ({ page }: { page: Page }) => {
    const username = `duplicate${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const password = 'SecureTestPassword123!';

    // First, create a user via API to ensure it exists
    await fetch('http://localhost:8000/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    // Now try to register with the same username via UI
    await authHelper.goToRegistration();

    // Fill form directly
    await page.locator('#username').click();
    await page.locator('#username').clear();
    await page.locator('#username').fill(username);

    await page.locator('#password').click();
    await page.locator('#password').clear();
    await page.locator('#password').fill(password);

    await page.locator('#confirmPassword').click();
    await page.locator('#confirmPassword').clear();
    await page.locator('#confirmPassword').fill(password);

    // Submit directly
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Check for username already exists error
    await expect(page.getByText(/username already exists/i)).toBeVisible();
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

  test('should handle special characters in username', async ({ page }: { page: Page }) => {
    const specialUser: UserCredentials = {
      username: `test_user-${Date.now()}.special`,
      password: 'SecurePassword123!',
    };

    await authHelper.goToRegistration();
    await authHelper.fillRegistrationForm(specialUser);
    await authHelper.submitRegistration();

    // Should either succeed (redirect to login) or show appropriate validation message
    const isRedirectToLogin = await page.waitForURL(/\/login/, { timeout: 5000 }).then(() => true).catch(() => false);
    const hasSuccessMessage = await page
      .getByText(/registration successful|welcome|account created/i)
      .isVisible()
      .catch(() => false);
    const hasValidationError = await page
      .getByText(/invalid characters|alphanumeric|only letters and numbers/i)
      .isVisible()
      .catch(() => false);

    expect(isRedirectToLogin || hasSuccessMessage || hasValidationError).toBeTruthy();
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
