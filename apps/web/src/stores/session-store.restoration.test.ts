import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from './session-store';

// Mock fetch
global.fetch = vi.fn() as any;

// Test fixtures
const mockSession = {
  id: 'session-123',
  userId: 'user-123',
  workspaceId: 'workspace-123',
  name: 'Test Session',
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

describe('sessionStore - Checkpoint Restoration', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

describe('sessionStore - restoreCheckpoint Success', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should restore checkpoint successfully', async () => {
    const mockResponse = createMockRestoreResponse();
    const mockLoadCheckpointsResponse = createMockLoadCheckpointsResponse();

    (fetch as any)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockLoadCheckpointsResponse);

    const result = await useSessionStore.getState().restoreCheckpoint('checkpoint-123', {
      createBackup: true,
      backupName: 'backup-before-restore'
    });

    expect(result).toBe(true);
    verifyRestoreRequest();
    verifyRestoreState();
  });
});

describe('sessionStore - restoreCheckpoint Error', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle restore checkpoint API error', async () => {
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Restore failed' })
    };
    (fetch as any).mockResolvedValue(mockResponse);

    await expect(useSessionStore.getState().restoreCheckpoint('checkpoint-123')).rejects.toThrow(
      'Restore failed'
    );

    expect(useSessionStore.getState().isRestoringCheckpoint).toBe(false);
  });
});

describe('sessionStore - restoreSession Success', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should restore session successfully', async () => {
    const mockResponse = createMockSessionRestoreResponse();
    (fetch as any).mockResolvedValue(mockResponse);

    const result = await useSessionStore.getState().restoreSession('session-123');

    expect(result).toBe(true);
    verifySessionRestoreRequest();
    verifySessionRestoreState();
  });
});

describe('sessionStore - restoreSession Error', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle restore session API error', async () => {
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Restore failed' })
    };
    (fetch as any).mockResolvedValue(mockResponse);

    const result = await useSessionStore.getState().restoreSession('session-123');

    expect(result).toBe(false);
  });
});

// Helper functions for restoration tests
function createMockRestoreResponse() {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({
      data: {
        session: mockSession,
        workspaceState: mockWorkspaceState
      }
    })
  };
}

function createMockLoadCheckpointsResponse() {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({
      data: { checkpoints: [] }
    })
  };
}

function createMockSessionRestoreResponse() {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({
      data: {
        session: mockSession,
        workspaceState: mockWorkspaceState
      }
    })
  };
}

function verifyRestoreRequest() {
  expect(fetch).toHaveBeenCalledWith('/api/checkpoints/v1/checkpoint-123/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      createBackup: true,
      backupName: 'backup-before-restore',
      encryptionKey: undefined
    })
  });
}

function verifyRestoreState() {
  const state = useSessionStore.getState();
  expect(state.currentSession).toEqual(mockSession);
  expect(state.workspaceState).toEqual(mockWorkspaceState);
  expect(state.isRestoringCheckpoint).toBe(false);
}

function verifySessionRestoreRequest() {
  expect(fetch).toHaveBeenCalledWith('/api/sessions/v1/session-123', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
}

function verifySessionRestoreState() {
  const state = useSessionStore.getState();
  expect(state.currentSession).toEqual(mockSession);
  expect(state.workspaceState).toEqual(mockWorkspaceState);
  expect(state.isDirty).toBe(false);
  expect(state.lastSaved).toBeInstanceOf(Date);
}
