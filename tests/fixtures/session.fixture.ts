/**
 * Session Test Fixtures
 * Story 1.2 - Composable fixtures for session persistence tests
 *
 * Pattern: Pure function → fixture → mergeTests
 * Reference: bmad/bmm/testarch/knowledge/fixture-architecture.md
 */

import { type APIRequestContext, type Page,test as base } from '@playwright/test';

import {
  createCheckpoint,
  createCheckpoints,
  createMinimalSessionState,
  createSession,
  createSessionApiData,
  createSessions,
  type Session,
  type SessionCheckpoint,
  type SessionWorkspaceState
} from '../factories/session.factory';
import { createUserViaAPI, deleteUserViaAPI, type User } from './auth.fixture';

/**
 * Extended test context with session fixtures
 */
export interface SessionFixtures {
  /**
   * Session fixture with auto-save capabilities
   * Provides a session with deterministic auto-save behavior
   * Auto-cleanup: Deletes session and user after test
   */
  sessionWithAutoSave: {
    user: User;
    session: Session;
    token: string;
    autoSaveTrigger: () => Promise<void>;
  };

  /**
   * Multiple sessions fixture
   * Provides array of sessions for testing session management
   * Auto-cleanup: Deletes all sessions and users after test
   */
  multipleSessions: {
    users: User[];
    sessions: Session[];
    tokens: string[];
  };

  /**
   * Session with checkpoints fixture
   * Provides session with multiple checkpoints for testing restore functionality
   * Auto-cleanup: Deletes session, checkpoints, and user after test
   */
  sessionWithCheckpoints: {
    user: User;
    session: Session;
    checkpoints: SessionCheckpoint[];
    token: string;
  };

  /**
   * Session with corrupted data fixture
   * Provides session with simulated corruption for testing recovery
   * Auto-cleanup: Deletes session and user after test
   */
  corruptedSession: {
    user: User;
    session: Session;
    token: string;
  };

  /**
   * Workspace state fixture
   * Provides realistic workspace state for testing
   */
  workspaceState: SessionWorkspaceState;

  /**
   * Minimal workspace state fixture
   * Provides minimal but valid workspace state for basic tests
   */
  minimalWorkspaceState: SessionWorkspaceState;
}

/**
 * Helper: Create session via API
 * Pure function that can be unit tested independently
 */
export async function createSessionViaAPI(
  request: APIRequestContext,
  userId: string,
  token: string,
  sessionData: Partial<Session> = {}
): Promise<Session> {
  const session = createSession(userId, sessionData);
  const apiData = createSessionApiData({
    workspace_state: session.workspace_state,
    encryption: session.encrypted ? {
      algorithm: session.encryption_metadata.algorithm,
      keyDerivation: session.encryption_metadata.keyDerivation
    } : undefined
  });

  const response = await request.post('/api/sessions', {
    data: apiData,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok()) {
    throw new Error(`Failed to create session: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();
  return {
    ...session,
    id: body.id,
    created_at: body.created_at,
    updated_at: body.updated_at
  };
}

/**
 * Helper: Delete session via API
 * Pure function for cleanup
 */
export async function deleteSessionViaAPI(
  request: APIRequestContext,
  sessionId: string,
  token: string
): Promise<void> {
  await request.delete(`/api/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Helper: Create checkpoint via API
 */
export async function createCheckpointViaAPI(
  request: APIRequestContext,
  sessionId: string,
  token: string,
  checkpointData: Partial<SessionCheckpoint> = {}
): Promise<SessionCheckpoint> {
  const checkpoint = createCheckpoint(sessionId, checkpointData);

  const response = await request.post(`/api/sessions/${sessionId}/checkpoints`, {
    data: {
      name: checkpoint.name,
      description: checkpoint.description,
      tags: checkpoint.tags,
      priority: checkpoint.priority,
      workspace_state: checkpoint.workspace_state
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok()) {
    throw new Error(`Failed to create checkpoint: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();
  return {
    ...checkpoint,
    id: body.id,
    created_at: body.created_at
  };
}

/**
 * Helper: Trigger auto-save via API
 * Forces immediate session save for deterministic testing
 */
export async function triggerAutoSaveViaAPI(
  request: APIRequestContext,
  sessionId: string,
  token: string,
  workspaceState: SessionWorkspaceState
): Promise<void> {
  const response = await request.put(`/api/sessions/${sessionId}`, {
    data: {
      workspace_state,
      force_save: true // Flag to trigger immediate save for testing
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok()) {
    throw new Error(`Failed to trigger auto-save: ${response.status()} ${await response.text()}`);
  }
}

/**
 * Helper: Simulate corrupted session
 * Creates session with invalid data for testing recovery scenarios
 */
export async function createCorruptedSessionViaAPI(
  request: APIRequestContext,
  userId: string,
  token: string
): Promise<Session> {
  const session = createSession(userId, {
    workspace_state: {
      files: [{ path: '', content: '', lastModified: 'invalid-date' }],
      terminal: { history: [], currentDirectory: '', activeProcesses: [] },
      browser: { openTabs: [], activeTab: '', bookmarks: [] },
      aiConversations: { messages: [], context: '', totalTokens: 0 }
    },
    checksum: 'invalid-checksum'
  });

  const response = await request.post('/api/sessions', {
    data: createSessionApiData({ workspace_state: session.workspace_state }),
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok()) {
    throw new Error(`Failed to create corrupted session: ${response.status()}`);
  }

  const body = await response.json();
  return {
    ...session,
    id: body.id,
    created_at: body.created_at,
    updated_at: body.updated_at
  };
}

/**
 * Helper: Setup auto-save interception in page
 * Provides deterministic auto-save behavior for E2E tests
 */
export async function setupAutoSaveInterception(
  page: Page,
  sessionId: string,
  token: string
): Promise<() => Promise<void>> {
  // Set up headers for authenticated requests
  await page.setExtraHTTPHeaders({
    Authorization: `Bearer ${token}`
  });

  // Function to trigger auto-save deterministically
  return async () => {
    await page.evaluate(
      ({ sessionId, forceSave }) => {
        // Dispatch custom event to trigger auto-save in the application
        window.dispatchEvent(
          new CustomEvent('test:trigger-autosave', {
            detail: { sessionId, forceSave }
          })
        );
      },
      { sessionId, forceSave: true }
    );

    // Wait for the save response to complete
    await page.waitForResponse('**/api/sessions/**', {
      timeout: 10000 // Reasonable timeout for immediate save
    });
  };
}

/**
 * Extend base test with session fixtures
 */
export const test = base.extend<SessionFixtures>({
  /**
   * Session with Auto-Save Fixture
   *
   * Creates user, session, and provides deterministic auto-save trigger
   * Auto-cleanup after test completion
   *
   * @example
   * test('should auto-save session', async ({ sessionWithAutoSave, page }) => {
   *   await sessionWithAutoSave.autoSaveTrigger();
   *   // Verify session was saved
   * });
   */
  sessionWithAutoSave: async ({ page, request }, use) => {
    // Setup: Create user and session
    const { user, token } = await createUserViaAPI(request);
    const session = await createSessionViaAPI(request, user.id, token);

    // Setup deterministic auto-save trigger
    const autoSaveTrigger = await setupAutoSaveInterception(page, session.id, token);

    // Provide to test
    await use({
      user,
      session,
      token,
      autoSaveTrigger
    });

    // Cleanup: Delete session and user
    await deleteSessionViaAPI(request, session.id, token);
    await deleteUserViaAPI(request, user.id, token);
  },

  /**
   * Multiple Sessions Fixture
   *
   * Creates multiple users with sessions for testing session management
   * Auto-cleanup after test
   *
   * @example
   * test('should list user sessions', async ({ multipleSessions, request }) => {
   *   const { sessions, tokens } = multipleSessions;
   *   expect(sessions).toHaveLength(3);
   * });
   */
  multipleSessions: async ({ request }, use) => {
    const sessionCount = 3;
    const createdData: {
      users: User[];
      sessions: Session[];
      tokens: string[];
    } = {
      users: [],
      sessions: [],
      tokens: []
    };

    // Setup: Create multiple users with sessions
    for (let i = 0; i < sessionCount; i++) {
      const { user, token } = await createUserViaAPI(request);
      const session = await createSessionViaAPI(request, user.id, token);

      createdData.users.push(user);
      createdData.sessions.push(session);
      createdData.tokens.push(token);
    }

    // Provide to test
    await use(createdData);

    // Cleanup: Delete all sessions and users
    for (let i = 0; i < sessionCount; i++) {
      await deleteSessionViaAPI(request, createdData.sessions[i].id, createdData.tokens[i]);
      await deleteUserViaAPI(request, createdData.users[i].id, createdData.tokens[i]);
    }
  },

  /**
   * Session with Checkpoints Fixture
   *
   * Creates session with multiple checkpoints for testing restore functionality
   * Auto-cleanup after test
   *
   * @example
   * test('should restore from checkpoint', async ({ sessionWithCheckpoints }) => {
   *   const { checkpoints } = sessionWithCheckpoints;
   *   expect(checkpoints).toHaveLength(3);
   * });
   */
  sessionWithCheckpoints: async ({ request }, use) => {
    // Setup: Create user and session
    const { user, token } = await createUserViaAPI(request);
    const session = await createSessionViaAPI(request, user.id, token);

    // Create multiple checkpoints
    const checkpoints = [];
    const checkpointCount = 3;
    for (let i = 0; i < checkpointCount; i++) {
      const checkpoint = await createCheckpointViaAPI(request, session.id, token, {
        name: `Checkpoint ${i + 1}`,
        description: `Test checkpoint number ${i + 1}`,
        priority: i === 0 ? 'high' : 'medium'
      });
      checkpoints.push(checkpoint);
    }

    // Provide to test
    await use({
      user,
      session,
      checkpoints,
      token
    });

    // Cleanup: Delete checkpoints, session, and user
    for (const checkpoint of checkpoints) {
      await request.delete(`/api/sessions/${session.id}/checkpoints/${checkpoint.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    await deleteSessionViaAPI(request, session.id, token);
    await deleteUserViaAPI(request, user.id, token);
  },

  /**
   * Corrupted Session Fixture
   *
   * Creates session with corrupted data for testing recovery scenarios
   * Auto-cleanup after test
   *
   * @example
   * test('should recover from corrupted session', async ({ corruptedSession }) => {
   *   const { session } = corruptedSession;
   *   // Test recovery logic
   * });
   */
  corruptedSession: async ({ request }, use) => {
    // Setup: Create user and corrupted session
    const { user, token } = await createUserViaAPI(request);
    const session = await createCorruptedSessionViaAPI(request, user.id, token);

    // Provide to test
    await use({
      user,
      session,
      token
    });

    // Cleanup: Delete session and user
    await deleteSessionViaAPI(request, session.id, token);
    await deleteUserViaAPI(request, user.id, token);
  },

  /**
   * Workspace State Fixture
   *
   * Provides realistic workspace state for testing
   *
   * @example
   * test('should handle complex workspace state', async ({ workspaceState }) => {
   *   expect(workspaceState.files).toBeDefined();
   *   expect(workspaceState.terminal).toBeDefined();
   * });
   */
  workspaceState: async ({}, use) => {
    const workspaceState = createSessionApiData().workspace_state;
    await use(workspaceState);
  },

  /**
   * Minimal Workspace State Fixture
   *
   * Provides minimal but valid workspace state for basic tests
   *
   * @example
   * test('should handle minimal state', async ({ minimalWorkspaceState }) => {
   *   expect(minimalWorkspaceState.files).toHaveLength(1);
   * });
   */
  minimalWorkspaceState: async ({}, use) => {
    const minimalState = createMinimalSessionState();
    await use(minimalState);
  }
});

/**
 * Export expect from Playwright for convenience
 */
export { expect } from '@playwright/test';