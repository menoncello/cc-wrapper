/**
 * API functions for session management
 * These functions handle all HTTP requests to the session and checkpoint APIs
 */

import type {
  ApiResponse,
  Checkpoint,
  CheckpointCreateOptions,
  CheckpointFilter,
  CheckpointMetadataUpdates,
  CheckpointRestoreOptions,
  CheckpointsResponse,
  NewSessionConfig,
  Session,
  SessionRestoreOptions,
  SessionRestoreResponse,
  SessionSaveOptions,
  WorkspaceState
} from './session-types';

// API endpoints
const SESSION_API_BASE = '/api/sessions/v1';
const CHECKPOINT_API_BASE = '/api/checkpoints/v1';

/**
 * Handles API errors consistently
 * @param {Response} response - Fetch response object to check
 * @param {string} defaultMessage - Default error message to use if response doesn't contain specific error
 * @throws {Error} Error with descriptive message from response or default message
 * @returns {Promise<never>} Promise that never resolves (always throws)
 */
const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
  let errorMessage = defaultMessage;

  try {
    const errorData = await response.json();
    errorMessage = errorData.error || defaultMessage;
  } catch {
    // Use default message if JSON parsing fails
  }

  throw new Error(errorMessage);
};

/**
 * Creates checkpoint data for API requests
 * @param {string} sessionId - Current session ID
 * @param {string} name - Checkpoint name
 * @param {WorkspaceState} workspaceState - Current workspace state
 * @param {CheckpointCreateOptions} options - Additional checkpoint options
 * @returns {object} Formatted checkpoint data for API
 */
const createCheckpointData = (
  sessionId: string,
  name: string,
  workspaceState: WorkspaceState,
  options: CheckpointCreateOptions
): {
  sessionId: string;
  name: string;
  description?: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  workspaceState: WorkspaceState;
  encryptData: boolean;
  encryptionKey?: string;
  skipDuplicates: boolean;
} => ({
  sessionId,
  name,
  description: options.description,
  tags: options.tags || [],
  priority: options.priority || 'medium',
  workspaceState,
  encryptData: options.encryptData || false,
  encryptionKey: options.encryptionKey,
  skipDuplicates: true
});

/**
 * Creates a new checkpoint
 * @param {string} sessionId - Current session ID
 * @param {string} name - Checkpoint name
 * @param {WorkspaceState} workspaceState - Current workspace state
 * @param {CheckpointCreateOptions} options - Additional checkpoint options
 * @returns {Promise<string>} Promise resolving to checkpoint ID
 */
export const createCheckpointApi = async (
  sessionId: string,
  name: string,
  workspaceState: WorkspaceState,
  options: CheckpointCreateOptions = {}
): Promise<string> => {
  const checkpointData = createCheckpointData(sessionId, name, workspaceState, options);

  const response = await fetch(CHECKPOINT_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(checkpointData)
  });

  if (!response.ok) {
    await handleApiError(response, 'Failed to create checkpoint');
  }

  const result: ApiResponse<{ id: string }> = await response.json();
  return result.data.id;
};

/**
 * Loads checkpoints with optional filtering
 * @param {CheckpointFilter} filter - Optional filter criteria
 * @returns {Promise<Checkpoint[]>} Promise resolving to checkpoints array
 */
/**
 * Adds filter parameter to URLSearchParams
 * @param {URLSearchParams} params - URLSearchParams instance to modify
 * @param {string} key - Parameter key
 * @param {unknown} value - Parameter value
 * @returns {void}
 */
const addFilterParam = (params: URLSearchParams, key: string, value: unknown): void => {
  if (Array.isArray(value)) {
    for (const item of value) {
      params.append(key, String(item));
    }
  } else if (value instanceof Date) {
    params.append(key, value.toISOString());
  } else {
    params.append(key, String(value));
  }
};

export const loadCheckpointsApi = async (filter: CheckpointFilter = {}): Promise<Checkpoint[]> => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null) {
      addFilterParam(params, key, value);
    }
  }

  const response = await fetch(`${CHECKPOINT_API_BASE}?${params}`);

  if (!response.ok) {
    throw new Error('Failed to load checkpoints');
  }

  const result: ApiResponse<CheckpointsResponse> = await response.json();
  return result.data.checkpoints;
};

/**
 * Restores a checkpoint to current session state
 * @param {string} checkpointId - ID of checkpoint to restore
 * @param {CheckpointRestoreOptions} options - Restore options
 * @returns {Promise<SessionRestoreResponse>} Promise resolving to session restore response
 */
export const restoreCheckpointApi = async (
  checkpointId: string,
  options: CheckpointRestoreOptions = {}
): Promise<SessionRestoreResponse> => {
  const restoreData = {
    encryptionKey: options.encryptionKey,
    createBackup: options.createBackup || false,
    backupName: options.backupName
  };

  const response = await fetch(`${CHECKPOINT_API_BASE}/${checkpointId}/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(restoreData)
  });

  if (!response.ok) {
    await handleApiError(response, 'Failed to restore checkpoint');
  }

  const result: ApiResponse<SessionRestoreResponse> = await response.json();
  return result.data;
};

/**
 * Deletes a checkpoint
 * @param {string} checkpointId - ID of checkpoint to delete
 * @returns {Promise<void>} Promise that resolves when checkpoint is deleted
 */
export const deleteCheckpointApi = async (checkpointId: string): Promise<void> => {
  const response = await fetch(`${CHECKPOINT_API_BASE}/${checkpointId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    await handleApiError(response, 'Failed to delete checkpoint');
  }
};

/**
 * Updates checkpoint metadata
 * @param {string} checkpointId - ID of checkpoint to update
 * @param {CheckpointMetadataUpdates} updates - Metadata updates to apply
 * @returns {Promise<Checkpoint>} Promise resolving to updated checkpoint
 */
export const updateCheckpointMetadataApi = async (
  checkpointId: string,
  updates: CheckpointMetadataUpdates
): Promise<Checkpoint> => {
  const response = await fetch(`${CHECKPOINT_API_BASE}/${checkpointId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    await handleApiError(response, 'Failed to update checkpoint');
  }

  const result: ApiResponse<Checkpoint> = await response.json();
  return result.data;
};

/**
 * Saves current session state
 * @param {string} sessionId - Current session ID
 * @param {WorkspaceState} workspaceState - Current workspace state
 * @param {SessionSaveOptions} _options - Save options
 * @returns {Promise<Session>} Promise resolving to updated session
 */
export const saveSessionApi = async (
  sessionId: string,
  workspaceState: WorkspaceState,
  _options: SessionSaveOptions = {}
): Promise<Session> => {
  const response = await fetch(`${SESSION_API_BASE}/${sessionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ workspaceState })
  });

  if (!response.ok) {
    await handleApiError(response, 'Failed to save session');
  }

  const result: ApiResponse<Session> = await response.json();
  return result.data;
};

/**
 * Restores a session from storage
 * @param {string} sessionId - ID of session to restore
 * @param {SessionRestoreOptions} _options - Restore options
 * @returns {Promise<SessionRestoreResponse>} Promise resolving to session restore response
 */
export const restoreSessionApi = async (
  sessionId: string,
  _options: SessionRestoreOptions = {}
): Promise<SessionRestoreResponse> => {
  const response = await fetch(`${SESSION_API_BASE}/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    await handleApiError(response, 'Failed to restore session');
  }

  const result: ApiResponse<SessionRestoreResponse> = await response.json();
  return result.data;
};

/**
 * Creates a new session
 * @param {NewSessionConfig} config - Session configuration
 * @returns {Promise<Session>} Promise resolving to created session
 */
export const createNewSessionApi = async (config: NewSessionConfig): Promise<Session> => {
  const response = await fetch(SESSION_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    await handleApiError(response, 'Failed to create session');
  }

  const result: ApiResponse<Session> = await response.json();
  return result.data;
};

/**
 * Validates session data before API calls
 * @param {string} [sessionId] - Session ID to validate
 * @param {WorkspaceState} [workspaceState] - Workspace state to validate
 * @throws {Error} Error if validation fails
 * @returns {void}
 */
export const validateSessionData = (sessionId?: string, workspaceState?: WorkspaceState): void => {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  if (!workspaceState) {
    throw new Error('Workspace state is required');
  }
};
