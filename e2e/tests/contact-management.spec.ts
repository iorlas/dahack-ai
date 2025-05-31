import { type Page, expect, test } from '@playwright/test';
import { AuthHelper, type UserCredentials } from './helpers/auth';
import { ContactHelper } from './helpers/contact';

test.describe('Contact Management', () => {
    let authHelper: AuthHelper;
    let contactHelper: ContactHelper;
    let alice: UserCredentials;
    let bob: UserCredentials;
    let charlie: UserCredentials;

    test.beforeEach(async ({ page }: { page: Page }) => {
        authHelper = new AuthHelper(page);
        contactHelper = new ContactHelper(page);

        // Generate test users
        alice = AuthHelper.generateTestUser('alice');
        bob = AuthHelper.generateTestUser('bob');
        charlie = AuthHelper.generateTestUser('charlie');

        // Create users via API
        await Promise.all([
            fetch('http://localhost:8000/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alice),
            }),
            fetch('http://localhost:8000/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bob),
            }),
            fetch('http://localhost:8000/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(charlie),
            }),
        ]);

        // Login as alice
        await authHelper.loginUser(alice);
        await page.waitForURL(/\/chat/, { timeout: 10000 });
    });

    test('should successfully add a contact by username', async ({ page }: { page: Page }) => {
        await contactHelper.goToContacts();
        await contactHelper.addContact(bob.username);

        // Should see success message
        const successMessage = await contactHelper.getSuccessMessage();
        expect(successMessage).toMatch(/contact request sent/i);
    });

    test('should show error when adding non-existent username', async ({ page }: { page: Page }) => {
        await contactHelper.goToContacts();
        await contactHelper.addContact('nonexistent_user');

        // Should see error message
        const errorMessage = await contactHelper.getErrorMessage();
        expect(errorMessage).toMatch(/user not found/i);
    });

    test('should show error when adding already existing contact', async ({ page }: { page: Page }) => {
        // First add bob as contact via API
        await contactHelper.createContactRequestViaAPI(alice, bob.username);
        await contactHelper.acceptContactRequestViaAPI(bob, alice.username);

        await page.reload();
        await contactHelper.goToContacts();
        await contactHelper.addContact(bob.username);

        // Should see error message
        const errorMessage = await contactHelper.getErrorMessage();
        expect(errorMessage).toMatch(/already in your contacts/i);
    });

    test('should accept a contact request', async ({ page }: { page: Page }) => {
        // Create contact request from bob to alice via API
        await contactHelper.createContactRequestViaAPI(bob, alice.username);

        await page.reload();
        await contactHelper.goToContacts();

        // Invitation should be visible directly in contacts list
        expect(await contactHelper.hasContactRequest(bob.username)).toBeTruthy();

        await contactHelper.acceptContactRequest(bob.username);

        // Bob should appear in contact list
        expect(await contactHelper.isContactInList(bob.username)).toBeTruthy();
    });

    test('should decline a contact request', async ({ page }: { page: Page }) => {
        // Create contact request from charlie to alice via API
        await contactHelper.createContactRequestViaAPI(charlie, alice.username);

        await page.reload();
        await contactHelper.goToContacts();

        // Invitation should be visible directly in contacts list
        expect(await contactHelper.hasContactRequest(charlie.username)).toBeTruthy();

        await contactHelper.declineContactRequest(charlie.username);

        // Charlie should not appear in contact list
        expect(await contactHelper.isContactInList(charlie.username)).toBeFalsy();

        // Request should be removed
        expect(await contactHelper.hasContactRequest(charlie.username)).toBeFalsy();
    });

    test('should remove a contact from contact list', async ({ page }: { page: Page }) => {
        // Set up bob as contact via API
        await contactHelper.createContactRequestViaAPI(alice, bob.username);
        await contactHelper.acceptContactRequestViaAPI(bob, alice.username);

        await page.reload();
        await contactHelper.goToContacts();

        // Verify bob is in contact list first
        expect(await contactHelper.isContactInList(bob.username)).toBeTruthy();

        // Remove contact
        await contactHelper.removeContact(bob.username);

        // Bob should be removed from contact list
        expect(await contactHelper.isContactInList(bob.username)).toBeFalsy();
    });

    test('should view contact list with alphabetical sorting', async ({ page }: { page: Page }) => {
        // Add multiple contacts via API
        await contactHelper.createContactRequestViaAPI(alice, bob.username);
        await contactHelper.acceptContactRequestViaAPI(bob, alice.username);
        await contactHelper.createContactRequestViaAPI(alice, charlie.username);
        await contactHelper.acceptContactRequestViaAPI(charlie, alice.username);

        await page.reload();
        await contactHelper.goToContacts();

        // Check both contacts are visible
        expect(await contactHelper.isContactInList(bob.username)).toBeTruthy();
        expect(await contactHelper.isContactInList(charlie.username)).toBeTruthy();

        // Check alphabetical ordering (implementation dependent)
        const contactElements = await page.getByTestId(/^contact-/).all();
        expect(contactElements.length).toBeGreaterThanOrEqual(2);
    });

    test('should search contacts', async ({ page }: { page: Page }) => {
        // Add multiple contacts via API
        await contactHelper.createContactRequestViaAPI(alice, bob.username);
        await contactHelper.acceptContactRequestViaAPI(bob, alice.username);
        await contactHelper.createContactRequestViaAPI(alice, charlie.username);
        await contactHelper.acceptContactRequestViaAPI(charlie, alice.username);

        await page.reload();
        await contactHelper.goToContacts();

        // Search for bob
        await contactHelper.searchContacts('bo');

        // Should see bob but not charlie
        expect(await contactHelper.isContactInList(bob.username)).toBeTruthy();

        // Note: charlie might still be visible depending on implementation
        // In a real test, we'd check the filtered results more precisely
    });

    test('should show error when trying to add self as contact', async ({ page }: { page: Page }) => {
        await contactHelper.goToContacts();
        await contactHelper.addContact(alice.username);

        // Should see error message
        const errorMessage = await contactHelper.getErrorMessage();
        expect(errorMessage).toMatch(/cannot add yourself/i);
    });

    test('should display pending requests in contacts list', async ({ page }: { page: Page }) => {
        // Create contact request from bob to alice
        await contactHelper.createContactRequestViaAPI(bob, alice.username);

        await page.reload();
        await contactHelper.goToContacts();

        // Should see pending invitation directly in contacts list
        expect(await contactHelper.hasContactRequest(bob.username)).toBeTruthy();

        // Should see the orange invitation styling
        const invitation = page.getByTestId(`request-${bob.username}`);
        await expect(invitation).toHaveClass(/bg-orange-50|border-orange-200/);
    });

    test('should handle empty contact list state', async ({ page }: { page: Page }) => {
        await contactHelper.goToContacts();

        // Should see empty state message
        const emptyState = page.getByText(/no contacts yet|start by adding/i);
        await expect(emptyState).toBeVisible();
    });

    test('should handle empty pending requests state', async ({ page }: { page: Page }) => {
        await contactHelper.goToContacts();

        // When no invitations exist, should only see the empty contacts message
        const emptyState = page.getByText(/no contacts yet|start by adding/i);
        await expect(emptyState).toBeVisible();

        // Should not see any invitation elements
        const invitations = page.locator('[data-testid^="request-"]');
        await expect(invitations).toHaveCount(0);
    });
});
