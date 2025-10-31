import * as React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Test environment detection
const isTestEnvironment =
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
  (typeof window !== 'undefined' && window.__vitest__ !== undefined);

import {
  deleteCheckpointApi,
  loadCheckpointsApi,
  updateCheckpointMetadataApi
} from './session-api';
import { autoSaveUtils } from './session-store-autosave';
import {
  DEFAULT_AUTO_SAVE_INTERVAL,
  DEFAULT_CHECKPOINT_LIMIT,
  DEFAULT_CHECKPOINT_PRIORITY,
  DEFAULT_CHECKPOINT_SORT_BY,
  DEFAULT_CHECKPOINT_SORT_ORDER
} from './session-store-constants';
import {
  handleCreateCheckpoint,
  handleCreateNewSession,
  handleRestoreCheckpoint,
  handleRestoreSession,
  handleSaveSession
} from './session-store-handlers';
import type {
  CheckpointCreateOptions,
  CheckpointFilter,
  CheckpointMetadataUpdates,
  CheckpointPriority,
  CheckpointRestoreOptions,
  NewSessionConfig,
  Session,
  SessionRestoreOptions,
  SessionSaveOptions,
  SessionState,
  WorkspaceState
} from './session-types';
import { createDefaultCheckpointFilter } from './session-utils';

/**
 * Initial state for session store
 */
const initialState: Omit<
  SessionState,
  | 'setCurrentSession'
  | 'setWorkspaceState'
  | 'updateWorkspaceState'
  | 'setDirty'
  | 'setAutoSave'
  | 'createCheckpoint'
  | 'loadCheckpoints'
  | 'restoreCheckpoint'
  | 'deleteCheckpoint'
  | 'updateCheckpointMetadata'
  | 'saveSession'
  | 'restoreSession'
  | 'createNewSession'
  | 'startAutoSave'
  | 'stopAutoSave'
  | 'setCheckpointForm'
  | 'resetCheckpointForm'
  | 'clearSession'
> = {
  currentSession: null,
  workspaceState: null,
  isDirty: false,
  lastSaved: null,
  autoSaveEnabled: true,
  autoSaveInterval: DEFAULT_AUTO_SAVE_INTERVAL,
  checkpoints: [],
  checkpointFilter: createDefaultCheckpointFilter({
    limit: DEFAULT_CHECKPOINT_LIMIT,
    sortBy: DEFAULT_CHECKPOINT_SORT_BY,
    sortOrder: DEFAULT_CHECKPOINT_SORT_ORDER
  }),
  isLoadingCheckpoints: false,
  isCreatingCheckpoint: false,
  isRestoringCheckpoint: false,
  checkpointName: '',
  checkpointDescription: '',
  checkpointTags: [],
  checkpointPriority: DEFAULT_CHECKPOINT_PRIORITY
};

/**
 * Creates current session setter
 */
const createSetCurrentSession =
  (set: (fn: (state: SessionState) => Partial<SessionState>) => void) =>
  (session: Session | null): void => {
    set(() => ({ currentSession: session }));
  };

/**
 * Creates workspace state setter
 */
const createSetWorkspaceState =
  (set: (fn: (state: SessionState) => Partial<SessionState>) => void) =>
  (state: WorkspaceState | null): void => {
    set(() => ({
      workspaceState: state,
      isDirty: true
    }));
  };

/**
 * Creates workspace state updater
 */
const createUpdateWorkspaceState =
  (set: (fn: (state: SessionState) => Partial<SessionState>) => void) =>
  (updates: Partial<WorkspaceState>): void => {
    set((currentState: SessionState) => ({
      workspaceState: currentState.workspaceState
        ? { ...currentState.workspaceState, ...updates }
        : null,
      isDirty: true
    }));
  };

/**
 * Creates dirty state setter
 * @param {function} set - Zustand set function to update state
 * @returns {function} Dirty state setter function
 */
const createSetDirty =
  (set: (fn: (state: SessionState) => Partial<SessionState>) => void) =>
  (dirty: boolean): void => {
    set(() => ({ isDirty: dirty }));
  };

/**
 * Creates auto-save setter
 * @param {function} set - Zustand set function to update state
 * @returns {function} Auto-save setter function
 */
const createSetAutoSave =
  (set: (fn: (state: SessionState) => Partial<SessionState>) => void) =>
  (enabled: boolean, interval?: number): void => {
    set((currentState: SessionState) => ({
      autoSaveEnabled: enabled,
      autoSaveInterval: interval ?? currentState.autoSaveInterval
    }));
  };

/**
 * Creates basic session state setters
 * @param {function} set - Zustand set function to update state
 * @param {function} _get - Zustand get function to access current state
 * @returns {object} Basic session state setters
 */
const createBasicSessionSetters = (
  set: (fn: (state: SessionState) => Partial<SessionState>) => void,
  _get: () => SessionState
): Record<string, unknown> => ({
  setCurrentSession: createSetCurrentSession(set),
  setWorkspaceState: createSetWorkspaceState(set),
  updateWorkspaceState: createUpdateWorkspaceState(set),
  setDirty: createSetDirty(set),
  setAutoSave: createSetAutoSave(set)
});

/**
 * Creates load checkpoints action
 * @param {function} set - Zustand set function to update state
 * @param {function} get - Zustand get function to access current state
 * @returns {function} Load checkpoints action function
 */
const createLoadCheckpointsAction =
  (set: (fn: (state: SessionState) => Partial<SessionState>) => void, get: () => SessionState) =>
  async (filter: CheckpointFilter = {}): Promise<void> => {
    set(() => ({ isLoadingCheckpoints: true }));

    try {
      const finalFilter = { ...get().checkpointFilter, ...filter };
      const checkpoints = await loadCheckpointsApi(finalFilter);
      set(() => ({
        checkpoints,
        checkpointFilter: finalFilter
      }));
    } finally {
      set(() => ({ isLoadingCheckpoints: false }));
    }
  };

/**
 * Creates delete checkpoint action
 * @param {function} set - Zustand set function to update state
 * @returns {function} Delete checkpoint action function
 */
const createDeleteCheckpointAction =
  (set: (fn: (state: SessionState) => Partial<SessionState>) => void) =>
  async (checkpointId: string): Promise<void> => {
    await deleteCheckpointApi(checkpointId);
    set((currentState: SessionState) => ({
      checkpoints: currentState.checkpoints.filter(cp => cp.id !== checkpointId)
    }));
  };

/**
 * Creates update checkpoint metadata action
 * @param {function} set - Zustand set function to update state
 * @returns {function} Update checkpoint metadata action function
 */
const createUpdateCheckpointMetadataAction =
  (set: (fn: (state: SessionState) => Partial<SessionState>) => void) =>
  async (checkpointId: string, updates: CheckpointMetadataUpdates): Promise<void> => {
    const updatedCheckpoint = await updateCheckpointMetadataApi(checkpointId, updates);
    set((currentState: SessionState) => ({
      checkpoints: currentState.checkpoints.map(cp =>
        cp.id === checkpointId ? updatedCheckpoint : cp
      )
    }));
  };

/**
 * Creates set checkpoint form action
 * @param {function} set - Zustand set function to update state
 * @param {function} get - Zustand get function to access current state
 * @returns {function} Set checkpoint form action function
 */
const createSetCheckpointFormAction =
  (set: (fn: (state: SessionState) => Partial<SessionState>) => void, get: () => SessionState) =>
  (data: {
    name?: string;
    description?: string;
    tags?: string[];
    priority?: CheckpointPriority;
  }): void => {
    const currentState = get();
    set(() => ({
      checkpointName: data.name ?? currentState.checkpointName,
      checkpointDescription: data.description ?? currentState.checkpointDescription,
      checkpointTags: data.tags ?? currentState.checkpointTags,
      checkpointPriority: data.priority ?? currentState.checkpointPriority
    }));
  };

/**
 * Creates reset checkpoint form action
 * @param {function} set - Zustand set function to update state
 * @returns {function} Reset checkpoint form action function
 */
const createResetCheckpointFormAction =
  (set: (fn: (state: SessionState) => Partial<SessionState>) => void) => (): void => {
    set(() => ({
      checkpointName: '',
      checkpointDescription: '',
      checkpointTags: [],
      checkpointPriority: DEFAULT_CHECKPOINT_PRIORITY
    }));
  };

/**
 * Creates clear session action
 * @param {function} set - Zustand set function to update state
 * @returns {function} Clear session action function
 */
const createClearSessionAction =
  (set: (fn: (state: SessionState) => Partial<SessionState>) => void) => (): void => {
    set(() => ({
      currentSession: null,
      workspaceState: null,
      isDirty: false,
      lastSaved: null,
      checkpoints: []
    }));
  };

/**
 * Creates checkpoint form actions
 * @param {function} set - Zustand set function to update state
 * @param {function} get - Zustand get function to access current state
 * @returns {object} Checkpoint form actions
 */
const createCheckpointFormActions = (
  set: (fn: (state: SessionState) => Partial<SessionState>) => void,
  get: () => SessionState
): Record<string, unknown> => ({
  setCheckpointForm: createSetCheckpointFormAction(set, get),
  resetCheckpointForm: createResetCheckpointFormAction(set),
  clearSession: createClearSessionAction(set)
});

/**
 * Creates checkpoint management actions
 * @param {function} set - Zustand set function to update state
 * @param {function} get - Zustand get function to access current state
 * @returns {object} Checkpoint management actions
 */
const createCheckpointActions = (
  set: (fn: (state: SessionState) => Partial<SessionState>) => void,
  get: () => SessionState
): Record<string, unknown> => ({
  loadCheckpoints: createLoadCheckpointsAction(set, get),
  deleteCheckpoint: createDeleteCheckpointAction(set),
  updateCheckpointMetadata: createUpdateCheckpointMetadataAction(set),
  ...createCheckpointFormActions(set, get)
});

/**
 * Creates session state setters and actions
 * @param {function} set - Zustand set function to update state
 * @param {function} get - Zustand get function to access current state
 * @returns {object} Object containing session state setters and actions
 */
const createSessionActions = (
  set: (fn: (state: SessionState) => Partial<SessionState>) => void,
  get: () => SessionState
): Record<string, unknown> => ({
  ...createBasicSessionSetters(set, get),
  ...createCheckpointActions(set, get)
});

/**
 * Creates and exports the session store with persistence
 * Uses different storage strategies for test vs production environments
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) =>
      ({
        ...initialState,
        ...createSessionActions(set, get),

        createCheckpoint: (name: string, options?: CheckpointCreateOptions): Promise<string> =>
          handleCreateCheckpoint(set, get, name, options),

        restoreCheckpoint: (
          checkpointId: string,
          options?: CheckpointRestoreOptions
        ): Promise<boolean> => handleRestoreCheckpoint(set, get, checkpointId, options),

        saveSession: (options: SessionSaveOptions = {}): Promise<boolean> =>
          handleSaveSession(set, get, options),

        restoreSession: (
          sessionId: string,
          options: SessionRestoreOptions = {}
        ): Promise<boolean> => handleRestoreSession(set, get, sessionId, options),

        createNewSession: (config: NewSessionConfig): Promise<string> =>
          handleCreateNewSession(set, config),

        startAutoSave: (): void => autoSaveUtils.start(get),
        stopAutoSave: (): void => autoSaveUtils.stop()
      }) as SessionState,
    {
      name: 'session-store',
      storage: isTestEnvironment
        ? createJSONStorage(() => {
            // In test environment, use memory storage
            const memoryStorage: Record<string, string> = {};
            return {
              getItem: (key: string) => memoryStorage[key] || null,
              setItem: (key: string, value: string) => {
                memoryStorage[key] = value;
              },
              removeItem: (key: string) => {
                delete memoryStorage[key];
              }
            };
          })
        : createJSONStorage(() => localStorage),
      partialize: state => ({
        autoSaveEnabled: state.autoSaveEnabled,
        autoSaveInterval: state.autoSaveInterval,
        checkpointFilter: state.checkpointFilter
      })
    }
  )
);

/**
 * Hook for managing session auto-save functionality
 * Automatically starts or stops auto-save based on the enabled state
 * @returns {void}
 */
export const useSessionAutoSave = (): void => {
  const { autoSaveEnabled, startAutoSave, stopAutoSave } = useSessionStore();

  // Start/stop auto-save based on enabled state
  React.useEffect(() => {
    if (autoSaveEnabled) {
      startAutoSave();
    } else {
      stopAutoSave();
    }

    return () => stopAutoSave();
  }, [autoSaveEnabled]);
};

// Export types for use in components
export type {
  Checkpoint,
  CheckpointFilter,
  CheckpointPriority,
  CheckpointRestoreOptions,
  Session,
  SessionState,
  WorkspaceState
} from './session-types';
