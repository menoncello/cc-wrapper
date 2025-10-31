import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionAutoSave, useSessionStore } from './session-store';
import type { NewSessionConfig } from './session-types';

// Mock fetch
global.fetch = vi.fn() as any;

// Test fixtures
const mockSession = {
  id: 'session-123',
  userId: 'user-123',
  workspaceId: 'workspace-123',
  name: 'New Session',
  isActive: true,
  lastSavedAt: '2023-12-01T10:00:00Z',
  createdAt: '2023-12-01T09:00:00Z',
  checkpointCount: 0,
  totalSize: 0
};

const mockWorkspaceState = {
  terminalState: [],
  browserTabs: [],
  aiConversations: [],
  openFiles: [],
  workspaceConfig: {},
  metadata: {}
};

// Setup functions
const setupTestEnvironment = () => {
  vi.clearAllMocks();
  // Reset store state to initial state
  useSessionStore.getState().clearSession();
};

describe('sessionStore - Session Creation', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

describe('sessionStore - createNewSession', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create new session successfully', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: mockSession
      })
    };
    (fetch as any).mockResolvedValue(mockResponse);

    const config = createSessionConfig();
    const result = await useSessionStore.getState().createNewSession(config);

    verifySuccessfulSessionCreation(result, config);
    verifyStoreStateAfterCreation();
  });

  it('should handle create session API error', async () => {
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Creation failed' })
    };
    (fetch as any).mockResolvedValue(mockResponse);

    await expect(
      useSessionStore.getState().createNewSession({
        userId: 'user-123',
        workspaceId: 'workspace-123',
        name: 'New Session',
        workspaceState: {
          terminalState: [],
          browserTabs: [],
          aiConversations: [],
          openFiles: []
        }
      })
    ).rejects.toThrow('Creation failed');
  });
});

// Helper functions for session creation tests
function createSessionConfig() {
  return {
    userId: 'user-123',
    workspaceId: 'workspace-123',
    name: 'New Session',
    workspaceState: mockWorkspaceState
  };
}

function verifySuccessfulSessionCreation(result: string, config: NewSessionConfig) {
  expect(result).toBe('session-123');
  expect(fetch).toHaveBeenCalledWith('/api/sessions/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
}

function verifyStoreStateAfterCreation() {
  const state = useSessionStore.getState();
  expect(state.currentSession).toEqual(mockSession);
  expect(state.workspaceState).toEqual(mockWorkspaceState);
  expect(state.isDirty).toBe(false);
  expect(state.lastSaved).toBeInstanceOf(Date);
}

// Auto Save setup functions
const setupAutoSaveTestEnvironment = () => {
  vi.clearAllMocks();
  // Reset store state to initial state
  useSessionStore.getState().clearSession();
  if (globalThis.__sessionAutoSaveInterval) {
    clearInterval(globalThis.__sessionAutoSaveInterval);
    delete globalThis.__sessionAutoSaveInterval;
  }
};

const cleanupAutoSaveTestEnvironment = () => {
  if (globalThis.__sessionAutoSaveInterval) {
    clearInterval(globalThis.__sessionAutoSaveInterval);
    delete globalThis.__sessionAutoSaveInterval;
  }
};

describe('sessionStore - Auto Save Functionality', () => {
  beforeEach(setupAutoSaveTestEnvironment);

  afterEach(() => {
    cleanupAutoSaveTestEnvironment();
    vi.restoreAllMocks();
  });

  it('should start auto save', () => {
    const saveSessionSpy = vi
      .spyOn(useSessionStore.getState(), 'saveSession')
      .mockResolvedValue(true);

    useSessionStore.getState().startAutoSave();

    expect(globalThis.__sessionAutoSaveInterval).toBeDefined();

    useSessionStore.getState().stopAutoSave();
    saveSessionSpy.mockRestore();
  });

  it('should stop auto save', () => {
    useSessionStore.getState().startAutoSave();
    expect(globalThis.__sessionAutoSaveInterval).toBeDefined();

    useSessionStore.getState().stopAutoSave();
    expect(globalThis.__sessionAutoSaveInterval).toBeUndefined();
  });

  it('should clear existing interval when starting new one', () => {
    const saveSessionSpy = vi
      .spyOn(useSessionStore.getState(), 'saveSession')
      .mockResolvedValue(true);

    useSessionStore.getState().startAutoSave();
    const firstInterval = globalThis.__sessionAutoSaveInterval;

    useSessionStore.getState().startAutoSave();
    const secondInterval = globalThis.__sessionAutoSaveInterval;

    expect(firstInterval).not.toBe(secondInterval);

    useSessionStore.getState().stopAutoSave();
    saveSessionSpy.mockRestore();
  });
});

describe('useSessionAutoSave Hook', () => {
  it('should be defined', () => {
    expect(useSessionAutoSave).toBeDefined();
    expect(typeof useSessionAutoSave).toBe('function');
  });
});
