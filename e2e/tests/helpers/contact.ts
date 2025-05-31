import type { Page } from '@playwright/test';
import { type UserCredentials } from './auth';

export interface Contact {
    username: string;
    displayName?: string;
    status?: 'pending' | 'accepted' | 'declined';
}

export class ContactHelper {
    constructor(private page: Page) { }

    /**
     * Navigate to contact management section
     */
    async goToContacts(): Promise<void> {
        await this.page.getByTestId('contacts-tab').click();
    }

    /**
     * Click Add Contact button
     */
    async clickAddContact(): Promise<void> {
        await this.page.getByRole('button', { name: /add contact/i }).click();
    }

    /**
     * Enter username in add contact form
     */
    async enterUsername(username: string): Promise<void> {
        await this.page.getByPlaceholder(/username/i).fill(username);
    }

    /**
     * Send contact request
     */
    async sendContactRequest(): Promise<void> {
        await this.page.getByRole('button', { name: /send contact request/i }).click();
    }

    /**
     * Complete add contact flow
     */
    async addContact(username: string): Promise<void> {
        await this.clickAddContact();
        await this.enterUsername(username);
        await this.sendContactRequest();
    }

    /**
     * Accept a contact request
     */
    async acceptContactRequest(username: string): Promise<void> {
        await this.goToPendingRequests();
        await this.page.getByTestId(`accept-${username}`).click();
    }

    /**
     * Decline a contact request
     */
    async declineContactRequest(username: string): Promise<void> {
        await this.goToPendingRequests();
        await this.page.getByTestId(`decline-${username}`).click();
    }

    /**
     * Remove a contact
     */
    async removeContact(username: string): Promise<void> {
        await this.page.getByTestId(`contact-${username}`).click();
        await this.page.getByRole('button', { name: /remove contact/i }).click();
        await this.page.getByRole('button', { name: /confirm/i }).click();
    }

    /**
     * Search contacts
     */
    async searchContacts(searchTerm: string): Promise<void> {
        await this.page.getByTestId('contact-search').fill(searchTerm);
    }

    /**
     * Navigate to pending requests
     * @deprecated Pending requests are now integrated into the contacts list
     */
    async goToPendingRequests(): Promise<void> {
        // No longer needed - invitations appear directly in contacts list
        await this.goToContacts();
    }

    /**
     * Check if contact exists in contact list
     */
    async isContactInList(username: string): Promise<boolean> {
        try {
            return await this.page.getByTestId(`contact-${username}`).isVisible();
        } catch {
            return false;
        }
    }

    /**
     * Check if there's a contact request from a specific user
     */
    async hasContactRequest(fromUsername: string): Promise<boolean> {
        const requestElement = this.page.getByTestId(`request-${fromUsername}`);
        return await requestElement.isVisible().catch(() => false);
    }

    /**
     * Get error message text
     */
    async getErrorMessage(): Promise<string | null> {
        try {
            const errorElement = this.page.locator('.text-red-600, .error-message');
            return await errorElement.textContent();
        } catch {
            return null;
        }
    }

    /**
     * Get success message text
     */
    async getSuccessMessage(): Promise<string | null> {
        try {
            const successElement = this.page.locator('.text-green-600, .success-message');
            return await successElement.textContent();
        } catch {
            return null;
        }
    }

    /**
     * Create contact request via API (for testing)
     */
    async createContactRequestViaAPI(fromUser: UserCredentials, toUsername: string): Promise<number> {
        // Login to get token
        const loginResponse = await fetch('http://localhost:8000/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fromUser),
        });

        const loginData = await loginResponse.json();
        const token = loginData.access_token;

        // Send contact invitation using the correct endpoint
        const response = await fetch('http://localhost:8000/v1/contacts/invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username: toUsername }),
        });

        const invitationData = await response.json();
        return invitationData.id;
    }

    /**
     * Accept contact request via API (for testing)
     */
    async acceptContactRequestViaAPI(user: UserCredentials, fromUsername: string): Promise<void> {
        // Login to get token
        const loginResponse = await fetch('http://localhost:8000/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });

        const loginData = await loginResponse.json();
        const token = loginData.access_token;

        // Get contacts to find the invitation ID
        const contactsResponse = await fetch('http://localhost:8000/v1/contacts', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        const contactsData = await contactsResponse.json();
        const invitation = contactsData.received_invitations.find(
            (inv: any) => inv.from_user.username === fromUsername
        );

        if (invitation) {
            // Accept contact invitation using the correct endpoint
            await fetch(`http://localhost:8000/v1/contacts/${invitation.id}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
        }
    }

    /**
     * Decline contact request via API (for testing)
     */
    async declineContactRequestViaAPI(user: UserCredentials, fromUsername: string): Promise<void> {
        // Login to get token
        const loginResponse = await fetch('http://localhost:8000/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });

        const loginData = await loginResponse.json();
        const token = loginData.access_token;

        // Get contacts to find the invitation ID
        const contactsResponse = await fetch('http://localhost:8000/v1/contacts', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        const contactsData = await contactsResponse.json();
        const invitation = contactsData.received_invitations.find(
            (inv: any) => inv.from_user.username === fromUsername
        );

        if (invitation) {
            // Reject contact invitation using the correct endpoint
            await fetch(`http://localhost:8000/v1/contacts/${invitation.id}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
        }
    }
}
