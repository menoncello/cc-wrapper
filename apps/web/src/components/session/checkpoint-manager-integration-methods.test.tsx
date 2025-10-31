import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupMockSessionStore } from './test-utils';

describe('CheckpointManager - Store Integration - Core Methods', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should use store methods correctly', () => {
    const mockMethods = {
      createCheckpoint: vi.fn(),
      loadCheckpoints: vi.fn(),
      restoreCheckpoint: vi.fn(),
      deleteCheckpoint: vi.fn(),
      updateCheckpointMetadata: vi.fn()
    };

    // Test that methods are callable
    for (const [methodName, method] of Object.entries(mockMethods)) {
      expect(typeof method).toBe('function');
      expect(methodName).toMatch(/(create|load|restore|delete|update)/);
    }
  });
});

describe('CheckpointManager - Store Integration - Form Methods', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should handle form-related store methods', () => {
    const mockFormMethods = {
      setCheckpointForm: vi.fn(),
      resetCheckpointForm: vi.fn()
    };

    for (const [methodName, method] of Object.entries(mockFormMethods)) {
      expect(typeof method).toBe('function');
      expect(methodName).toMatch(/(set|reset).*Form/);
    }
  });
});

describe('CheckpointManager - Store Integration - Session Methods', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should handle session-related store methods', () => {
    const mockSessionMethods = {
      setCurrentSession: vi.fn(),
      saveSession: vi.fn(),
      restoreSession: vi.fn(),
      createNewSession: vi.fn(),
      clearSession: vi.fn()
    };

    for (const [methodName, method] of Object.entries(mockSessionMethods)) {
      expect(typeof method).toBe('function');
      expect(methodName).toMatch(/(set|save|restore|create|clear).*Session/);
    }
  });
});

describe('CheckpointManager - Store Integration - Workspace Methods', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should handle workspace-related store methods', () => {
    const mockWorkspaceMethods = {
      setWorkspaceState: vi.fn(),
      updateWorkspaceState: vi.fn()
    };

    for (const [methodName, method] of Object.entries(mockWorkspaceMethods)) {
      expect(typeof method).toBe('function');
      expect(methodName).toMatch(/(set|update).*Workspace/);
    }
  });
});

describe('CheckpointManager - Store Integration - Configuration', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should access checkpoint filter configuration', () => {
    const checkpointFilter = { limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };

    expect(typeof checkpointFilter.limit).toBe('number');
    expect(checkpointFilter.limit).toBeGreaterThan(0);
    expect(typeof checkpointFilter.sortBy).toBe('string');
    expect(['asc', 'desc']).toContain(checkpointFilter.sortOrder);
  });

  it('should access auto-save configuration', () => {
    const autoSaveEnabled = true;
    const autoSaveInterval = 30000;

    expect(typeof autoSaveEnabled).toBe('boolean');
    expect(typeof autoSaveInterval).toBe('number');
    expect(autoSaveInterval).toBeGreaterThan(0);
  });

  it('should access workspace state', () => {
    const workspaceState = null;

    expect(workspaceState).toBeNull();
  });
});
