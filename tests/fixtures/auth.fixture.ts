/**
 * Authentication Test Fixtures
 * Story 1.1 - Composable fixtures for authentication tests
 *
 * Pattern: Pure function → fixture → mergeTests
 * Reference: bmad/bmm/testarch/knowledge/fixture-architecture.md
 */

import { type APIRequestContext, type Page,test as base } from '@playwright/test';

import {
  createUser,
  createUserWithProfile,
  type User,
  type UserProfile
} from '../factories/user.factory';

/**
 * Extended test context with authentication fixtures
 */
export interface AuthFixtures {
  /**
   * Authenticated user fixture
   * Provides a user account and automatically logs them in
   * Auto-cleanup: Deletes user after test
   */
  authenticatedUser: { user: User; profile: UserProfile; token: string };

  /**
   * Multiple test users fixture
   * Provides array of user accounts
   * Auto-cleanup: Deletes all users after test
   */
  testUsers: User[];

  /**
   * OAuth user fixture
   * Provides user with OAuth provider configured
   * Auto-cleanup: Deletes user after test
   */
  oauthUser: { user: User; provider: 'google' | 'github' };

  /**
   * Authenticated page fixture
   * Provides page with user already logged in
   * Auto-cleanup: Logout and delete user after test
   */
  authenticatedPage: Page;
}

/**
 * Helper: Create user via API
 * Pure function that can be unit tested independently
 */
export async function createUserViaAPI(
  request: APIRequestContext,
  userData: Partial<User> = {}
): Promise<{ user: User; token: string }> {
  const user = createUser(userData);

  const response = await request.post('/api/auth/register', {
    data: {
      email: user.email,
      password: user.password,
      confirmPassword: user.password
    }
  });

  if (!response.ok()) {
    throw new Error(`Failed to create user: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();

  return {
    user: {
      ...user,
      id: body.user.id
    },
    token: body.token
  };
}

/**
 * Helper: Delete user via API
 * Pure function for cleanup
 */
export async function deleteUserViaAPI(
  request: APIRequestContext,
  userId: string,
  token: string
): Promise<void> {
  await request.delete(`/api/auth/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Helper: Login user and return token
 */
export async function loginUserViaAPI(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const response = await request.post('/api/auth/login', {
    data: { email, password }
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }

  const body = await response.json();
  return body.token;
}

/**
 * Helper: Login user via UI
 */
export async function loginUserViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth/login');
  await page.fill('[data-testid="login-email-input"]', email);
  await page.fill('[data-testid="login-password-input"]', password);
  await page.click('[data-testid="login-submit-button"]');
  await page.waitForURL('/dashboard');
}

/**
 * Helper: Logout user via UI
 */
export async function logoutUserViaUI(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu-button"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/auth/login');
}

/**
 * Extend base test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Authenticated User Fixture
   *
   * Creates user, generates token, and provides authenticated context
   * Auto-cleanup after test completion
   *
   * @example
   * test('should access protected route', async ({ authenticatedUser, page }) => {
   *   await page.setExtraHTTPHeaders({
   *     Authorization: `Bearer ${authenticatedUser.token}`
   *   });
   *   await page.goto('/dashboard');
   * });
   */
  authenticatedUser: async ({ request }, use) => {
    // Setup: Create user and profile
    const { user, profile } = createUserWithProfile(
      {},
      {
        onboarding_completed: true,
        tour_completed: true
      }
    );

    const { user: createdUser, token } = await createUserViaAPI(request, user);

    // Create profile via API
    await request.post('/api/auth/profile', {
      data: profile,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Provide to test
    await use({
      user: createdUser,
      profile,
      token
    });

    // Cleanup: Delete user
    await deleteUserViaAPI(request, createdUser.id, token);
  },

  /**
   * Test Users Fixture
   *
   * Creates multiple test users for scenarios requiring user interactions
   * Auto-cleanup after test
   *
   * @example
   * test('should list all users', async ({ testUsers, request }) => {
   *   // testUsers contains 3 users by default
   *   expect(testUsers).toHaveLength(3);
   * });
   */
  testUsers: async ({ request }, use) => {
    // Setup: Create 3 test users
    const userCount = 3;
    const createdUsers: Array<{ user: User; token: string }> = [];

    for (let i = 0; i < userCount; i++) {
      const result = await createUserViaAPI(request);
      createdUsers.push(result);
    }

    // Provide to test
    await use(createdUsers.map(u => u.user));

    // Cleanup: Delete all users
    for (const { user, token } of createdUsers) {
      await deleteUserViaAPI(request, user.id, token);
    }
  },

  /**
   * OAuth User Fixture
   *
   * Creates user with OAuth provider configured
   * Auto-cleanup after test
   *
   * @example
   * test('should access via OAuth', async ({ oauthUser }) => {
   *   expect(oauthUser.user.oauth_provider).toBe('google');
   * });
   */
  oauthUser: async ({ request }, use) => {
    const provider: 'google' | 'github' = 'google';

    // Setup: Create OAuth user
    const user = createUser({
      oauth_provider: provider,
      oauth_id: `google-oauth-${Date.now()}`
    });

    // Simulate OAuth callback to create user
    const response = await request.post('/api/auth/oauth/google/callback', {
      data: {
        code: 'mock-auth-code',
        state: 'valid-state-token',
        profile: {
          email: user.email,
          id: user.oauth_id,
          name: 'OAuth Test User'
        }
      }
    });

    const body = await response.json();
    const token = body.token;

    // Provide to test
    await use({
      user: {
        ...user,
        id: body.user.id
      },
      provider
    });

    // Cleanup
    await deleteUserViaAPI(request, body.user.id, token);
  },

  /**
   * Authenticated Page Fixture
   *
   * Provides page with user already logged in and on dashboard
   * Auto-cleanup: Logout and delete user
   *
   * @example
   * test('should see dashboard', async ({ authenticatedPage }) => {
   *   // User is already logged in
   *   await expect(authenticatedPage.locator('[data-testid="workspace-name"]')).toBeVisible();
   * });
   */
  authenticatedPage: async ({ page, request }, use) => {
    // Setup: Create user
    const { user, token } = await createUserViaAPI(request);

    // Login via UI
    await loginUserViaUI(page, user.email, user.password);

    // Provide authenticated page to test
    await use(page);

    // Cleanup: Logout and delete user
    try {
      await logoutUserViaUI(page);
    } catch {
      // Ignore logout errors (page might have navigated away)
    }

    await deleteUserViaAPI(request, user.id, token);
  }
});

/**
 * Export expect from Playwright for convenience
 */
export { expect } from '@playwright/test';
