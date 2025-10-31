import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from './session-store';
import type { Session } from './session-types';

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
  useSessionStore.getState().setCurrentSession(mockSession);
  useSessionStore.getState().setWorkspaceState(mockWorkspaceState);
  useSessionStore.getState().setDirty(true);
};

describe('sessionStore - Session Persistence', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

describe('sessionStore - saveSession Success Cases', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should save session successfully', async () => {
    const updatedSession = {
      ...mockSession,
      lastSavedAt: '2023-12-01T11:00:00Z'
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: updatedSession
      })
    };
    (fetch as any).mockResolvedValue(mockResponse);

    const result = await useSessionStore.getState().saveSession();

    expect(result).toBe(true);
    verifySaveRequest();
    verifySuccessfulSave(updatedSession);
  });

  it('should not save session when not dirty and not forced', async () => {
    useSessionStore.getState().setDirty(false);

    const result = await useSessionStore.getState().saveSession();

    expect(result).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should force save session when not dirty', async () => {
    useSessionStore.getState().setDirty(false);

    const updatedSession = {
      ...mockSession,
      lastSavedAt: '2023-12-01T11:00:00Z'
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: updatedSession
      })
    };
    (fetch as any).mockResolvedValue(mockResponse);

    const result = await useSessionStore.getState().saveSession({ force: true });

    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalled();

    const state = useSessionStore.getState();
    expect(state.currentSession).toEqual(updatedSession);
    expect(state.isDirty).toBe(false);
    expect(state.lastSaved).toBeInstanceOf(Date);
  });
});

describe('sessionStore - saveSession Error Cases', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle save session error gracefully', async () => {
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Save failed' })
    };
    (fetch as any).mockResolvedValue(mockResponse);

    const result = await useSessionStore.getState().saveSession();

    expect(result).toBe(false);
  });

  it('should handle save session error without error message', async () => {
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({})
    };
    (fetch as any).mockResolvedValue(mockResponse);

    const result = await useSessionStore.getState().saveSession();

    expect(result).toBe(false);
  });
});

// Helper functions for session persistence tests
function verifySaveRequest() {
  expect(fetch).toHaveBeenCalledWith('/api/sessions/v1/session-123', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceState: mockWorkspaceState })
  });
}

function verifySuccessfulSave(updatedSession: Session) {
  const state = useSessionStore.getState();
  expect(state.currentSession).toEqual(updatedSession);
  expect(state.isDirty).toBe(false);
  expect(state.lastSaved).toBeInstanceOf(Date);
}
