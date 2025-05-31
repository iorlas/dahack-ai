import type { Page } from '@playwright/test';

export interface UserCredentials {
    username: string;
    password: string;
}

export class AuthHelper {
    constructor(private page: Page) { }

    /**
     * Navigate to registration page
     */
    async goToRegistration(): Promise<void> {
        await this.page.goto('/');
        await this.page.getByRole('link', { name: /register|sign up/i }).click();
    }

    /**
     * Navigate to login page
     */
    async goToLogin(): Promise<void> {
        await this.page.goto('/');
        await this.page.getByRole('link', { name: /login|sign in/i }).click();
    }

    /**
     * Fill registration form
     */
    async fillRegistrationForm(credentials: UserCredentials): Promise<void> {
        // Wait for form fields to be ready and fill them with click/clear approach
        await this.page.locator('#username').waitFor({ state: 'visible' });
        await this.page.locator('#username').click();
        await this.page.locator('#username').clear();
        await this.page.locator('#username').fill(credentials.username);

        await this.page.locator('#password').click();
        await this.page.locator('#password').clear();
        await this.page.locator('#password').fill(credentials.password);

        await this.page.locator('#confirmPassword').click();
        await this.page.locator('#confirmPassword').clear();
        await this.page.locator('#confirmPassword').fill(credentials.password);

        // Verify values are set correctly
        const usernameValue = await this.page.locator('#username').inputValue();
        const passwordValue = await this.page.locator('#password').inputValue();
        const confirmPasswordValue = await this.page.locator('#confirmPassword').inputValue();

        if (usernameValue !== credentials.username ||
            passwordValue !== credentials.password ||
            confirmPasswordValue !== credentials.password) {
            throw new Error(`Form values not set correctly. Expected: ${JSON.stringify(credentials)}, Got: {username: "${usernameValue}", password: "${passwordValue}", confirmPassword: "${confirmPasswordValue}"}`);
        }
    }

    /**
     * Submit registration form
     */
    async submitRegistration(): Promise<void> {
        await this.page.getByRole('button', { name: /register|sign up/i }).click();
    }

    /**
     * Fill login form
     */
    async fillLoginForm(credentials: UserCredentials): Promise<void> {
        // Wait for username field to be ready and click it to focus
        await this.page.locator('#username').waitFor({ state: 'visible' });
        await this.page.locator('#username').click();
        await this.page.locator('#username').clear();
        await this.page.locator('#username').fill(credentials.username);

        await this.page.locator('#password').click();
        await this.page.locator('#password').clear();
        await this.page.locator('#password').fill(credentials.password);

        // Verify values are set correctly
        const usernameValue = await this.page.locator('#username').inputValue();
        const passwordValue = await this.page.locator('#password').inputValue();

        if (usernameValue !== credentials.username || passwordValue !== credentials.password) {
            throw new Error(`Login form values not set correctly. Expected: ${JSON.stringify(credentials)}, Got: {username: "${usernameValue}", password: "${passwordValue}"}`);
        }
    }

    /**
     * Submit login form
     */
    async submitLogin(): Promise<void> {
        await this.page.getByRole('button', { name: /login|sign in/i }).click();
    }

    /**
     * Complete user registration
     */
    async registerUser(credentials: UserCredentials): Promise<void> {
        await this.goToRegistration();
        await this.fillRegistrationForm(credentials);
        await this.submitRegistration();
    }

    /**
     * Complete user login
     */
    async loginUser(credentials: UserCredentials): Promise<void> {
        await this.goToLogin();
        await this.fillLoginForm(credentials);
        await this.submitLogin();
    }

    /**
     * Generate unique test user credentials
     */
    static generateTestUser(prefix = 'testuser'): UserCredentials {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return {
            username: `${prefix}${timestamp}${random}`,
            password: 'SecureTestPassword123!',
        };
    }

    /**
     * Logout user (if logout functionality exists)
     */
    async logout(): Promise<void> {
        try {
            await this.page.getByRole('button', { name: /logout|sign out/i }).click();
        } catch {
            // If no logout button found, try navigation menu
            await this.page.getByRole('link', { name: /logout|sign out/i }).click();
        }
    }

    /**
     * Check if user is logged in by looking for Skype-like chat interface elements
     */
    async isLoggedIn(): Promise<boolean> {
        try {
            // Look for Skype-like interface elements that indicate a user is logged in
            const chatList = this.page.locator('[data-testid="chat-list"]');
            const contactsList = this.page.locator('[data-testid="contacts-list"]');
            const chatRooms = this.page.locator('[data-testid="chat-rooms"]');
            const messageArea = this.page.locator('[data-testid="message-area"]');
            const logoutButton = this.page.getByRole('button', { name: /logout|sign out/i });

            // Alternative selectors for common Skype-like patterns
            const leftSidebar = this.page.locator('.sidebar, .chat-sidebar, .contacts-sidebar');
            const chatInterface = this.page.locator('.chat-interface, .messaging-area');
            const userMenu = this.page.locator('.user-menu, .profile-menu');

            const hasChatList = await chatList.isVisible().catch(() => false);
            const hasContactsList = await contactsList.isVisible().catch(() => false);
            const hasChatRooms = await chatRooms.isVisible().catch(() => false);
            const hasMessageArea = await messageArea.isVisible().catch(() => false);
            const hasLogout = await logoutButton.isVisible().catch(() => false);
            const hasSidebar = await leftSidebar.isVisible().catch(() => false);
            const hasChatInterface = await chatInterface.isVisible().catch(() => false);
            const hasUserMenu = await userMenu.isVisible().catch(() => false);

            return (
                hasChatList ||
                hasContactsList ||
                hasChatRooms ||
                hasMessageArea ||
                hasLogout ||
                hasSidebar ||
                hasChatInterface ||
                hasUserMenu
            );
        } catch {
            return false;
        }
    }
}
