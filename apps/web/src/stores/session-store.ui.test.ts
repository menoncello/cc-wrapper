import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from './session-store';
import type { Checkpoint, Session, WorkspaceState } from './session-types';

// Mock fetch
global.fetch = vi.fn() as any;

// Setup functions
const setupTestEnvironment = () => {
  vi.clearAllMocks();
  // Reset store state to initial state
  useSessionStore.getState().clearSession();
};

describe('sessionStore - UI Helpers', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

describe('sessionStore - setCheckpointForm', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set checkpoint form data', () => {
    useSessionStore.getState().setCheckpointForm({
      name: 'Test Checkpoint',
      description: 'Test Description',
      tags: ['test', 'checkpoint'],
      priority: 'high'
    });

    const state = useSessionStore.getState();
    expect(state.checkpointName).toBe('Test Checkpoint');
    expect(state.checkpointDescription).toBe('Test Description');
    expect(state.checkpointTags).toEqual(['test', 'checkpoint']);
    expect(state.checkpointPriority).toBe('high');
  });

  it('should set partial checkpoint form data', () => {
    useSessionStore.getState().resetCheckpointForm();
    useSessionStore.getState().setCheckpointForm({
      name: 'Test Checkpoint'
    });

    const state = useSessionStore.getState();
    expect(state.checkpointName).toBe('Test Checkpoint');
    expect(state.checkpointDescription).toBe('');
    expect(state.checkpointTags).toEqual([]);
    expect(state.checkpointPriority).toBe('medium');
  });
});

describe('sessionStore - resetCheckpointForm', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reset checkpoint form', () => {
    useSessionStore.getState().setCheckpointForm({
      name: 'Test Checkpoint',
      description: 'Test Description',
      tags: ['test'],
      priority: 'high'
    });

    useSessionStore.getState().resetCheckpointForm();

    const state = useSessionStore.getState();
    expect(state.checkpointName).toBe('');
    expect(state.checkpointDescription).toBe('');
    expect(state.checkpointTags).toEqual([]);
    expect(state.checkpointPriority).toBe('medium');
  });
});

describe('sessionStore - clearSession', () => {
  beforeEach(setupTestEnvironment);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should clear session', () => {
    useSessionStore.setState({
      currentSession: { id: 'test' } as Session,
      workspaceState: { test: true } as unknown as WorkspaceState,
      isDirty: true,
      checkpoints: [{ id: 'cp1' } as Checkpoint]
    });

    useSessionStore.getState().clearSession();

    const state = useSessionStore.getState();
    expect(state.currentSession).toBeNull();
    expect(state.workspaceState).toBeNull();
    expect(state.isDirty).toBe(false);
    expect(state.lastSaved).toBeNull();
    expect(state.checkpoints).toEqual([]);
  });
});
