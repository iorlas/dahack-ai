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
  - Add more test files as needed

## Configuration

- `playwright.config.ts` - Main configuration file
- `tsconfig.json` - TypeScript configuration
- `biome.json` - Biome linting and formatting configuration
- `package.json` - Project dependencies and scripts

## Writing Tests

1. Create new test files in the `tests/` directory
2. Use the Playwright test API to write your tests
3. Follow the existing test structure and patterns

Example test structure:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## Best Practices

1. Use page objects for complex pages
2. Keep tests independent and isolated
3. Use meaningful test descriptions
4. Add appropriate assertions
5. Handle async operations properly
6. Use test fixtures when needed
7. Follow TypeScript best practices
8. Keep code formatted and linted using Biome
