/**
 * Database Cleanup Fixture
 * Story 1.1 - Provides auto-cleanup for test isolation
 *
 * Pattern: Fixture with automatic teardown
 * Reference: bmad/bmm/testarch/knowledge/fixture-architecture.md
 * Reference: bmad/bmm/testarch/knowledge/test-quality.md
 *
 * CRITICAL: Tests MUST clean up data to prevent pollution
 * This fixture tracks created resources and deletes them after tests
 */

import { test as base } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import type { User, UserProfile, Workspace } from '../factories/user.factory';

// Extend Playwright test with database cleanup fixtures
type DatabaseFixtures = {
  /**
   * Cleanup function to manually delete created resources
   * Automatically called in teardown
   */
  cleanupDatabase: () => Promise<void>;

  /**
   * Seed user in database and track for cleanup
   */
  seedUser: (userData: Partial<User>) => Promise<User>;

  /**
   * Seed workspace in database and track for cleanup
   */
  seedWorkspace: (workspaceData: any) => Promise<any>;

  /**
   * Delete user by ID
   */
  deleteUser: (userId: string) => Promise<void>;

  /**
   * Delete workspace by ID
   */
  deleteWorkspace: (workspaceId: string) => Promise<void>;
};

/**
 * Database fixture with auto-cleanup
 *
 * Tracks all created resources and deletes them after each test
 * Prevents test pollution and ensures parallel-safe execution
 *
 * @example
 * ```typescript
 * import { test } from './fixtures/database.fixture';
 *
 * test('user can register', async ({ seedUser, page }) => {
 *   const user = await seedUser({ email: 'test@example.com' });
 *
 *   // Test logic...
 *
 *   // Cleanup happens automatically
 * });
 * ```
 */
export const test = base.extend<DatabaseFixtures>({
  cleanupDatabase: async ({}, use) => {
    const prisma = new PrismaClient();
    const createdUserIds: string[] = [];
    const createdWorkspaceIds: string[] = [];
    const createdSessionIds: string[] = [];

    const cleanup = async () => {
      try {
        // Delete in reverse dependency order
        // 1. Sessions (depend on users)
        for (const sessionId of createdSessionIds) {
          await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
            // Ignore if already deleted
          });
        }

        // 2. Workspaces (depend on users)
        for (const workspaceId of createdWorkspaceIds) {
          await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => {
            // Ignore if already deleted
          });
        }

        // 3. User profiles (depend on users)
        for (const userId of createdUserIds) {
          await prisma.userProfile.delete({ where: { user_id: userId } }).catch(() => {
            // Ignore if already deleted
          });
        }

        // 4. Users (root entities)
        for (const userId of createdUserIds) {
          await prisma.user.delete({ where: { id: userId } }).catch(() => {
            // Ignore if already deleted
          });
        }

        // Clear arrays
        createdUserIds.length = 0;
        createdWorkspaceIds.length = 0;
        createdSessionIds.length = 0;
      } finally {
        await prisma.$disconnect();
      }
    };

    await use(cleanup);

    // Auto-cleanup after test
    await cleanup();
  },

  seedUser: async ({ cleanupDatabase }, use) => {
    const prisma = new PrismaClient();
    const createdUserIds: string[] = [];

    const seed = async (userData: Partial<User>): Promise<User> => {
      try {
        // Create user via Prisma
        const user = await prisma.user.create({
          data: {
            id: userData.id,
            email: userData.email!,
            password_hash: userData.password_hash || '',
            oauth_provider: userData.oauth_provider as any,
            oauth_id: userData.oauth_id,
            user_type: userData.user_type as any,
          },
        });

        createdUserIds.push(user.id);

        return user as any;
      } catch (error) {
        console.error('Failed to seed user:', error);
        throw error;
      }
    };

    await use(seed);

    // Cleanup tracked users
    for (const userId of createdUserIds) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  },

  seedWorkspace: async ({ cleanupDatabase }, use) => {
    const prisma = new PrismaClient();
    const createdWorkspaceIds: string[] = [];

    const seed = async (workspaceData: any): Promise<any> => {
      try {
        const workspace = await prisma.workspace.create({
          data: {
            id: workspaceData.id,
            user_id: workspaceData.user_id,
            name: workspaceData.name,
            description: workspaceData.description,
            template: workspaceData.template,
            configuration: workspaceData.configuration,
            is_default: workspaceData.is_default || false,
          },
        });

        createdWorkspaceIds.push(workspace.id);

        return workspace;
      } catch (error) {
        console.error('Failed to seed workspace:', error);
        throw error;
      }
    };

    await use(seed);

    // Cleanup tracked workspaces
    for (const workspaceId of createdWorkspaceIds) {
      await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => {});
    }
    await prisma.$disconnect();
  },

  deleteUser: async ({}, use) => {
    const prisma = new PrismaClient();

    const deleteUserFn = async (userId: string) => {
      try {
        await prisma.user.delete({ where: { id: userId } });
      } catch (error) {
        console.error('Failed to delete user:', error);
      } finally {
        await prisma.$disconnect();
      }
    };

    await use(deleteUserFn);
  },

  deleteWorkspace: async ({}, use) => {
    const prisma = new PrismaClient();

    const deleteWorkspaceFn = async (workspaceId: string) => {
      try {
        await prisma.workspace.delete({ where: { id: workspaceId } });
      } catch (error) {
        console.error('Failed to delete workspace:', error);
      } finally {
        await prisma.$disconnect();
      }
    };

    await use(deleteWorkspaceFn);
  },
});

export { expect } from '@playwright/test';

/**
 * Merged fixtures combining database and other capabilities
 * Import this in tests that need database cleanup
 *
 * @example
 * ```typescript
 * import { test, expect } from './fixtures/merged.fixture';
 *
 * test('end-to-end flow', async ({ seedUser, page }) => {
 *   // Database cleanup automatic
 * });
 * ```
 */
