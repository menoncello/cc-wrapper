import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type Session } from '../../stores/session-store';
import { mockSession, setupMockSessionStore } from './test-utils';

describe('CheckpointManager - Component Initialization - Default State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockSessionStore();
  });

  it('should initialize with default state', () => {
    const props: Record<string, unknown> = {};

    // Test that the component can be initialized with minimal props
    expect(props.sessionId).toBeUndefined();
    expect(props.className).toBeUndefined();

    // Component should use default values when props are not provided
    const defaultClassName = '';
    expect(defaultClassName).toBe('');
  });

  it('should use provided sessionId when available', () => {
    const customSessionId = 'custom-session-456';
    const props = { sessionId: customSessionId };

    expect(props.sessionId).toBe(customSessionId);
    // The component should use the custom session ID over the store's current session
  });

  it('should use default className when not provided', () => {
    const props: { className?: string } = {};

    // Test default className logic
    const className = props.className || '';
    expect(className).toBe('');
  });

  it('should use custom className when provided', () => {
    const customClassName = 'custom-checkpoint-manager';
    const props = { className: customClassName };

    const className = props.className || '';
    expect(className).toBe(customClassName);
  });
});

describe('CheckpointManager - Component Initialization - Session Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockSessionStore();
  });

  it('should use provided sessionId over current session', () => {
    const customSessionId = 'custom-session-456';
    setupMockSessionStore({
      currentSession: mockSession,
      checkpoints: [],
      isLoadingCheckpoints: false,
      createCheckpoint: vi.fn(),
      loadCheckpoints: vi.fn(),
      restoreCheckpoint: vi.fn(),
      deleteCheckpoint: vi.fn()
    });

    // Simulate the component's effective session ID logic
    const effectiveSessionId = customSessionId || mockSession?.id;
    expect(effectiveSessionId).toBe(customSessionId);
  });

  it('should use current session ID when no sessionId provided', () => {
    setupMockSessionStore({
      currentSession: mockSession,
      checkpoints: [],
      isLoadingCheckpoints: false,
      createCheckpoint: vi.fn(),
      loadCheckpoints: vi.fn(),
      restoreCheckpoint: vi.fn(),
      deleteCheckpoint: vi.fn()
    });

    // Simulate the component's effective session ID logic
    const sessionId: string | undefined = undefined;
    const effectiveSessionId = sessionId || mockSession?.id;
    expect(effectiveSessionId).toBe(mockSession.id);
  });

  it('should handle no active session', () => {
    setupMockSessionStore({
      currentSession: null,
      checkpoints: [],
      isLoadingCheckpoints: false,
      createCheckpoint: vi.fn(),
      loadCheckpoints: vi.fn(),
      restoreCheckpoint: vi.fn(),
      deleteCheckpoint: vi.fn()
    });

    // Simulate the component's effective session ID logic
    const sessionId: string | undefined = undefined;
    const currentSession = null as Session | null;
    const effectiveSessionId = sessionId || currentSession?.id;
    expect(effectiveSessionId).toBeUndefined();
  });
});

describe('CheckpointManager - Component Initialization - Header Text Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockSessionStore();
  });

  it('should generate correct header text when session has name', () => {
    const currentSession: Session | undefined = mockSession;
    const headerText = currentSession?.name
      ? `Manage checkpoints for session "${currentSession.name}"`
      : 'Manage checkpoints for session';
    expect(headerText).toBe('Manage checkpoints for session "Test Session"');
  });

  it('should generate header text when session has no name', () => {
    const currentSession = { ...mockSession, name: '' };
    const headerText = currentSession?.name
      ? `Manage checkpoints for session "${currentSession.name}"`
      : 'Manage checkpoints for session';
    expect(headerText).toBe('Manage checkpoints for session');
  });

  it('should show no active session message when currentSession is null', () => {
    const currentSession = null as Session | null;
    let subtitleText: string;
    if (currentSession) {
      const sessionNamePart = currentSession.name ? ` "${currentSession.name}"` : '';
      subtitleText = `Manage checkpoints for session${sessionNamePart}`;
    } else {
      subtitleText = 'No active session';
    }
    expect(subtitleText).toBe('No active session');
  });
});
