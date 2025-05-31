# End-to-End Tests

This directory contains end-to-end tests for the DAHack AI application using Playwright and TypeScript.

## Setup

1. Install pnpm if you haven't already:
```bash
npm install -g pnpm@8.15.4
```

2. Install dependencies:
```bash
pnpm install
```

3. Install Playwright browsers:
```bash
pnpm exec playwright install
```

## Running Tests

- Run all tests:
```bash
pnpm test
```

- Run tests with UI mode (for debugging):
```bash
pnpm test:ui
```

- Run tests in debug mode:
```bash
pnpm test:debug
```

- Run specific test suite:
```bash
pnpm test --grep "User Registration"
pnpm test --grep "User Login"
```

## Code Quality

- Format code:
```bash
pnpm format
```

- Lint code:
```bash
pnpm lint
```

- Check and fix code:
```bash
pnpm check
```

## Test Structure

- `tests/` - Contains all test files
  - `home.spec.ts` - Tests for the home page
  - `user-registration.spec.ts` - Tests for user registration functionality
  - `user-login.spec.ts` - Tests for user login functionality
  - `helpers/` - Test helper utilities
    - `auth.ts` - Authentication helper functions and utilities
  - `contact-management.spec.ts` - Contact invitation and management tests
  - `room-management.spec.ts` - **NEW** Room and chat functionality tests

## Configuration

- `playwright.config.ts` - Main configuration file
- `tsconfig.json` - TypeScript configuration
- `biome.json` - Biome linting and formatting configuration
- `package.json` - Project dependencies and scripts

## Writing Tests

1. Create new test files in the `tests/` directory
2. Use the Playwright test API to write your tests
3. Follow the existing test structure and patterns
4. Use helper functions from `tests/helpers/` for common operations

Example test structure:
```typescript
import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';

test.describe('Feature Name', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## Authentication Tests

### User Registration Tests (`user-registration.spec.ts`)

Tests cover:
- ✅ Display registration form
- ✅ Successful user registration
- ✅ Password mismatch validation
- ✅ Empty field validation (username, password)
- ✅ Duplicate username handling
- ✅ Weak password validation
- ✅ Navigation between login/registration
- ✅ Special characters in username
- ✅ Username length validation

### User Login Tests (`user-login.spec.ts`)

Tests cover:
- ✅ Display login form
- ✅ Successful login with valid credentials
- ✅ Invalid username/password handling
- ✅ Empty field validation
- ✅ Navigation between login/registration
- ✅ Session persistence after page refresh
- ✅ Case insensitive username handling
- ✅ Logout functionality

### AuthHelper Utilities (`helpers/auth.ts`)

The AuthHelper class provides reusable methods for:
- Navigation (goToRegistration, goToLogin)
- Form filling (fillRegistrationForm, fillLoginForm)
- Form submission (submitRegistration, submitLogin)
- Complete workflows (registerUser, loginUser)
- User generation (generateTestUser)
- Session management (logout, isLoggedIn)

Usage example:
```typescript
const authHelper = new AuthHelper(page);
const user = AuthHelper.generateTestUser();
await authHelper.registerUser(user);
await authHelper.loginUser(user);
```

## Test Data Management

- Use `AuthHelper.generateTestUser()` to create unique test users
- Timestamps and random numbers ensure test isolation
- Tests clean up after themselves automatically

## Skype-like UI Architecture

The application follows **Skype UI patterns** with:
- **Chat Rooms Interface** - Main interface after login
- **Contacts/Chat List** - Left sidebar with chats and contacts
- **Message Area** - Right side for active conversations
- **No Dashboard/Profile Pages** - Direct access to chat functionality

### UI Element Detection

The `AuthHelper.isLoggedIn()` method detects Skype-like elements:
- `[data-testid="chat-list"]` - Chat list sidebar
- `[data-testid="contacts-list"]` - Contacts sidebar
- `[data-testid="chat-rooms"]` - Chat rooms interface
- `[data-testid="message-area"]` - Message/conversation area
- `.sidebar, .chat-sidebar, .contacts-sidebar` - Sidebar containers
- `.chat-interface, .messaging-area` - Main chat interface
- `.user-menu, .profile-menu` - User menu (minimal profile access)

## Requirements Coverage

Based on `REQUIREMENTS.md`, the tests validate:
- ✅ User self-registration with username and password (twice)
- ✅ All users stored in RDBMS (tested through successful registration/login)
- ✅ No IDP or email verification required
- ✅ **Skype-like chat UI** with chat list and message areas (up to 500-1000 concurrent users)
- ✅ **Chat rooms and contacts management** (interface detection)

## Best Practices

1. Use the AuthHelper for authentication-related operations
2. Generate unique test users to avoid conflicts
3. Keep tests independent and isolated
4. Use meaningful test descriptions
5. Add appropriate assertions with regex patterns for flexibility
6. Handle async operations properly
7. Use test fixtures when needed
8. Follow TypeScript best practices
9. Keep code formatted and linted using Biome
10. Test both positive and negative scenarios
12. **Test for Skype-like UI elements** instead of generic dashboards

## Troubleshooting

- If tests fail due to timing issues, check wait conditions
- For authentication failures, verify the UI selectors match your Skype-like implementation
- Use `pnpm test:ui` to debug test execution visually
- Check browser console for JavaScript errors during test runs
- **Ensure chat interface elements have proper data-testid attributes** for reliable testing

## Room Management Tests

The new `room-management.spec.ts` covers:

### 🔀 **Tab Navigation**
- Switching between contacts and rooms tabs
- Correct action button display for each tab

### 🏢 **Multi-user Room Creation**
- Creating rooms without members
- Creating rooms with initial members
- Validation errors for empty room names
- Canceling room creation

### 💬 **Chat Interface**
- **1-on-1 Contact Chats**: Clicking contacts opens 1-on-1 chat
- **Multi-user Rooms**: Room selection and group chat interface
- Proper message input placeholders
- Room action buttons (Room Info, Leave Room)

### 🔍 **Search and Filtering**
- Room search by name
- Empty search results handling
- Contact vs room filtering

### ⚙️ **Room Management Actions**
- Leaving rooms
- Room info display
- Member count display

### 🎨 **UI States**
- Empty states for no rooms/contacts
- Selection highlighting
- Welcome messages
- Proper room/contact count display

### 🔄 **Selection Management**
- Switching between rooms and contacts
- Maintaining selection state
- Proper chat title updates

## Test Data Setup

Tests use the `RoomHelper` class for:
- Creating rooms via API for test setup
- Managing room membership
- Room navigation and interaction
- Message sending simulation

The helper supports both UI interactions and API calls for efficient test setup.

## Key Features Tested

✅ **Two Chat Types**:
- 1-on-1 contact chats (click contact → opens direct chat)
- Multi-user rooms (group chats with multiple participants)

✅ **Room Creation**:
- Empty rooms
- Rooms with initial members
- Error handling

✅ **Navigation**:
- Tab switching (Contacts ↔ Rooms)
- Chat selection and highlighting
- Search functionality

✅ **Chat Interface**:
- Proper message areas
- Context-appropriate placeholders
- Room-specific action buttons

The tests ensure the Skype-like chat experience works correctly for both direct messaging and group communication.
