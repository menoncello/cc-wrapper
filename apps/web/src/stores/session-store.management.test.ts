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
  // Clear localStorage completely
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
    localStorage.removeItem('session-store');
  }
  // Reset store state to initial state
  useSessionStore.getState().clearSession();
};

describe('sessionStore - Session Management', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

describe('sessionStore - Session State Management', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set current session', () => {
    useSessionStore.getState().setCurrentSession(mockSession);

    expect(useSessionStore.getState().currentSession).toEqual(mockSession);
  });

  it('should set workspace state', () => {
    useSessionStore.getState().setWorkspaceState(mockWorkspaceState);

    const state = useSessionStore.getState();
    expect(state.workspaceState).toEqual(mockWorkspaceState);
    expect(state.isDirty).toBe(true);
  });
});

describe('sessionStore - Workspace State Updates', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update workspace state partially', () => {
    const initialWorkspaceState = {
      terminalState: [],
      browserTabs: [],
      aiConversations: [],
      openFiles: [],
      workspaceConfig: { theme: 'dark' },
      metadata: {}
    };

    useSessionStore.getState().setWorkspaceState(initialWorkspaceState);

    const updates = {
      workspaceConfig: { theme: 'light', language: 'en' },
      metadata: { version: '1.0' }
    };

    useSessionStore.getState().updateWorkspaceState(updates);

    const state = useSessionStore.getState();
    expect(state.workspaceState).toEqual({
      terminalState: [],
      browserTabs: [],
      aiConversations: [],
      openFiles: [],
      workspaceConfig: { theme: 'light', language: 'en' },
      metadata: { version: '1.0' }
    });
    expect(state.isDirty).toBe(true);
  });
});

describe('sessionStore - Configuration Management', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set dirty state', () => {
    useSessionStore.getState().setDirty(true);
    expect(useSessionStore.getState().isDirty).toBe(true);

    useSessionStore.getState().setDirty(false);
    expect(useSessionStore.getState().isDirty).toBe(false);
  });

  it('should set auto save configuration', () => {
    useSessionStore.getState().setAutoSave(false, 60000);

    const state = useSessionStore.getState();
    expect(state.autoSaveEnabled).toBe(false);
    expect(state.autoSaveInterval).toBe(60000);

    useSessionStore.getState().setAutoSave(true);

    expect(useSessionStore.getState().autoSaveEnabled).toBe(true);
    expect(useSessionStore.getState().autoSaveInterval).toBe(60000);

    // Reset to default for other tests
    useSessionStore.getState().setAutoSave(true, 30000);
  });
});
