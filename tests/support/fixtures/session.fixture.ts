/**
 * Session Test Fixtures
 * Provides session-related test fixtures with auto-cleanup
 *
 * Follows fixture-architecture.md knowledge base patterns:
 * - Uses Playwright's test.extend() pattern
 * - Auto-cleanup in teardown phase
 * - Composable fixtures (can use other fixtures)
 * - Type-safe fixtures
 * - One concern per fixture
 */

import { faker } from '@faker-js/faker';
import { type APIRequestContext,test as base } from '@playwright/test';

import {
  type Checkpoint,
  createCheckpoint,
  createCheckpoints,
  createSession,
  createSessions,
  createSessionState,
  type Session,
  type SessionState
} from '../factories/session.factory';

// Types for our extended fixtures
export interface SessionTestFixtures {
  authenticatedUser: {
    id: string;
    email: string;
    token: string;
    name: string;
  };
  sessionService: {
    createSession: (overrides?: Partial<Session>) => Promise<Session>;
    createSessions: (count: number, overrides?: Partial<Session>) => Promise<Session[]>;
    createCheckpoint: (sessionId: string, overrides?: Partial<Checkpoint>) => Promise<Checkpoint>;
    createCheckpoints: (count: number, sessionId?: string, overrides?: Partial<Checkpoint>) => Promise<Checkpoint[]>;
    deleteSession: (sessionId: string) => Promise<void>;
    deleteCheckpoint: (checkpointId: string) => Promise<void>;
    cleanup: () => Promise<void>;
  };
  mockSessionState: SessionState;
  encryptedSession: Session;
  corruptedSession: Session;
  sessionWithCheckpoints: {
    session: Session;
    checkpoints: Checkpoint[];
  };
}

/**
 * Authenticated user fixture
 * Provides a logged-in user for session testing
 */
export const test = base.extend<SessionTestFixtures>({
  authenticatedUser: async ({}, use) => {
    const user = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      token: faker.string.alphanumeric(32),
      name: faker.person.fullName()
    };

    await use(user);

    // Cleanup is handled by sessionService fixture
  },

  /**
   * Session service fixture
   * Manages session and checkpoint lifecycle with auto-cleanup
   */
  sessionService: async ({ request }, use) => {
    const createdSessions: string[] = [];
    const createdCheckpoints: string[] = [];

    const sessionService = {
      async createSession(overrides: Partial<Session> = {}) {
        const session = createSession({
          userId: faker.string.uuid(), // In real tests, this would come from authenticatedUser
          ...overrides
        });

        // Create session via API
        const response = await request.post('/api/sessions', {
          data: {
            workspaceState: session.workspaceState,
            encryption: { algorithm: session.algorithm }
          }
        });

        if (response.status() === 201) {
          const createdSession = await response.json();
          createdSessions.push(createdSession.id);
          return createdSession;
        }

        throw new Error(`Failed to create session: ${response.status()}`);
      },

      async createSessions(count: number, overrides: Partial<Session> = {}) {
        const sessions = [];
        for (let i = 0; i < count; i++) {
          const session = await this.createSession({
            ...overrides,
            // Ensure different timestamps for ordering tests
            createdAt: faker.date.past({
              years: 0.1,
              refDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
            }).toISOString()
          });
          sessions.push(session);
        }
        return sessions;
      },

      async createCheckpoint(sessionId: string, overrides: Partial<Checkpoint> = {}) {
        const checkpoint = createCheckpoint({
          sessionId,
          ...overrides
        });

        // Create checkpoint via API
        const response = await request.post('/api/sessions/checkpoints', {
          data: {
            sessionId,
            name: checkpoint.name,
            description: checkpoint.description
          }
        });

        if (response.status() === 201) {
          const createdCheckpoint = await response.json();
          createdCheckpoints.push(createdCheckpoint.id);
          return createdCheckpoint;
        }

        throw new Error(`Failed to create checkpoint: ${response.status()}`);
      },

      async createCheckpoints(count: number, sessionId?: string, overrides: Partial<Checkpoint> = {}) {
        const targetSessionId = sessionId || faker.string.uuid();
        const checkpoints = [];

        for (let i = 0; i < count; i++) {
          const checkpoint = await this.createCheckpoint(targetSessionId, {
            ...overrides,
            createdAt: faker.date.recent({
              days: 1,
              refDate: new Date(Date.now() - i * 60 * 60 * 1000)
            }).toISOString()
          });
          checkpoints.push(checkpoint);
        }
        return checkpoints;
      },

      async deleteSession(sessionId: string) {
        const response = await request.delete(`/api/sessions/${sessionId}`);
        if (response.status() === 204) {
          const index = createdSessions.indexOf(sessionId);
          if (index > -1) {
            createdSessions.splice(index, 1);
          }
        }
      },

      async deleteCheckpoint(checkpointId: string) {
        const response = await request.delete(`/api/sessions/checkpoints/${checkpointId}`);
        if (response.status() === 204) {
          const index = createdCheckpoints.indexOf(checkpointId);
          if (index > -1) {
            createdCheckpoints.splice(index, 1);
          }
        }
      },

      async cleanup() {
        // Clean up checkpoints first (foreign key constraint)
        for (const checkpointId of createdCheckpoints) {
          try {
            await request.delete(`/api/sessions/checkpoints/${checkpointId}`);
          } catch (error) {
            console.warn(`Failed to cleanup checkpoint ${checkpointId}:`, error);
          }
        }

        // Clean up sessions
        for (const sessionId of createdSessions) {
          try {
            await request.delete(`/api/sessions/${sessionId}`);
          } catch (error) {
            console.warn(`Failed to cleanup session ${sessionId}:`, error);
          }
        }

        // Clear tracking arrays
        createdSessions.length = 0;
        createdCheckpoints.length = 0;
      }
    };

    await use(sessionService);

    // Auto-cleanup after each test
    await sessionService.cleanup();
  },

  /**
   * Mock session state fixture
   * Provides a ready-to-use session state for tests
   */
  mockSessionState: async ({}, use) => {
    const sessionState = createSessionState({
      // Ensure some consistent data for predictable tests
      files: [
        {
          path: 'src/main.js',
          content: 'console.log("Hello World");',
          lastModified: new Date().toISOString(),
          size: 28
        },
        {
          path: 'package.json',
          content: JSON.stringify({
            name: 'test-project',
            version: '1.0.0',
            scripts: { start: 'node src/main.js' }
          }, null, 2),
          lastModified: new Date().toISOString(),
          size: 125
        }
      ],
      terminal: {
        history: ['npm install', 'npm start'],
        currentDirectory: '/home/user/project',
        activeProcesses: []
      },
      browser: {
        openTabs: [
          {
            url: 'http://localhost:3000',
            title: 'Test App - CC Wrapper',
            isActive: true
          }
        ],
        activeTab: 'http://localhost:3000'
      },
      aiConversations: {
        messages: [
          {
            role: 'user' as const,
            content: 'How do I run this app?',
            timestamp: new Date().toISOString(),
            model: 'gpt-4'
          },
          {
            role: 'assistant' as const,
            content: 'You can run the app with npm start',
            timestamp: new Date().toISOString(),
            model: 'gpt-4'
          }
        ],
        context: 'Application setup help',
        sessionId: faker.string.uuid()
      }
    });

    await use(sessionState);
  },

  /**
   * Encrypted session fixture
   * Provides a session with encryption metadata
   */
  encryptedSession: async ({}, use) => {
    const session = createSession({
      encrypted: true,
      algorithm: 'AES-256-GCM',
      encryptionMetadata: {
        algorithm: 'AES-256-GCM',
        keyDerivation: 'Argon2id',
        salt: faker.string.hexadecimal({ length: 32 }),
        iv: faker.string.hexadecimal({ length: 24 }),
        keyId: faker.string.uuid()
      }
    });

    await use(session);
  },

  /**
   * Corrupted session fixture
   * Provides a corrupted session for testing recovery scenarios
   */
  corruptedSession: async ({}, use) => {
    const session = createSession({
      workspaceState: {
        files: [], // Missing files - corruption
        terminal: {
          history: ['npm install'],
          currentDirectory: '/home/user',
          activeProcesses: []
        },
        browser: null as any, // Null instead of object - corruption
        aiConversations: undefined as any // Undefined - corruption
      },
      corrupted: true,
      corruptionReason: 'Partial data loss during last save'
    });

    await use(session);
  },

  /**
   * Session with checkpoints fixture
   * Provides a session with multiple checkpoints for testing checkpoint management
   */
  sessionWithCheckpoints: async ({ sessionService }, use) => {
    // Create a session
    const session = await sessionService.createSession({
      workspaceState: createSessionState({
        files: [{ path: 'initial.js', content: 'initial content' }]
      })
    });

    // Create multiple checkpoints
    const checkpoints = await sessionService.createCheckpoints(3, session.id, [
      { name: 'Initial setup' },
      { name: 'Feature added' },
      { name: 'Before refactor' }
    ]);

    await use({ session, checkpoints });

    // Cleanup is handled by sessionService fixture
  }
});

/**
 * Re-export expect for convenience
 */
export { expect } from '@playwright/test';

/**
 * Helper function to create session route interception
 * Useful for mocking session API responses in tests
 */
export const createSessionRouteInterceptor = (
  request: APIRequestContext,
  mockData: Partial<Session>
) => {
  return async (route: any) => {
    if (route.request().method() === 'POST' && route.request().url().includes('/api/sessions')) {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(createSession(mockData))
      });
    } else {
      route.continue();
    }
  };
};

/**
 * Helper function to create checkpoint route interception
 */
export const createCheckpointRouteInterceptor = (
  mockData: Partial<Checkpoint>
) => {
  return async (route: any) => {
    if (route.request().method() === 'POST' && route.request().url().includes('/api/sessions/checkpoints')) {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(createCheckpoint(mockData))
      });
    } else {
      route.continue();
    }
  };
};

/**
 * Helper function to simulate network delay for session operations
 */
export const withSessionDelay = <T>(promise: Promise<T>, delayMs = 100): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await promise;
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delayMs);
  });
};