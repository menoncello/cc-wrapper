import { SESSION_API_BASE } from './session-store-constants';
import type { Session, WorkspaceState } from './session-types';

// Type definitions for session state updates
interface SessionStateUpdate {
  currentSession: unknown;
  isDirty: boolean;
  lastSaved: Date;
}

interface FullSessionStateUpdate {
  currentSession: unknown;
  workspaceState: unknown;
  isDirty: boolean;
  lastSaved: Date;
}

// Type for save session options
interface SaveSessionOptions {
  force?: boolean;
}

// Type for restore session options
interface RestoreSessionOptions {
  encryptionKey?: string;
  createBackup?: boolean;
}

// Type for new session configuration
interface NewSessionConfig {
  userId: string;
  workspaceId: string;
  name: string;
  workspaceState: WorkspaceState;
  encryptionKey?: string;
}

/**
 * Handles API response errors for session operations
 * @param {Response} response - The fetch response object to check
 * @param {string} defaultMessage - Default error message to use if response doesn't contain specific error
 * @throws {Error} Error with appropriate message from response or default message
 * @returns {Promise<void>} Promise that throws on error response
 */
async function handleSessionApiResponse(response: Response, defaultMessage: string): Promise<void> {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || defaultMessage);
  }
}

/**
 * Validates session data before saving
 * @param {Session} currentSession - The current session object to validate
 * @param {WorkspaceState} workspaceState - The workspace state to validate
 * @throws {Error} If session or workspace state is missing
 * @returns {void}
 */
function validateSessionData(currentSession: Session, workspaceState: WorkspaceState): void {
  if (!currentSession || !workspaceState) {
    throw new Error('No active session to save');
  }
}

/**
 * Updates session state after successful save
 * @param {(state: Partial<SessionStateUpdate>) => void} setState - Function to update session state
 * @param {unknown} sessionData - The updated session data from API response
 * @returns {void}
 */
function updateSessionStateAfterSave(
  setState: (state: Partial<SessionStateUpdate>) => void,
  sessionData: unknown
): void {
  setState({
    currentSession: sessionData,
    isDirty: false,
    lastSaved: new Date()
  });
}

/**
 * Saves the current session state to the server
 * @param {Session | null} currentSession - The current session object to save
 * @param {WorkspaceState | null} workspaceState - The workspace state to save
 * @param {boolean} isDirty - Whether the session has unsaved changes
 * @param {(state: Partial<SessionStateUpdate>) => void} setState - Function to update session state after save
 * @param {SaveSessionOptions} [options={}] - Optional save configuration
 * @param {boolean} [options.force] - Whether to force save even if not dirty
 * @returns {Promise<boolean>} Promise resolving to true if save was successful, false otherwise
 */
// Type for save session parameters
interface SaveSessionParams {
  currentSession: Session | null;
  workspaceState: WorkspaceState | null;
  isDirty: boolean;
  setState: (state: Partial<SessionStateUpdate>) => void;
  options?: SaveSessionOptions;
}

/**
 * Validates if session should be saved
 * @param {boolean} isDirty - Whether the session has unsaved changes
 * @param {SaveSessionOptions} options - Save options
 * @returns {boolean} Whether session should be saved
 */
function shouldSaveSession(isDirty: boolean, options: SaveSessionOptions): boolean {
  return options.force || isDirty;
}

/**
 * Makes API request to save session
 * @param {Session} currentSession - The current session to save
 * @param {WorkspaceState} workspaceState - The workspace state to save
 * @returns {Promise<unknown>} Promise resolving to save result
 */
async function saveSessionRequest(
  currentSession: Session,
  workspaceState: WorkspaceState
): Promise<unknown> {
  const response = await fetch(`${SESSION_API_BASE}/${currentSession.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workspaceState
    })
  });

  await handleSessionApiResponse(response, 'Failed to save session');

  const result = await response.json();
  return result.data;
}

/**
 * Saves the current session state to the server
 * @param {SaveSessionParams} params - The save session parameters
 * @param {Session | null} params.currentSession - The current session object to save
 * @param {WorkspaceState | null} params.workspaceState - The workspace state to save
 * @param {boolean} params.isDirty - Whether the session has unsaved changes
 * @param {(state: Partial<SessionStateUpdate>) => void} params.setState - Function to update session state after save
 * @param {SaveSessionOptions} [params.options={}] - Optional save configuration
 * @param {boolean} [params.options.force] - Whether to force save even if not dirty
 * @returns {Promise<boolean>} Promise resolving to true if save was successful, false otherwise
 */
export async function saveSession(params: SaveSessionParams): Promise<boolean> {
  const { currentSession, workspaceState, isDirty, setState, options = {} } = params;

  if (!shouldSaveSession(isDirty, options)) {
    return true; // Nothing to save
  }

  if (!currentSession || !workspaceState) {
    throw new Error('No active session to save');
  }

  try {
    validateSessionData(currentSession, workspaceState);

    const result = await saveSessionRequest(currentSession, workspaceState);
    updateSessionStateAfterSave(setState, result);

    return true;
  } catch {
    // Error logging removed - consider using proper error tracking service
    return false;
  }
}

/**
 * Makes API request to restore session
 * @param {string} sessionId - The ID of the session to restore
 * @returns {Promise<unknown>} Promise resolving to restore result
 */
async function restoreSessionRequest(sessionId: string): Promise<unknown> {
  const response = await fetch(`${SESSION_API_BASE}/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  await handleSessionApiResponse(response, 'Failed to restore session');

  const result = await response.json();
  return result.data;
}

/**
 * Updates full session state after successful restore
 * @param {(state: Partial<FullSessionStateUpdate>) => void} setState - Function to update session state
 * @param {unknown} restoreData - Data from the restore response
 * @returns {void}
 */
function updateFullSessionState(
  setState: (state: Partial<FullSessionStateUpdate>) => void,
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
 * Restores a session from the server
 * @param {string} sessionId - The ID of the session to restore
 * @param {(state: Partial<FullSessionStateUpdate>) => void} setState - Function to update session state after restore
 * @param {RestoreSessionOptions} _options - Optional restore configuration
 * @returns {Promise<boolean>} Promise resolving to true if restore was successful, false otherwise
 */
export async function restoreSession(
  sessionId: string,
  setState: (state: Partial<FullSessionStateUpdate>) => void,
  _options: RestoreSessionOptions = {}
): Promise<boolean> {
  try {
    const restoreData = await restoreSessionRequest(sessionId);
    updateFullSessionState(setState, restoreData);

    return true;
  } catch {
    // Error logging removed - consider using proper error tracking service
    return false;
  }
}

/**
 * Makes API request to create new session
 * @param {NewSessionConfig} config - Configuration for the new session
 * @returns {Promise<unknown>} Promise resolving to created session data
 */
async function createNewSessionRequest(config: NewSessionConfig): Promise<unknown> {
  const response = await fetch(SESSION_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  });

  await handleSessionApiResponse(response, 'Failed to create session');

  const result = await response.json();
  return result.data;
}

/**
 * Updates session state after successful creation
 * @param {(state: Partial<FullSessionStateUpdate>) => void} setState - Function to update session state
 * @param {unknown} sessionData - The created session data
 * @param {WorkspaceState} workspaceState - The initial workspace state
 * @returns {void}
 */
function updateSessionStateAfterCreation(
  setState: (state: Partial<FullSessionStateUpdate>) => void,
  sessionData: unknown,
  workspaceState: WorkspaceState
): void {
  setState({
    currentSession: sessionData,
    workspaceState,
    isDirty: false,
    lastSaved: new Date()
  });
}

/**
 * Creates a new session with the provided configuration
 * @param {NewSessionConfig} config - Configuration for the new session
 * @param {string} config.userId - The user ID creating the session
 * @param {string} config.workspaceId - The workspace ID for the session
 * @param {string} config.name - The name of the session
 * @param {WorkspaceState} config.workspaceState - The initial workspace state
 * @param {string} [config.encryptionKey] - Optional encryption key for the session
 * @param {(state: Partial<FullSessionStateUpdate>) => void} setState - Function to update session state after creation
 * @returns {Promise<string>} Promise resolving to the created session ID
 */
export async function createNewSession(
  config: NewSessionConfig,
  setState: (state: Partial<FullSessionStateUpdate>) => void
): Promise<string> {
  const sessionData = await createNewSessionRequest(config);
  const session = sessionData as { id: string };

  updateSessionStateAfterCreation(setState, sessionData, config.workspaceState);

  return session.id;
}

// Global type declaration for auto-save interval
declare global {
  var __sessionAutoSaveInterval: ReturnType<typeof setInterval> | undefined;
}

/**
 * Starts the auto-save interval for the current session
 * @param {number} autoSaveInterval - The auto-save interval in milliseconds
 * @param {() => Promise<boolean>} saveSession - Function to save the session
 * @returns {void}
 */
export function startAutoSave(autoSaveInterval: number, saveSession: () => Promise<boolean>): void {
  // Clear any existing interval
  stopAutoSave();

  const interval = setInterval(async () => {
    await saveSession();
  }, autoSaveInterval);

  // Store interval ID in global scope for cleanup
  globalThis.__sessionAutoSaveInterval = interval;
}

/**
 * Stops the auto-save interval for the current session
 * @returns {void}
 */
export function stopAutoSave(): void {
  // Get stored interval ID
  const interval = globalThis.__sessionAutoSaveInterval;
  if (interval) {
    clearInterval(interval);
    // Clean up stored interval ID
    delete globalThis.__sessionAutoSaveInterval;
  }
}
