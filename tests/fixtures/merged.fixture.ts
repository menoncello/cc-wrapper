/**
 * Merged Test Fixtures
 * Story 1.1 - Composed fixtures using mergeTests pattern
 *
 * Pattern: mergeTests() for composing multiple fixture sets
 * Reference: bmad/bmm/testarch/knowledge/fixture-architecture.md
 *
 * Usage:
 * Import this file instead of individual fixtures to get all capabilities
 *
 * @example
 * import { test, expect } from './fixtures/merged.fixture';
 *
 * test('complete workflow test', async ({
 *   authenticatedUser,
 *   defaultWorkspace,
 *   authenticatedPage
 * }) => {
 *   // All fixtures available in single test
 * });
 */

import { mergeTests } from '@playwright/test';
import { test as authTest } from './auth.fixture';
import { test as workspaceTest } from './workspace.fixture';

/**
 * Merged test with all fixture capabilities
 *
 * Combines:
 * - Auth fixtures (authenticatedUser, testUsers, oauthUser, authenticatedPage)
 * - Workspace fixtures (defaultWorkspace, testWorkspaces)
 *
 * This follows the composability pattern from fixture-architecture.md
 * Instead of inheritance, we compose capabilities via mergeTests()
 */
export const test = mergeTests(authTest, workspaceTest);

/**
 * Re-export expect for convenience
 */
export { expect } from '@playwright/test';
