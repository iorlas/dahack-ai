import type { Page } from '@playwright/test';
import type { UserCredentials } from './auth';

export interface RoomData {
    name: string;
    members?: string[];
}

export class RoomHelper {
    constructor(private page: Page) { }

    /**
     * Navigate to rooms tab
     */
    async goToRooms(): Promise<void> {
        await this.page.getByTestId('rooms-tab').click();
        await this.page.waitForTimeout(500); // Wait for tab switch
    }

    /**
     * Navigate to contacts tab
     */
    async goToContacts(): Promise<void> {
        await this.page.getByTestId('contacts-tab').click();
        await this.page.waitForTimeout(500); // Wait for tab switch
    }

    /**
     * Open create room modal
     */
    async openCreateRoomModal(): Promise<void> {
        await this.goToRooms();
        await this.page.getByTestId('create-room-button').click();
        await this.page.waitForTimeout(300); // Wait for modal to open
    }

    /**
     * Fill create room form
     */
    async fillCreateRoomForm(roomData: RoomData): Promise<void> {
        const nameInput = this.page.locator('input[placeholder="Room name"]');
        const membersInput = this.page.locator('input[placeholder*="comma separated"]');

        await nameInput.fill(roomData.name);

        if (roomData.members && roomData.members.length > 0) {
            await membersInput.fill(roomData.members.join(', '));
        }
    }

    /**
     * Submit create room form
     */
    async submitCreateRoom(): Promise<void> {
        await this.page.getByRole('button', { name: /create room/i }).click();
    }

    /**
     * Create a room through UI
     */
    async createRoom(roomData: RoomData): Promise<void> {
        await this.openCreateRoomModal();
        await this.fillCreateRoomForm(roomData);
        await this.submitCreateRoom();
        await this.page.waitForTimeout(1000); // Wait for room creation
    }

    /**
     * Cancel room creation
     */
    async cancelCreateRoom(): Promise<void> {
        await this.page.getByRole('button', { name: /cancel/i }).click();
    }

    /**
     * Select a room from the list
     */
    async selectRoom(roomId: number): Promise<void> {
        await this.goToRooms();
        await this.page.getByTestId(`room-${roomId}`).click();
        await this.page.waitForTimeout(500); // Wait for selection
    }

    /**
     * Select a contact from the list
     */
    async selectContact(username: string): Promise<void> {
        await this.goToContacts();
        await this.page.getByTestId(`contact-${username}`).click();
        await this.page.waitForTimeout(500); // Wait for selection
    }

    /**
     * Check if room exists in the list
     */
    async isRoomInList(roomId: number): Promise<boolean> {
        await this.goToRooms();
        const roomElement = this.page.getByTestId(`room-${roomId}`);
        return await roomElement.isVisible().catch(() => false);
    }

    /**
     * Check if room with name exists in the list
     */
    async isRoomWithNameInList(roomName: string): Promise<boolean> {
        await this.goToRooms();
        const roomElement = this.page.locator(`[data-testid^="room-"]`).filter({ hasText: roomName });
        return await roomElement.isVisible().catch(() => false);
    }

    /**
     * Search rooms
     */
    async searchRooms(searchTerm: string): Promise<void> {
        await this.goToRooms();
        const searchInput = this.page.getByTestId('chat-search');
        await searchInput.clear();
        await searchInput.fill(searchTerm);
        await this.page.waitForTimeout(500); // Wait for search results
    }

    /**
     * Get room count
     */
    async getRoomCount(): Promise<number> {
        await this.goToRooms();
        const rooms = await this.page.locator('[data-testid^="room-"]').all();
        return rooms.length;
    }

    /**
     * Leave a room
     */
    async leaveRoom(): Promise<void> {
        await this.page.getByTestId('leave-room-button').click();
        await this.page.waitForTimeout(500); // Wait for leave action
    }

    /**
     * Open room info
     */
    async openRoomInfo(): Promise<void> {
        await this.page.getByTestId('room-info-button').click();
        await this.page.waitForTimeout(300); // Wait for modal
    }

    /**
     * Send a message in current chat
     */
    async sendMessage(message: string): Promise<void> {
        const messageInput = this.page.getByTestId('message-input');
        await messageInput.fill(message);
        await this.page.getByTestId('send-button').click();
        await this.page.waitForTimeout(500); // Wait for message to send
    }

    /**
     * Check if messages container is visible
     */
    async isMessagesContainerVisible(): Promise<boolean> {
        const messagesContainer = this.page.getByTestId('messages-container');
        return await messagesContainer.isVisible().catch(() => false);
    }

    /**
     * Check if message input is visible
     */
    async isMessageInputVisible(): Promise<boolean> {
        const messageInput = this.page.getByTestId('message-input');
        return await messageInput.isVisible().catch(() => false);
    }

    /**
     * Get chat title
     */
    async getChatTitle(): Promise<string> {
        const titleElement = this.page.locator('h3').first();
        return await titleElement.textContent() || '';
    }

    /**
     * Get success message
     */
    async getSuccessMessage(): Promise<string> {
        const successElement = this.page.locator('.bg-green-100, .text-green-700').first();
        return await successElement.textContent() || '';
    }

    /**
     * Get error message
     */
    async getErrorMessage(): Promise<string> {
        const errorElement = this.page.locator('.bg-red-100, .text-red-700').first();
        return await errorElement.textContent() || '';
    }

    /**
     * Create room via API (for test setup)
     */
    async createRoomViaAPI(user: UserCredentials, roomData: RoomData): Promise<any> {
        // First login to get token
        const loginResponse = await fetch('http://localhost:8000/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });

        if (!loginResponse.ok) {
            throw new Error(`Failed to login: ${loginResponse.statusText}`);
        }

        const { access_token } = await loginResponse.json();

        // Create room
        const roomResponse = await fetch('http://localhost:8000/v1/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`,
            },
            body: JSON.stringify({
                name: roomData.name,
                member_usernames: roomData.members,
            }),
        });

        if (!roomResponse.ok) {
            throw new Error(`Failed to create room: ${roomResponse.statusText}`);
        }

        return await roomResponse.json();
    }

    /**
     * Add members to room via API
     */
    async addMembersViaAPI(user: UserCredentials, roomId: number, usernames: string[]): Promise<any> {
        // First login to get token
        const loginResponse = await fetch('http://localhost:8000/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });

        if (!loginResponse.ok) {
            throw new Error(`Failed to login: ${loginResponse.statusText}`);
        }

        const { access_token } = await loginResponse.json();

        // Add members
        const response = await fetch(`http://localhost:8000/v1/rooms/${roomId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`,
            },
            body: JSON.stringify({ usernames }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add members: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Leave room via API
     */
    async leaveRoomViaAPI(user: UserCredentials, roomId: number): Promise<void> {
        // First login to get token
        const loginResponse = await fetch('http://localhost:8000/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });

        if (!loginResponse.ok) {
            throw new Error(`Failed to login: ${loginResponse.statusText}`);
        }

        const { access_token } = await loginResponse.json();

        // Leave room
        const response = await fetch(`http://localhost:8000/v1/rooms/${roomId}/leave`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to leave room: ${response.statusText}`);
        }
    }

    /**
     * Delete room via API
     */
    async deleteRoomViaAPI(user: UserCredentials, roomId: number): Promise<void> {
        // First login to get token
        const loginResponse = await fetch('http://localhost:8000/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });

        if (!loginResponse.ok) {
            throw new Error(`Failed to login: ${loginResponse.statusText}`);
        }

        const { access_token } = await loginResponse.json();

        // Delete room
        const response = await fetch(`http://localhost:8000/v1/rooms/${roomId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${access_token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to delete room: ${response.statusText}`);
        }
    }

    /**
     * Get user's rooms via API
     */
    async getRoomsViaAPI(user: UserCredentials): Promise<any> {
        // First login to get token
        const loginResponse = await fetch('http://localhost:8000/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });

        if (!loginResponse.ok) {
            throw new Error(`Failed to login: ${loginResponse.statusText}`);
        }

        const { access_token } = await loginResponse.json();

        // Get rooms
        const response = await fetch('http://localhost:8000/v1/rooms', {
            headers: {
                'Authorization': `Bearer ${access_token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get rooms: ${response.statusText}`);
        }

        return await response.json();
    }
}
