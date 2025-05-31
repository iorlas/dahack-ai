import { expect, test, type Page } from '@playwright/test';
import { AuthHelper, type UserCredentials } from './helpers/auth';
import { ContactHelper } from './helpers/contact';
import { RoomHelper, type RoomData } from './helpers/room';

test.describe('Room Management', () => {
    let authHelper: AuthHelper;
    let contactHelper: ContactHelper;
    let roomHelper: RoomHelper;
    let alice: UserCredentials;
    let bob: UserCredentials;
    let charlie: UserCredentials;
    let diana: UserCredentials;

    test.beforeEach(async ({ page }: { page: Page }) => {
        authHelper = new AuthHelper(page);
        contactHelper = new ContactHelper(page);
        roomHelper = new RoomHelper(page);

        // Generate test users
        alice = AuthHelper.generateTestUser('alice');
        bob = AuthHelper.generateTestUser('bob');
        charlie = AuthHelper.generateTestUser('charlie');
        diana = AuthHelper.generateTestUser('diana');

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
            fetch('http://localhost:8000/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(diana),
            }),
        ]);

        // Login as alice
        await authHelper.loginUser(alice);
        await page.waitForURL(/\/chat/, { timeout: 10000 });
    });

    test.describe('Tab Navigation', () => {
        test('should switch between contacts and rooms tabs', async ({ page }: { page: Page }) => {
            // Should start on contacts tab
            await expect(page.getByTestId('contacts-tab')).toHaveClass(/bg-blue-100|text-blue-700/);

            // Switch to rooms tab
            await roomHelper.goToRooms();
            await expect(page.getByTestId('rooms-tab')).toHaveClass(/bg-blue-100|text-blue-700/);

            // Switch back to contacts tab
            await roomHelper.goToContacts();
            await expect(page.getByTestId('contacts-tab')).toHaveClass(/bg-blue-100|text-blue-700/);
        });

        test('should show correct action button for each tab', async ({ page }: { page: Page }) => {
            // On contacts tab, should show add contact button
            await roomHelper.goToContacts();
            await expect(page.getByTestId('add-contact-button')).toBeVisible();

            // On rooms tab, should show create room button
            await roomHelper.goToRooms();
            await expect(page.getByTestId('create-room-button')).toBeVisible();
        });

        test('should show invitation count badge on contacts tab', async ({ page }: { page: Page }) => {
            // Create invitation from another user
            await contactHelper.createContactRequestViaAPI(bob, alice.username);

            await page.reload();

            // Should see badge with count on contacts tab
            const contactsTab = page.getByTestId('contacts-tab');
            await expect(contactsTab).toContainText('1');

            // Badge should be visible with orange color
            const badge = contactsTab.locator('.bg-orange-500');
            await expect(badge).toBeVisible();
        });
    });

    test.describe('Multi-user Room Creation', () => {
        test('should successfully create a room without members', async ({ page }: { page: Page }) => {
            const roomData: RoomData = { name: 'Test Room' };

            await roomHelper.createRoom(roomData);

            // Should see success message
            const successMessage = await roomHelper.getSuccessMessage();
            expect(successMessage).toMatch(/room.*created successfully/i);

            // Room should appear in list
            expect(await roomHelper.isRoomWithNameInList(roomData.name)).toBeTruthy();
        });

        test('should successfully create a room with members', async ({ page }: { page: Page }) => {
            const roomData: RoomData = {
                name: 'Team Room',
                members: [bob.username, charlie.username]
            };

            await roomHelper.createRoom(roomData);

            // Should see success message
            const successMessage = await roomHelper.getSuccessMessage();
            expect(successMessage).toMatch(/room.*created successfully/i);

            // Room should appear in list
            expect(await roomHelper.isRoomWithNameInList(roomData.name)).toBeTruthy();
        });

        test('should show error when creating room without name', async ({ page }: { page: Page }) => {
            await roomHelper.openCreateRoomModal();
            await roomHelper.submitCreateRoom();

            // Should see error message
            const errorMessage = await roomHelper.getErrorMessage();
            expect(errorMessage).toMatch(/please enter a room name/i);
        });

        test('should cancel room creation', async ({ page }: { page: Page }) => {
            const initialRoomCount = await roomHelper.getRoomCount();

            await roomHelper.openCreateRoomModal();
            await roomHelper.fillCreateRoomForm({ name: 'Test Room' });
            await roomHelper.cancelCreateRoom();

            // Room count should remain the same
            expect(await roomHelper.getRoomCount()).toBe(initialRoomCount);
        });
    });

    test.describe('Room Selection and Chat Interface', () => {
        test('should select and display room chat interface', async ({ page }: { page: Page }) => {
            // Create room via API first
            const room = await roomHelper.createRoomViaAPI(alice, { name: 'Test Chat Room' });

            await page.reload();
            await roomHelper.selectRoom(room.id);

            // Should show room chat interface
            expect(await roomHelper.isMessagesContainerVisible()).toBeTruthy();
            expect(await roomHelper.isMessageInputVisible()).toBeTruthy();

            // Should show correct title
            const title = await roomHelper.getChatTitle();
            expect(title).toBe('Test Chat Room');

            // Should show room action buttons
            await expect(page.getByTestId('room-info-button')).toBeVisible();
            await expect(page.getByTestId('leave-room-button')).toBeVisible();
        });

        test('should display member count in room subtitle', async ({ page }: { page: Page }) => {
            // Create room with members via API
            const room = await roomHelper.createRoomViaAPI(alice, {
                name: 'Multi User Room',
                members: [bob.username]
            });

            await page.reload();
            await roomHelper.selectRoom(room.id);

            // Should show member count (alice + bob = 2 members)
            const subtitle = page.locator('p').filter({ hasText: /\d+ members/ });
            await expect(subtitle).toBeVisible();
        });
    });

    test.describe('1-on-1 Contact Chat', () => {
        test('should select contact and display 1-on-1 chat interface', async ({ page }: { page: Page }) => {
            // Set up contact relationship
            await contactHelper.createContactRequestViaAPI(alice, bob.username);
            await contactHelper.acceptContactRequestViaAPI(bob, alice.username);

            await page.reload();
            await roomHelper.selectContact(bob.username);

            // Should show chat interface
            expect(await roomHelper.isMessagesContainerVisible()).toBeTruthy();
            expect(await roomHelper.isMessageInputVisible()).toBeTruthy();

            // Should show correct title
            const title = await roomHelper.getChatTitle();
            expect(title).toBe(bob.username);

            // Should NOT show room action buttons for 1-on-1 chat
            await expect(page.getByTestId('room-info-button')).not.toBeVisible();
            await expect(page.getByTestId('leave-room-button')).not.toBeVisible();
        });

        test('should show contact since date in 1-on-1 chat', async ({ page }: { page: Page }) => {
            // Set up contact relationship
            await contactHelper.createContactRequestViaAPI(alice, bob.username);
            await contactHelper.acceptContactRequestViaAPI(bob, alice.username);

            await page.reload();
            await roomHelper.selectContact(bob.username);

            // Should show "Contact since" subtitle
            const subtitle = page.locator('p').filter({ hasText: /contact since/i });
            await expect(subtitle).toBeVisible();
        });
    });

    test.describe('Room Search and Filtering', () => {
        test('should search rooms by name', async ({ page }: { page: Page }) => {
            // Create multiple rooms
            await roomHelper.createRoomViaAPI(alice, { name: 'Development Team' });
            await roomHelper.createRoomViaAPI(alice, { name: 'Marketing Team' });
            await roomHelper.createRoomViaAPI(alice, { name: 'General Chat' });

            await page.reload();
            await roomHelper.searchRooms('Development');

            // Should show Development Team room
            expect(await roomHelper.isRoomWithNameInList('Development Team')).toBeTruthy();
        });

        test('should handle empty room search results', async ({ page }: { page: Page }) => {
            await roomHelper.createRoomViaAPI(alice, { name: 'Test Room' });

            await page.reload();
            await roomHelper.searchRooms('NonexistentRoom');

            // Should show no rooms found message or empty list
            const emptyState = page.getByText(/no rooms found/i);
            await expect(emptyState).toBeVisible();
        });
    });

    test.describe('Room Management Actions', () => {
        test('should leave a room', async ({ page }: { page: Page }) => {
            // Create room with member
            const room = await roomHelper.createRoomViaAPI(alice, {
                name: 'Leaveable Room',
                members: [bob.username]
            });

            await page.reload();
            await roomHelper.selectRoom(room.id);
            await roomHelper.leaveRoom();

            // Room should no longer be in list
            expect(await roomHelper.isRoomInList(room.id)).toBeFalsy();
        });

        test('should open room info', async ({ page }: { page: Page }) => {
            const room = await roomHelper.createRoomViaAPI(alice, { name: 'Info Room' });

            await page.reload();
            await roomHelper.selectRoom(room.id);
            await roomHelper.openRoomInfo();

            // Room info modal/section should be visible
            // This would need to be implemented in the UI
        });
    });

    test.describe('Empty States', () => {
        test('should show empty state when no rooms exist', async ({ page }: { page: Page }) => {
            await roomHelper.goToRooms();

            // Should see empty state message
            const emptyState = page.getByText(/no rooms yet|create your first one/i);
            await expect(emptyState).toBeVisible();
        });

        test('should show welcome message when no chat is selected', async ({ page }: { page: Page }) => {
            // Should see welcome message
            const welcomeMessage = page.getByText(/welcome to dahack ai chat/i);
            await expect(welcomeMessage).toBeVisible();

            const instructionMessage = page.getByText(/select a contact or room to start chatting/i);
            await expect(instructionMessage).toBeVisible();
        });
    });

    test.describe('Message Input Placeholder', () => {
        test('should show correct placeholder for room chat', async ({ page }: { page: Page }) => {
            const room = await roomHelper.createRoomViaAPI(alice, { name: 'Test Room' });

            await page.reload();
            await roomHelper.selectRoom(room.id);

            const messageInput = page.getByTestId('message-input');
            await expect(messageInput).toHaveAttribute('placeholder', /type a message in test room/i);
        });

        test('should show correct placeholder for contact chat', async ({ page }: { page: Page }) => {
            // Set up contact
            await contactHelper.createContactRequestViaAPI(alice, bob.username);
            await contactHelper.acceptContactRequestViaAPI(bob, alice.username);

            await page.reload();
            await roomHelper.selectContact(bob.username);

            const messageInput = page.getByTestId('message-input');
            await expect(messageInput).toHaveAttribute('placeholder', new RegExp(`type a message to ${bob.username}`, 'i'));
        });
    });

    test.describe('Room and Contact Selection States', () => {
        test('should highlight selected room', async ({ page }: { page: Page }) => {
            const room = await roomHelper.createRoomViaAPI(alice, { name: 'Highlighted Room' });

            await page.reload();
            await roomHelper.selectRoom(room.id);

            // Selected room should have highlighted styling
            const roomElement = page.getByTestId(`room-${room.id}`);
            await expect(roomElement).toHaveClass(/bg-blue-100|border-blue-200/);
        });

        test('should highlight selected contact', async ({ page }: { page: Page }) => {
            // Set up contact
            await contactHelper.createContactRequestViaAPI(alice, bob.username);
            await contactHelper.acceptContactRequestViaAPI(bob, alice.username);

            await page.reload();
            await roomHelper.selectContact(bob.username);

            // Selected contact should have highlighted styling
            const contactElement = page.getByTestId(`contact-${bob.username}`);
            await expect(contactElement).toHaveClass(/bg-blue-100|border-blue-200/);
        });

        test('should switch selection between room and contact', async ({ page }: { page: Page }) => {
            // Set up both room and contact
            const room = await roomHelper.createRoomViaAPI(alice, { name: 'Switch Test Room' });
            await contactHelper.createContactRequestViaAPI(alice, bob.username);
            await contactHelper.acceptContactRequestViaAPI(bob, alice.username);

            await page.reload();

            // Select room first
            await roomHelper.selectRoom(room.id);
            let title = await roomHelper.getChatTitle();
            expect(title).toBe('Switch Test Room');

            // Switch to contact
            await roomHelper.selectContact(bob.username);
            title = await roomHelper.getChatTitle();
            expect(title).toBe(bob.username);

            // Switch back to room
            await roomHelper.selectRoom(room.id);
            title = await roomHelper.getChatTitle();
            expect(title).toBe('Switch Test Room');
        });
    });

    test.describe('Room Count Display', () => {
        test('should display correct room count in tab', async ({ page }: { page: Page }) => {
            // Initially should be 0 rooms
            await roomHelper.goToRooms();
            const initialTab = page.getByTestId('rooms-tab');
            await expect(initialTab).toContainText('Rooms (0)');

            // Create a room
            await roomHelper.createRoomViaAPI(alice, { name: 'Count Test Room' });

            await page.reload();
            await roomHelper.goToRooms();

            // Should show 1 room
            const updatedTab = page.getByTestId('rooms-tab');
            await expect(updatedTab).toContainText('Rooms (1)');
        });
    });
});
