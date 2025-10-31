import { CHECKPOINT_API_BASE, DEFAULT_CHECKPOINT_PRIORITY } from './session-store-constants';
import type { Checkpoint, CheckpointFilter } from './session-types';

// Type aliases for complex return types
type PriorityLevel = 'low' | 'medium' | 'high';

interface CheckpointData {
  sessionId: string;
  name: string;
  description?: string;
  tags: string[];
  priority: PriorityLevel;
  workspaceState: unknown;
  encryptData: boolean;
  encryptionKey?: string;
  skipDuplicates: boolean;
}

interface CheckpointOptions {
  description?: string;
  tags?: string[];
  priority?: PriorityLevel;
  encryptData?: boolean;
  encryptionKey?: string;
}

/**
 * Creates checkpoint data object for API requests
 * @param {string} sessionId - The session ID
 * @param {string} name - The checkpoint name
 * @param {unknown} workspaceState - The workspace state to save
 * @param {CheckpointOptions} options - Optional configuration options
 * @param {string} [options.description] - Optional checkpoint description
 * @param {string[]} [options.tags] - Optional array of tags for the checkpoint
 * @param {'low' | 'medium' | 'high'} [options.priority] - Optional priority level (low, medium, high)
 * @param {boolean} [options.encryptData] - Whether to encrypt the checkpoint data
 * @param {string} [options.encryptionKey] - Optional encryption key for the checkpoint
 * @returns {CheckpointData} Checkpoint data object formatted for API requests
 */
function createCheckpointData(
  sessionId: string,
  name: string,
  workspaceState: unknown,
  options: CheckpointOptions = {}
): CheckpointData {
  return {
    sessionId,
    name,
    description: options.description,
    tags: options.tags || [],
    priority: options.priority || DEFAULT_CHECKPOINT_PRIORITY,
    workspaceState,
    encryptData: options.encryptData || false,
    encryptionKey: options.encryptionKey,
    skipDuplicates: true
  };
}

/**
 * Handles API response errors
 * @param {Response} response - The fetch response object to check
 * @param {string} defaultMessage - Default error message to use if response doesn't contain specific error
 * @throws {Error} Error with appropriate message from response or default message
 * @returns {Promise<never>} Promise that never resolves (always throws)
 */
async function handleApiResponse(response: Response, defaultMessage: string): Promise<never> {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || defaultMessage);
  }
  // If response is ok, this shouldn't be called for error handling
  throw new Error(defaultMessage);
}

/**
 * Adds array parameters to URL search params
 * @param {URLSearchParams} params - The URLSearchParams instance to add to
 * @param {string} key - The parameter key to add
 * @param {unknown[]} value - The array of values to add
 * @returns {void}
 */
function addArrayParam(params: URLSearchParams, key: string, value: unknown[]): void {
  for (const v of value) {
    params.append(key, String(v));
  }
}

/**
 * Adds single parameter to URL search params
 * @param {URLSearchParams} params - The URLSearchParams instance to add to
 * @param {string} key - The parameter key to add
 * @param {unknown} value - The value to add
 * @returns {void}
 */
function addSingleParam(params: URLSearchParams, key: string, value: unknown): void {
  params.append(key, String(value));
}

/**
 * Creates URL search parameters from filter object
 * @param {CheckpointFilter} filter - The checkpoint filter object containing search criteria
 * @returns {URLSearchParams} URLSearchParams instance with encoded filter criteria
 */
function createSearchParams(filter: CheckpointFilter): URLSearchParams {
  const params = new globalThis.URLSearchParams();

  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        addArrayParam(params, key, value);
      } else {
        addSingleParam(params, key, value);
      }
    }
  }

  return params;
}

/**
 * Validates checkpoint creation prerequisites
 * @param {string} sessionId - The session ID to validate
 * @param {unknown} workspaceState - The workspace state to validate
 * @throws {Error} If session ID or workspace state is missing
 * @returns {void}
 */
function validateCheckpointCreation(sessionId: string, workspaceState: unknown): void {
  if (!sessionId || !workspaceState) {
    throw new Error('No active session to checkpoint');
  }
}

/**
 * Makes API request to create checkpoint
 * @param {string} name - The name of the checkpoint
 * @param {string} sessionId - The session ID
 * @param {unknown} workspaceState - The workspace state to checkpoint
 * @param {CheckpointOptions} options - Optional configuration for the checkpoint
 * @returns {Promise<string>} Promise resolving to the created checkpoint ID
 */
async function createCheckpointRequest(
  name: string,
  sessionId: string,
  workspaceState: unknown,
  options: CheckpointOptions
): Promise<string> {
  const checkpointData = createCheckpointData(sessionId, name, workspaceState, options);

  const response = await fetch(CHECKPOINT_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(checkpointData)
  });

  await handleApiResponse(response, 'Failed to create checkpoint');

  const result = await response.json();
  const checkpoint = result.data;

  return checkpoint.id;
}

/**
 * Creates a new checkpoint for the current session
 * @param {CreateCheckpointParams} params - The checkpoint creation parameters
 * @param {string} params.sessionId - The session ID to create checkpoint for
 * @param {unknown} params.workspaceState - The workspace state to checkpoint
 * @param {(creating: boolean) => void} params.setIsCreating - Function to set creating state (loading indicator)
 * @param {(filter?: CheckpointFilter) => Promise<void>} params.loadCheckpoints - Function to reload checkpoints after creation
 * @param {string} params.name - The name of the checkpoint
 * @param {CheckpointOptions} [params.options={}] - Optional configuration for the checkpoint
 * @param {string} [params.options.description] - Optional checkpoint description
 * @param {string[]} [params.options.tags] - Optional array of tags for the checkpoint
 * @param {PriorityLevel} [params.options.priority] - Optional priority level (low, medium, high)
 * @param {boolean} [params.options.encryptData] - Whether to encrypt the checkpoint data
 * @param {string} [params.options.encryptionKey] - Optional encryption key for the checkpoint
 * @returns {Promise<string>} Promise resolving to the created checkpoint ID
 */
export async function createCheckpoint(params: CreateCheckpointParams): Promise<string> {
  const { sessionId, workspaceState, setIsCreating, loadCheckpoints, name, options = {} } = params;

  validateCheckpointCreation(sessionId, workspaceState);

  setIsCreating(true);

  try {
    const checkpointId = await createCheckpointRequest(name, sessionId, workspaceState, options);

    // Refresh checkpoints list
    await loadCheckpoints({ sessionId });

    return checkpointId;
  } finally {
    setIsCreating(false);
  }
}

/**
 * Loads checkpoints from the server with optional filtering
 * @param {LoadCheckpointsParams} params - The load checkpoints parameters
 * @param {(loading: boolean) => void} params.setIsLoading - Function to set loading state (loading indicator)
 * @param {(checkpoints: Checkpoint[]) => void} params.setCheckpoints - Function to set checkpoints data in state
 * @param {(filter: CheckpointFilter) => void} params.setCheckpointFilter - Function to set current filter in state
 * @param {CheckpointFilter} params.currentFilter - Current filter state from store
 * @param {CheckpointFilter} [params.filter={}] - Optional filter criteria for loading checkpoints
 * @returns {Promise<void>} Promise that resolves when checkpoints are loaded and state is updated
 */
export async function loadCheckpoints(params: LoadCheckpointsParams): Promise<void> {
  const { setIsLoading, setCheckpoints, setCheckpointFilter, currentFilter, filter = {} } = params;

  setIsLoading(true);

  try {
    const searchParams = createSearchParams({ ...currentFilter, ...filter });

    const response = await fetch(`${CHECKPOINT_API_BASE}?${searchParams}`);

    await handleApiResponse(response, 'Failed to load checkpoints');

    const result = await response.json();
    setCheckpoints(result.data.checkpoints);
    setCheckpointFilter({ ...currentFilter, ...filter });
  } finally {
    setIsLoading(false);
  }
}

// Type for restore options
interface RestoreOptions {
  createBackup?: boolean;
  backupName?: string;
  encryptionKey?: string;
}

// Type for session state updates
interface SessionStateUpdate {
  currentSession: unknown;
  workspaceState: unknown;
  isDirty: boolean;
  lastSaved: Date;
}

/**
 * Makes API request to restore checkpoint
 * @param {string} checkpointId - The ID of the checkpoint to restore
 * @param {RestoreOptions} options - Optional restore configuration
 * @returns {Promise<unknown>} Promise resolving to restore result
 */
async function restoreCheckpointRequest(
  checkpointId: string,
  options: RestoreOptions
): Promise<unknown> {
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

  await handleApiResponse(response, 'Failed to restore checkpoint');

  const result = await response.json();
  return result.data;
}

/**
 * Updates session state after successful restore
 * @param {(state: Partial<SessionStateUpdate>) => void} setState - Function to update session state
 * @param {unknown} restoreData - Data from the restore response
 * @returns {void}
 */
function updateSessionStateAfterRestore(
  setState: (state: Partial<SessionStateUpdate>) => void,
  restoreData: unknown
): void {
  const data = restoreData as { session: unknown; workspaceState: unknown };

  setState({
    currentSession: data.session,
    workspaceState: data.workspaceState,
    isDirty: false,
    lastSaved: new Date()
  });
}

/**
 * Restores a checkpoint to become the current session state
 * @param {RestoreCheckpointParams} params - The restore checkpoint parameters
 * @param {(restoring: boolean) => void} params.setIsRestoring - Function to set restoring state (loading indicator)
 * @param {(state: Partial<SessionStateUpdate>) => void} params.setState - Function to update session state after restore
 * @param {(filter?: CheckpointFilter) => Promise<void>} params.loadCheckpoints - Function to reload checkpoints after restore
 * @param {string} params.checkpointId - The ID of the checkpoint to restore
 * @param {RestoreOptions} [params.options={}] - Optional restore configuration
 * @param {boolean} [params.options.createBackup] - Whether to create a backup before restoring
 * @param {string} [params.options.backupName] - Optional name for the backup
 * @param {string} [params.options.encryptionKey] - Optional encryption key for the checkpoint
 * @returns {Promise<boolean>} Promise resolving to true if restore was successful
 */
export async function restoreCheckpoint(params: RestoreCheckpointParams): Promise<boolean> {
  const { setIsRestoring, setState, loadCheckpoints, checkpointId, options = {} } = params;

  setIsRestoring(true);

  try {
    const restoreData = await restoreCheckpointRequest(checkpointId, options);

    updateSessionStateAfterRestore(setState, restoreData);

    // Refresh checkpoints
    const sessionData = restoreData as { session: { id: string } };
    await loadCheckpoints({ sessionId: sessionData.session.id });

    return true;
  } finally {
    setIsRestoring(false);
  }
}

// Type for checkpoint metadata updates
interface CheckpointMetadataUpdates {
  name?: string;
  description?: string;
  tags?: string[];
  priority?: PriorityLevel;
}

// Type for create checkpoint parameters
interface CreateCheckpointParams {
  sessionId: string;
  workspaceState: unknown;
  setIsCreating: (creating: boolean) => void;
  loadCheckpoints: (filter?: CheckpointFilter) => Promise<void>;
  name: string;
  options?: CheckpointOptions;
}

// Type for load checkpoints parameters
interface LoadCheckpointsParams {
  setIsLoading: (loading: boolean) => void;
  setCheckpoints: (checkpoints: Checkpoint[]) => void;
  setCheckpointFilter: (filter: CheckpointFilter) => void;
  currentFilter: CheckpointFilter;
  filter?: CheckpointFilter;
}

// Type for restore checkpoint parameters
interface RestoreCheckpointParams {
  setIsRestoring: (restoring: boolean) => void;
  setState: (state: Partial<SessionStateUpdate>) => void;
  loadCheckpoints: (filter?: CheckpointFilter) => Promise<void>;
  checkpointId: string;
  options?: RestoreOptions;
}

/**
 * Deletes a checkpoint
 * @param {(update: (prev: Checkpoint[]) => Checkpoint[]) => void} setCheckpoints - Function to update checkpoints list in state
 * @param {string} checkpointId - The ID of the checkpoint to delete
 * @returns {Promise<void>} Promise that resolves when checkpoint is deleted and state is updated
 */
export async function deleteCheckpoint(
  setCheckpoints: (update: (prev: Checkpoint[]) => Checkpoint[]) => void,
  checkpointId: string
): Promise<void> {
  const response = await fetch(`${CHECKPOINT_API_BASE}/${checkpointId}`, {
    method: 'DELETE'
  });

  await handleApiResponse(response, 'Failed to delete checkpoint');

  // Update local state
  setCheckpoints(prev => prev.filter(cp => cp.id !== checkpointId));
}

/**
 * Updates metadata for an existing checkpoint
 * @param {(update: (prev: Checkpoint[]) => Checkpoint[]) => void} setCheckpoints - Function to update checkpoints list in state
 * @param {string} checkpointId - The ID of the checkpoint to update
 * @param {CheckpointMetadataUpdates} updates - The metadata updates to apply
 * @param {string} [updates.name] - Optional new name for the checkpoint
 * @param {string} [updates.description] - Optional new description for the checkpoint
 * @param {string[]} [updates.tags] - Optional new array of tags for the checkpoint
 * @param {'low' | 'medium' | 'high'} [updates.priority] - Optional new priority level for the checkpoint
 * @returns {Promise<void>} Promise that resolves when metadata is updated and state is updated
 */
export async function updateCheckpointMetadata(
  setCheckpoints: (update: (prev: Checkpoint[]) => Checkpoint[]) => void,
  checkpointId: string,
  updates: CheckpointMetadataUpdates
): Promise<void> {
  const response = await fetch(`${CHECKPOINT_API_BASE}/${checkpointId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  await handleApiResponse(response, 'Failed to update checkpoint');

  const result = await response.json();
  const updatedCheckpoint = result.data;

  // Update local state
  setCheckpoints(prev => prev.map(cp => (cp.id === checkpointId ? updatedCheckpoint : cp)));
}
