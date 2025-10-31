import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from './session-store';

// Mock fetch
global.fetch = vi.fn() as any;

describe('sessionStore - Initial State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage completely
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
      localStorage.removeItem('session-store');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have correct initial state', () => {
    const state = useSessionStore.getState();

    expect(state.currentSession).toBeNull();
    expect(state.workspaceState).toBeNull();
    expect(state.isDirty).toBe(false);
    expect(state.lastSaved).toBeNull();
    expect(state.autoSaveEnabled).toBe(true);
    expect(state.autoSaveInterval).toBe(30000);
    expect(state.checkpoints).toEqual([]);
    expect(state.isLoadingCheckpoints).toBe(false);
    expect(state.isCreatingCheckpoint).toBe(false);
    expect(state.isRestoringCheckpoint).toBe(false);
    expect(state.checkpointName).toBe('');
    expect(state.checkpointDescription).toBe('');
    expect(state.checkpointTags).toEqual([]);
    expect(state.checkpointPriority).toBe('medium');
  });
});
