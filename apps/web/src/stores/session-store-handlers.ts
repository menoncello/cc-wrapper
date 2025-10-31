import {
  createCheckpointApi,
  createNewSessionApi,
  restoreCheckpointApi,
  restoreSessionApi,
  saveSessionApi
} from './session-api';
import type {
  CheckpointCreateOptions,
  CheckpointRestoreOptions,
  NewSessionConfig,
  SessionRestoreOptions,
  SessionSaveOptions,
  SessionState
} from './session-types';
import {
  validateCheckpointName,
  validateCheckpointPriority,
  validateCheckpointTags
} from './session-utils';

/**
 * Validates checkpoint creation parameters
 * @param {string} name - Checkpoint name to validate
 * @param {CheckpointCreateOptions} [options] - Additional checkpoint creation options
 * @returns {void}
 * @throws {Error} if validation fails
 */
const validateCheckpointCreateParams = (name: string, options?: CheckpointCreateOptions): void => {
  validateCheckpointName(name);

  if (options?.priority) {
    validateCheckpointPriority(options.priority);
  }

  if (options?.tags) {
    validateCheckpointTags(options.tags);
  }
};

/**
 * Handles checkpoint creation with proper error handling and state management
 * @param {function} set - Zustand set function to update state
 * @param {function} get - Zustand get function to access current state
 * @param {string} name - Checkpoint name
 * @param {CheckpointCreateOptions} [options] - Additional checkpoint creation options
 * @returns {Promise<string>} Promise resolving to checkpoint ID
 */
export const handleCreateCheckpoint = async (
  set: (partial: Partial<SessionState>) => void,
  get: () => SessionState,
  name: string,
  options?: CheckpointCreateOptions
): Promise<string> => {
  const { currentSession, workspaceState } = get();

  if (!currentSession?.id || !workspaceState) {
    throw new Error('No active session to checkpoint');
  }

  validateCheckpointCreateParams(name, options);

  set({ isCreatingCheckpoint: true });

  try {
    const checkpointId = await createCheckpointApi(
      currentSession.id,
      name,
      workspaceState,
      options
    );

    // Refresh checkpoints list
    await get().loadCheckpoints({ sessionId: currentSession.id });

    return checkpointId;
  } finally {
    set({ isCreatingCheckpoint: false });
  }
};

/**
 * Handles checkpoint restoration with state updates
 * @param {function} set - Zustand set function to update state
 * @param {function} get - Zustand get function to access current state
 * @param {string} checkpointId - ID of checkpoint to restore
 * @param {CheckpointRestoreOptions} [options] - Additional restoration options
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const handleRestoreCheckpoint = async (
  set: (partial: Partial<SessionState>) => void,
  get: () => SessionState,
  checkpointId: string,
  options?: CheckpointRestoreOptions
): Promise<boolean> => {
  set({ isRestoringCheckpoint: true });

  try {
    const restoreResult = await restoreCheckpointApi(checkpointId, options);

    // Update current session and workspace state
    set({
      currentSession: restoreResult.session,
      workspaceState: restoreResult.workspaceState,
      isDirty: false,
      lastSaved: new Date()
    });

    // Refresh checkpoints
    await get().loadCheckpoints({ sessionId: restoreResult.session.id });

    return true;
  } finally {
    set({ isRestoringCheckpoint: false });
  }
};

/**
 * Handles session saving with validation
 * @param {function} set - Zustand set function to update state
 * @param {function} get - Zustand get function to access current state
 * @param {SessionSaveOptions} options - Session save options
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const handleSaveSession = async (
  set: (partial: Partial<SessionState>) => void,
  get: () => SessionState,
  options: SessionSaveOptions = {}
): Promise<boolean> => {
  const { currentSession, workspaceState, isDirty } = get();

  if (!currentSession?.id || !workspaceState) {
    return false;
  }

  // Don't save if not dirty unless force is enabled
  if (!isDirty && !options.force) {
    return true; // Return true as no save is needed
  }

  try {
    const updatedSession = await saveSessionApi(currentSession.id, workspaceState, options);
    set({
      currentSession: updatedSession,
      isDirty: false,
      lastSaved: new Date()
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Handles session restoration
 * @param {function} set - Zustand set function to update state
 * @param {function} get - Zustand get function to access current state
 * @param {string} sessionId - Session ID to restore
 * @param {SessionRestoreOptions} options - Session restoration options
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const handleRestoreSession = async (
  set: (partial: Partial<SessionState>) => void,
  get: () => SessionState,
  sessionId: string,
  options: SessionRestoreOptions = {}
): Promise<boolean> => {
  try {
    const restoreResult = await restoreSessionApi(sessionId, options);

    set({
      currentSession: restoreResult.session,
      workspaceState: restoreResult.workspaceState,
      isDirty: false,
      lastSaved: new Date()
    });

    // Load checkpoints for the restored session
    await get().loadCheckpoints({ sessionId: restoreResult.session.id });

    return true;
  } catch {
    return false;
  }
};

/**
 * Handles new session creation
 * @param {function} set - Zustand set function to update state
 * @param {NewSessionConfig} config - New session configuration
 * @returns {Promise<string>} Promise resolving to new session ID
 */
export const handleCreateNewSession = async (
  set: (partial: Partial<SessionState>) => void,
  config: NewSessionConfig
): Promise<string> => {
  const session = await createNewSessionApi(config);

  set({
    currentSession: session,
    workspaceState: config.workspaceState,
    isDirty: false,
    lastSaved: new Date(),
    checkpoints: []
  });

  return session.id;
};
