/**
 * Workspace Test Fixtures
 * Story 1.1 - Composable fixtures for workspace tests
 *
 * Pattern: Pure function → fixture → mergeTests
 * Reference: bmad/bmm/testarch/knowledge/fixture-architecture.md
 */

import { type APIRequestContext,test as base } from '@playwright/test';

import { createWorkspace, createWorkspaces, type Workspace } from '../factories/workspace.factory';

/**
 * Extended test context with workspace fixtures
 */
export interface WorkspaceFixtures {
  /**
   * Default workspace fixture
   * Provides a workspace and sets it as default for authenticated user
   * Auto-cleanup: Deletes workspace after test
   */
  defaultWorkspace: Workspace;

  /**
   * Multiple workspaces fixture
   * Provides array of workspaces for the authenticated user
   * Auto-cleanup: Deletes all workspaces after test
   */
  testWorkspaces: Workspace[];
}

/**
 * Helper: Create workspace via API
 * Pure function that can be unit tested independently
 */
export async function createWorkspaceViaAPI(
  request: APIRequestContext,
  userId: string,
  token: string,
  workspaceData: Partial<Workspace> = {}
): Promise<Workspace> {
  const workspace = createWorkspace(userId, workspaceData);

  const response = await request.post('/api/workspaces', {
    data: {
      name: workspace.name,
      description: workspace.description,
      template: workspace.template,
      userType: 'solo'
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok()) {
    throw new Error(`Failed to create workspace: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();

  return {
    ...workspace,
    id: body.workspace.id,
    configuration: body.workspace.configuration
  };
}

/**
 * Helper: Delete workspace via API
 * Pure function for cleanup
 */
export async function deleteWorkspaceViaAPI(
  request: APIRequestContext,
  workspaceId: string,
  token: string
): Promise<void> {
  await request.delete(`/api/workspaces/${workspaceId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Helper: Set workspace as default
 */
export async function setDefaultWorkspaceViaAPI(
  request: APIRequestContext,
  workspaceId: string,
  token: string
): Promise<void> {
  await request.put('/api/auth/profile', {
    data: {
      defaultWorkspaceId: workspaceId
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Extend base test with workspace fixtures
 */
export const test = base.extend<WorkspaceFixtures>({
  /**
   * Default Workspace Fixture
   *
   * Creates a workspace and sets it as default for the user
   * Requires authenticatedUser fixture from auth.fixture.ts
   * Auto-cleanup after test
   *
   * @example
   * import { test } from './fixtures/merged.fixture';
   *
   * test('should load default workspace', async ({ authenticatedUser, defaultWorkspace, page }) => {
   *   await page.goto('/dashboard');
   *   await expect(page.locator('[data-testid="workspace-name"]')).toHaveText(defaultWorkspace.name);
   * });
   */
  defaultWorkspace: async ({ request }, use, testInfo) => {
    // NOTE: This fixture requires authenticatedUser from auth.fixture
    // When composing, use mergeTests() to combine fixtures

    // For now, we'll create a minimal setup
    // In actual usage, this would use the authenticatedUser fixture

    const userId = 'fixture-user-id'; // Replace with actual user from authenticatedUser
    const token = 'fixture-token'; // Replace with actual token

    // Setup: Create default workspace
    const workspace = await createWorkspaceViaAPI(request, userId, token, {
      is_default: true,
      template: 'react'
    });

    // Set as default in profile
    await setDefaultWorkspaceViaAPI(request, workspace.id, token);

    // Provide to test
    await use(workspace);

    // Cleanup: Delete workspace
    await deleteWorkspaceViaAPI(request, workspace.id, token);
  },

  /**
   * Test Workspaces Fixture
   *
   * Creates multiple workspaces for testing workspace management
   * Requires authenticatedUser fixture
   * Auto-cleanup after test
   *
   * @example
   * import { test } from './fixtures/merged.fixture';
   *
   * test('should list all workspaces', async ({ testWorkspaces }) => {
   *   expect(testWorkspaces).toHaveLength(3);
   * });
   */
  testWorkspaces: async ({ request }, use) => {
    const userId = 'fixture-user-id'; // Replace with actual user
    const token = 'fixture-token'; // Replace with actual token

    // Setup: Create 3 workspaces
    const workspaceCount = 3;
    const createdWorkspaces: Workspace[] = [];

    for (let i = 0; i < workspaceCount; i++) {
      const workspace = await createWorkspaceViaAPI(request, userId, token, {
        is_default: i === 0, // First workspace is default
        template: ['react', 'nodejs', 'python'][i] as any
      });
      createdWorkspaces.push(workspace);
    }

    // Provide to test
    await use(createdWorkspaces);

    // Cleanup: Delete all workspaces
    for (const workspace of createdWorkspaces) {
      await deleteWorkspaceViaAPI(request, workspace.id, token);
    }
  }
});

/**
 * Export expect from Playwright for convenience
 */
export { expect } from '@playwright/test';
