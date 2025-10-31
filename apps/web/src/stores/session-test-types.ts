/**
 * Test types and utilities for session management components
 */

import type { Checkpoint, SessionState, WorkspaceState } from './session-types';

export interface MockSessionStore {
  // Current session state
  currentSession: SessionState | null;
  workspaceState: WorkspaceState;
  sessions: SessionState[];
  checkpoints: Checkpoint[];
  isLoading: boolean;
  isDirty: boolean;
  error: string | null;
  checkpointForm: {
    isOpen: boolean;
    name: string;
    description: string;
    tags: string[];
    priority: 'low' | 'medium' | 'high';
  };
  autoSave: {
    enabled: boolean;
    interval: number;
  };
  isOnline: boolean;

  // Actions
  setCurrentSession: (session: SessionState | null) => void;
  setWorkspaceState: (state: Partial<WorkspaceState>) => void;
  updateWorkspaceState: (updates: Partial<WorkspaceState>) => void;
  setDirty: (dirty: boolean) => void;
  setAutoSave: (enabled: boolean, interval?: number) => void;
  createCheckpoint: (
    name: string,
    description?: string,
    tags?: string[],
    priority?: string
  ) => Promise<string>;
  loadCheckpoints: (sessionId?: string) => Promise<void>;
  restoreCheckpoint: (checkpointId: string) => Promise<void>;
  deleteCheckpoint: (checkpointId: string) => Promise<void>;
  updateCheckpointMetadata: (checkpointId: string, updates: Partial<Checkpoint>) => Promise<void>;
  saveSession: () => Promise<void>;
  restoreSession: (sessionId: string) => Promise<void>;
  createNewSession: (name?: string) => Promise<string>;
  startAutoSave: () => void;
  stopAutoSave: () => void;
  setCheckpointForm: (form: Partial<MockSessionStore['checkpointForm']>) => void;
  resetCheckpointForm: () => void;
  clearSession: () => void;
}

// Type for checkpoint filter in tests
export interface TestCheckpointFilter {
  sessionId?: string;
  limit?: string | number;
  sortBy?: string | number;
  sortOrder?: string | boolean;
}

// Type for window extension in tests
declare global {
  interface Window {
    __vitest__?: boolean;
  }
}
