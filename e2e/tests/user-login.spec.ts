import { type Page, expect, test } from '@playwright/test';
import { AuthHelper, type UserCredentials } from './helpers/auth';

test.describe('User Login', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }: { page: Page }) => {
    authHelper = new AuthHelper(page);
    await page.goto('/');
  });

  test('should display login form', async ({ page }: { page: Page }) => {
    await authHelper.goToLogin();

    // Check that login form elements are present
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }: { page: Page }) => {
    // First, register a user via API to avoid navigation issues
    const user = AuthHelper.generateTestUser();

    // Create user via API
    await fetch('http://localhost:8000/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, password: user.password }),
    });

    // Then login with the same credentials
    await authHelper.goToLogin();
    await authHelper.fillLoginForm(user);
    await authHelper.submitLogin();

    // Check for successful login (redirect to chat interface)
    await expect(page).toHaveURL(/\/(chat|rooms)/);

    // Verify user is logged in (can see chat interface)
    expect(await authHelper.isLoggedIn()).toBeTruthy();
  });

  test('should show error with invalid username', async ({ page }: { page: Page }) => {
    const invalidUser: UserCredentials = {
      username: 'nonexistentuser',
      password: 'password123',
    };

    await authHelper.goToLogin();
    await authHelper.fillLoginForm(invalidUser);
    await authHelper.submitLogin();

    // Check for invalid credentials error
    await expect(page.getByText(/invalid credentials|user not found|login failed/i)).toBeVisible();
  });

  test('should show error with invalid password', async ({ page }: { page: Page }) => {
    // First, register a user via API
    const user = AuthHelper.generateTestUser();

    // Create user via API
    await fetch('http://localhost:8000/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, password: user.password }),
    });

    // Try to login with wrong password
    const wrongPasswordUser: UserCredentials = {
      username: user.username,
      password: 'wrongpassword',
    };

    await authHelper.goToLogin();
    await authHelper.fillLoginForm(wrongPasswordUser);
    await authHelper.submitLogin();

    // Check for invalid credentials error
    await expect(
      page.getByText(/invalid credentials|incorrect password|login failed/i)
    ).toBeVisible();
  });

  test('should show error when username is empty', async ({ page }: { page: Page }) => {
    await authHelper.goToLogin();

    // Fill password directly and verify it's set
    await page.locator('#password').click();
    await page.locator('#password').clear();
    await page.locator('#password').fill('password123');

    // Verify password is set
    const passwordValue = await page.locator('#password').inputValue();
    expect(passwordValue).toBe('password123');

    // Submit form directly
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Check for username required error
    await expect(page.getByText(/username is required|username cannot be empty/i)).toBeVisible();
  });

  test('should show error when password is empty', async ({ page }: { page: Page }) => {
    await authHelper.goToLogin();

    // Fill username directly and verify it's set
    await page.locator('#username').click();
    await page.locator('#username').clear();
    await page.locator('#username').fill('testuser');

    // Verify username is set
    const usernameValue = await page.locator('#username').inputValue();
    expect(usernameValue).toBe('testuser');

    // Submit form directly
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Check for password required error
    await expect(page.getByText(/password is required|password cannot be empty/i)).toBeVisible();
  });

  test('should navigate to registration page from login', async ({ page }: { page: Page }) => {
    await authHelper.goToLogin();

    // Check for link to registration page
    await page.getByRole('link', { name: /register|sign up|create account/i }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('button', { name: /register|sign up/i })).toBeVisible();
  });

  test('should maintain login state after page refresh', async ({ page }: { page: Page }) => {
    // Register and login a user via API and direct login
    const user = AuthHelper.generateTestUser();

    // Create user via API
    await fetch('http://localhost:8000/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, password: user.password }),
    });

    // Login directly
    await authHelper.goToLogin();
    await authHelper.fillLoginForm(user);
    await authHelper.submitLogin();

    // Wait for redirect to chat
    await expect(page).toHaveURL(/\/(chat|rooms)/);

    // Verify user is logged in
    expect(await authHelper.isLoggedIn()).toBeTruthy();

    // Refresh the page
    await page.reload();

    // User should still be logged in (assuming session persistence)
    expect(await authHelper.isLoggedIn()).toBeTruthy();
  });

  test('should handle case insensitive username login', async ({ page }: { page: Page }) => {
    // Register a user with lowercase username via API
    const user = AuthHelper.generateTestUser();

    // Create user via API
    await fetch('http://localhost:8000/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, password: user.password }),
    });

    // Try to login with uppercase username
    const uppercaseUser: UserCredentials = {
      username: user.username.toUpperCase(),
      password: user.password,
    };

    await authHelper.goToLogin();
    await authHelper.fillLoginForm(uppercaseUser);
    await authHelper.submitLogin();

    // Should either succeed (case insensitive) or show appropriate error
    const isLoggedIn = await authHelper.isLoggedIn();
    const hasError = await page
      .getByText(/invalid credentials|user not found/i)
      .isVisible()
      .catch(() => false);

    expect(isLoggedIn || hasError).toBeTruthy();
  });

  test('should handle logout functionality', async ({ page }: { page: Page }) => {
    // Register and login a user via API and direct login
    const user = AuthHelper.generateTestUser();

    // Create user via API
    await fetch('http://localhost:8000/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, password: user.password }),
    });

    // Login directly
    await authHelper.goToLogin();
    await authHelper.fillLoginForm(user);
    await authHelper.submitLogin();

    // Wait for redirect to chat
    await expect(page).toHaveURL(/\/(chat|rooms)/);

    // Verify user is logged in
    expect(await authHelper.isLoggedIn()).toBeTruthy();

    // Logout
    await authHelper.logout();

    // Wait for redirect after logout (should be redirected to home page)
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 10000 });

    // Verify user is logged out (should be on home page without chat elements)
    expect(await authHelper.isLoggedIn()).toBeFalsy();
  });
});
