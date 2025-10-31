/**
 * Session Data Factory
 * Story 1.2 - Test data generation for session persistence tests
 *
 * Pattern: Pure functions using @faker-js/faker with override support
 * Reference: bmad/bmm/testarch/knowledge/data-factories.md
 */

import { faker } from '@faker-js/faker';
import type { WorkspaceState, OpenFile, TerminalState, BrowserTab, AIConversation, AIMessage } from '@cc-wrapper/shared-types';

export interface SessionWorkspaceState {
  openFiles: Array<{
    id: string;
    path: string;
    content: string;
    lastModified: string;
  }>;
  terminalState: Array<{
    id: string;
    cwd: string;
    command?: string;
    history: string[];
    env?: Record<string, string>;
    isActive: boolean;
  }>;
  browserTabs: Array<{
    id: string;
    url: string;
    title: string;
    isActive: boolean;
    scrollPosition?: { x: number; y: number };
    formData?: Record<string, unknown>;
  }>;
  aiConversations: Array<{
    id: string;
    sessionId: string;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: Date;
      metadata?: Record<string, unknown>;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }>;
  workspaceConfig?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface Session {
  id: string;
  user_id: string;
  workspace_state: SessionWorkspaceState;
  encrypted: boolean;
  encryption_metadata: {
    algorithm: string;
    keyDerivation: string;
    salt: string;
    iv: string;
  };
  checksum: string;
  compressed_size?: number;
  original_size: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  auto_save_enabled: boolean;
  retention_policy: 'standard' | 'extended' | 'custom';
  expires_at?: string;
}

export interface SessionCheckpoint {
  id: string;
  session_id: string;
  name: string;
  description?: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  workspace_state: SessionWorkspaceState;
  encrypted: boolean;
  encryption_metadata: Session['encryption_metadata'];
  created_at: string;
  size_bytes: number;
}

/**
 * Create workspace state with realistic test data
 *
 * @param overrides - Partial workspace state to override defaults
 * @returns SessionWorkspaceState object with realistic data
 *
 * @example
 * const workspace = createWorkspaceState();
 * const customWorkspace = createWorkspaceState({
 *   terminal: { currentDirectory: '/custom/path' }
 * });
 */
export const createWorkspaceState = (
  overrides: Partial<WorkspaceState> = {}
): WorkspaceState => {
  const openFiles: OpenFile[] = Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
    id: faker.string.uuid(),
    path: faker.system.filePath(),
    content: faker.lorem.paragraphs({ min: 1, max: 3 }),
    cursor: { line: faker.number.int({ min: 1, max: 100 }), column: faker.number.int({ min: 1, max: 80 }) },
    scrollPosition: faker.number.int({ min: 0, max: 1000 }),
    isDirty: faker.datatype.boolean(),
    language: faker.helpers.arrayElement(['javascript', 'typescript', 'python', 'java', 'go', 'rust'])
  }));

  const terminalState: TerminalState[] = Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
    id: faker.string.uuid(),
    cwd: faker.system.directoryPath(),
    command: faker.helpers.arrayElement(['npm run dev', 'node server.js', 'npm test', 'git status']),
    history: Array.from({ length: faker.number.int({ min: 3, max: 10 }) }, () =>
      faker.helpers.arrayElement([
        'npm install',
        'git status',
        'git add .',
        'git commit -m "feat: add feature"',
        'npm test',
        'npm run build',
        'ls -la',
        'cd src',
        'code .',
        'docker-compose up'
      ])
    ),
    env: {
      PATH: '/usr/local/bin:/usr/bin:/bin',
      NODE_ENV: faker.helpers.arrayElement(['development', 'production', 'test'])
    },
    isActive: faker.datatype.boolean()
  }));

  const browserTabs: BrowserTab[] = Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, (_, index) => ({
    id: faker.string.uuid(),
    url: faker.internet.url(),
    title: faker.lorem.words({ min: 2, max: 5 }),
    isActive: index === 0,
    scrollPosition: { x: faker.number.int({ min: 0, max: 2000 }), y: faker.number.int({ min: 0, max: 3000 }) },
    formData: faker.datatype.boolean() ? { username: faker.internet.displayName(), email: faker.internet.email() } : undefined
  }));

  const aiConversations: AIConversation[] = Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
    id: faker.string.uuid(),
    sessionId: faker.string.uuid(),
    messages: Array.from({ length: faker.number.int({ min: 2, max: 10 }) }, () => ({
      id: faker.string.uuid(),
      role: faker.helpers.arrayElement(['user', 'assistant', 'system']),
      content: faker.lorem.paragraphs({ min: 1, max: 3 }),
      timestamp: faker.date.recent({ hours: 2 }),
      metadata: { model: faker.helpers.arrayElement(['claude-3-sonnet', 'gpt-4', 'gemini-pro']) }
    })),
    createdAt: faker.date.recent({ days: 1 }),
    updatedAt: faker.date.recent({ hours: 1 })
  }));

  const defaultWorkspaceState: WorkspaceState = {
    openFiles,
    terminalState,
    browserTabs,
    aiConversations,
    workspaceConfig: {
      theme: faker.helpers.arrayElement(['dark', 'light', 'auto']),
      fontSize: faker.number.int({ min: 12, max: 20 }),
      autoSave: faker.datatype.boolean()
    },
    metadata: {
      name: faker.lorem.words({ min: 2, max: 4 }),
      description: faker.lorem.sentences({ min: 1, max: 2 }),
      tags: faker.helpers.arrayElements(['development', 'testing', 'debugging', 'feature-work'], { min: 1, max: 3 }),
      createdAt: faker.date.recent({ days: 1 }),
      updatedAt: faker.date.recent({ hours: 1 })
    }
  };

  return {
    ...defaultWorkspaceState,
    ...overrides
  };
};

/**
 * Create a single session with optional overrides
 *
 * @param userId - User ID to associate session with
 * @param overrides - Partial session data to override defaults
 * @returns Session object with realistic data
 *
 * @example
 * const session = createSession('user-123');
 * const encryptedSession = createSession('user-123', { encrypted: true });
 */
export const createSession = (
  userId: string,
  overrides: Partial<Session> = {}
): Session => {
  const workspaceState = createWorkspaceState();
  const originalSize = JSON.stringify(workspaceState).length;

  const defaultSession: Session = {
    id: faker.string.uuid(),
    user_id: userId,
    workspace_state: workspaceState,
    encrypted: faker.datatype.boolean(),
    encryption_metadata: {
      algorithm: 'AES-256-GCM',
      keyDerivation: 'Argon2id',
      salt: faker.string.alphanumeric(32),
      iv: faker.string.alphanumeric(16)
    },
    checksum: faker.string.alphanumeric(64),
    original_size: originalSize,
    compressed_size: faker.datatype.boolean() ? faker.number.int({ min: 1000, max: originalSize }) : undefined,
    created_at: faker.date.recent({ days: 7 }).toISOString(),
    updated_at: faker.date.recent({ hours: 1 }).toISOString(),
    last_accessed_at: faker.date.recent({ minutes: 30 }).toISOString(),
    auto_save_enabled: true,
    retention_policy: faker.helpers.arrayElement(['standard', 'extended', 'custom'] as const),
    expires_at: faker.datatype.boolean() ? faker.date.future({ years: 1 }).toISOString() : undefined
  };

  return {
    ...defaultSession,
    ...overrides
  };
};

/**
 * Create array of sessions
 *
 * @param userId - User ID to associate sessions with
 * @param count - Number of sessions to create
 * @param overrides - Shared overrides for all sessions
 * @returns Array of sessions
 *
 * @example
 * const sessions = createSessions('user-123', 5);
 * const encryptedSessions = createSessions('user-123', 3, { encrypted: true });
 */
export const createSessions = (
  userId: string,
  count: number,
  overrides: Partial<Session> = {}
): Session[] => {
  return Array.from({ length: count }, () => createSession(userId, overrides));
};

/**
 * Create session checkpoint with realistic data
 *
 * @param sessionId - Session ID to associate checkpoint with
 * @param overrides - Partial checkpoint data to override defaults
 * @returns SessionCheckpoint object
 *
 * @example
 * const checkpoint = createCheckpoint('session-123');
 * const importantCheckpoint = createCheckpoint('session-123', {
 *   priority: 'high',
 *   name: 'Before major refactoring'
 * });
 */
export const createCheckpoint = (
  sessionId: string,
  overrides: Partial<SessionCheckpoint> = {}
): SessionCheckpoint => {
  const workspaceState = createWorkspaceState();
  const sizeBytes = JSON.stringify(workspaceState).length;

  const defaultCheckpoint: SessionCheckpoint = {
    id: faker.string.uuid(),
    session_id: sessionId,
    name: faker.helpers.arrayElement([
      'Before deployment',
      'Feature complete',
      'Bug fix verified',
      'Refactoring checkpoint',
      'Testing milestone',
      'Security update'
    ]),
    description: faker.lorem.sentences({ min: 1, max: 3 }),
    tags: faker.helpers.arrayElements(
      ['feature', 'bugfix', 'refactor', 'security', 'performance', 'testing'],
      { min: 1, max: 3 }
    ),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high'] as const),
    workspace_state: workspaceState,
    encrypted: faker.datatype.boolean(),
    encryption_metadata: {
      algorithm: 'AES-256-GCM',
      keyDerivation: 'Argon2id',
      salt: faker.string.alphanumeric(32),
      iv: faker.string.alphanumeric(16)
    },
    created_at: faker.date.recent({ days: 1 }).toISOString(),
    size_bytes: sizeBytes
  };

  return {
    ...defaultCheckpoint,
    ...overrides
  };
};

/**
 * Create array of checkpoints for a session
 *
 * @param sessionId - Session ID to associate checkpoints with
 * @param count - Number of checkpoints to create
 * @param overrides - Shared overrides for all checkpoints
 * @returns Array of checkpoints
 *
 * @example
 * const checkpoints = createCheckpoints('session-123', 3);
 */
export const createCheckpoints = (
  sessionId: string,
  count: number,
  overrides: Partial<SessionCheckpoint> = {}
): SessionCheckpoint[] => {
  return Array.from({ length: count }, () => createCheckpoint(sessionId, overrides));
};

/**
 * Create session data for API requests (without system fields)
 *
 * @param overrides - Data to override
 * @returns API-ready session data
 *
 * @example
 * const apiData = createSessionApiData();
 * const customApiData = createSessionApiData({
 *   workspace_state: { files: [] }
 * });
 */
export const createSessionApiData = (
  overrides: Partial<{
    workspace_state: SessionWorkspaceState;
    encryption: {
      algorithm: string;
      keyDerivation: string;
    };
  }> = {}
) => {
  const workspaceState = createWorkspaceState();

  return {
    workspace_state: workspaceState,
    encryption: {
      algorithm: 'AES-256-GCM',
      keyDerivation: 'Argon2id'
    },
    ...overrides
  };
};

/**
 * Create minimal session state for testing basic functionality
 *
 * @param overrides - Data to override
 * @returns Minimal but valid session state
 */
export const createMinimalSessionState = (
  overrides: Partial<WorkspaceState> = {}
): WorkspaceState => {
  return createWorkspaceState({
    openFiles: [{
      id: faker.string.uuid(),
      path: 'test.js',
      content: 'console.log("test");',
      cursor: { line: 1, column: 1 },
      scrollPosition: 0,
      isDirty: false,
      language: 'javascript'
    }],
    terminalState: [{
      id: faker.string.uuid(),
      cwd: '/test',
      history: [],
      isActive: true
    }],
    browserTabs: [],
    aiConversations: [],
    ...overrides
  });
};

/**
 * Create a mock workspace state with standard size for testing
 *
 * @param overrides - Data to override
 * @returns Mock workspace state
 */
export const createMockWorkspaceState = (
  overrides: Partial<WorkspaceState> = {}
): WorkspaceState => {
  return createWorkspaceState(overrides);
};

/**
 * Create a large mock workspace state for performance testing
 *
 * @param overrides - Data to override
 * @returns Large mock workspace state
 */
export const createLargeMockWorkspaceState = (
  overrides: Partial<WorkspaceState> = {}
): WorkspaceState => {
  const openFiles: OpenFile[] = Array.from({ length: 100 }, () => ({
    id: faker.string.uuid(),
    path: faker.system.filePath(),
    content: faker.lorem.paragraphs({ min: 10, max: 50 }),
    cursor: { line: faker.number.int({ min: 1, max: 1000 }), column: faker.number.int({ min: 1, max: 200 }) },
    scrollPosition: faker.number.int({ min: 0, max: 5000 }),
    isDirty: faker.datatype.boolean(),
    language: faker.helpers.arrayElement(['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp', 'php'])
  }));

  const terminalState: TerminalState[] = Array.from({ length: 5 }, () => ({
    id: faker.string.uuid(),
    cwd: faker.system.directoryPath(),
    command: faker.helpers.arrayElement(['npm run dev', 'node server.js', 'npm test', 'git status', 'docker-compose up']),
    history: Array.from({ length: 1000 }, () =>
      faker.helpers.arrayElement([
        'npm install',
        'git status',
        'git add .',
        'git commit -m "feat: add feature"',
        'npm test',
        'npm run build',
        'ls -la',
        'cd src',
        'code .',
        'docker-compose up'
      ])
    ),
    env: {
      PATH: '/usr/local/bin:/usr/bin:/bin',
      NODE_ENV: faker.helpers.arrayElement(['development', 'production', 'test']),
      DEBUG: faker.datatype.boolean() ? 'true' : undefined
    },
    isActive: faker.datatype.boolean()
  }));

  const browserTabs: BrowserTab[] = Array.from({ length: 50 }, () => ({
    id: faker.string.uuid(),
    url: faker.internet.url(),
    title: faker.lorem.words({ min: 2, max: 8 }),
    isActive: faker.datatype.boolean(),
    scrollPosition: { x: faker.number.int({ min: 0, max: 5000 }), y: faker.number.int({ min: 0, max: 10000 }) },
    formData: faker.datatype.boolean() ? {
      username: faker.internet.displayName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      rememberMe: faker.datatype.boolean()
    } : undefined
  }));

  const aiConversations: AIConversation[] = Array.from({ length: 20 }, () => ({
    id: faker.string.uuid(),
    sessionId: faker.string.uuid(),
    messages: Array.from({ length: 200 }, () => ({
      id: faker.string.uuid(),
      role: faker.helpers.arrayElement(['user', 'assistant', 'system']),
      content: faker.lorem.paragraphs({ min: 5, max: 20 }),
      timestamp: faker.date.recent({ hours: 24 }),
      metadata: {
        model: faker.helpers.arrayElement(['claude-3-sonnet', 'gpt-4', 'gemini-pro']),
        tokens: faker.number.int({ min: 100, max: 1000 })
      }
    })),
    createdAt: faker.date.recent({ days: 7 }),
    updatedAt: faker.date.recent({ hours: 12 })
  }));

  return createWorkspaceState({
    openFiles,
    terminalState,
    browserTabs,
    aiConversations,
    workspaceConfig: {
      theme: faker.helpers.arrayElement(['dark', 'light', 'auto']),
      fontSize: faker.number.int({ min: 12, max: 24 }),
      autoSave: faker.datatype.boolean(),
      tabSize: faker.number.int({ min: 2, max: 8 }),
      wordWrap: faker.datatype.boolean()
    },
    metadata: {
      name: faker.lorem.words({ min: 3, max: 6 }),
      description: faker.lorem.paragraphs({ min: 2, max: 5 }),
      tags: faker.helpers.arrayElements(['development', 'testing', 'debugging', 'feature-work', 'performance', 'refactoring'], { min: 2, max: 5 }),
      createdAt: faker.date.recent({ days: 14 }),
      updatedAt: faker.date.recent({ hours: 6 })
    },
    ...overrides
  });
};