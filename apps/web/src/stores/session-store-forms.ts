import { DEFAULT_CHECKPOINT_PRIORITY } from './session-store-constants';

// Type for checkpoint form data
interface CheckpointFormData {
  name?: string;
  description?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
}

// Type for session state with checkpoint form fields
interface SessionStateWithCheckpointForm {
  checkpointName: string;
  checkpointDescription: string;
  checkpointTags: string[];
  checkpointPriority: 'low' | 'medium' | 'high';
  currentSession: unknown;
  workspaceState: unknown;
  isDirty: boolean;
  lastSaved: Date | null;
  checkpoints: unknown[];
}

// Type for Zustand set function
type ZustandSetFunction = (
  update: (state: SessionStateWithCheckpointForm) => Partial<SessionStateWithCheckpointForm>
) => void;

/**
 * Sets the checkpoint form data with partial updates
 * @param {ZustandSetFunction} set - Zustand set function to update state
 * @param {CheckpointFormData} data - The form data to update
 * @param {string} [data.name] - Optional checkpoint name
 * @param {string} [data.description] - Optional checkpoint description
 * @param {string[]} [data.tags] - Optional array of tags
 * @param {'low' | 'medium' | 'high'} [data.priority] - Optional priority level
 * @returns {void}
 */
export function setCheckpointForm(set: ZustandSetFunction, data: CheckpointFormData): void {
  set(state => ({
    checkpointName: data.name ?? state.checkpointName,
    checkpointDescription: data.description ?? state.checkpointDescription,
    checkpointTags: data.tags ?? state.checkpointTags,
    checkpointPriority: data.priority ?? state.checkpointPriority
  }));
}

/**
 * Resets the checkpoint form to default values
 * @param {ZustandSetFunction} set - Zustand set function to reset state
 * @returns {void}
 */
export function resetCheckpointForm(set: ZustandSetFunction): void {
  set(() => ({
    checkpointName: '',
    checkpointDescription: '',
    checkpointTags: [],
    checkpointPriority: DEFAULT_CHECKPOINT_PRIORITY
  }));
}

// Type for session clear state
interface SessionClearState {
  currentSession: null;
  workspaceState: null;
  isDirty: boolean;
  lastSaved: null;
  checkpoints: unknown[];
}

// Type for Zustand set function for clearing session
type ZustandClearSetFunction = (update: Partial<SessionClearState>) => void;

/**
 * Clears the current session and resets all related state
 * @param {ZustandClearSetFunction} set - Zustand set function to clear state
 * @returns {void}
 */
export function clearSession(set: ZustandClearSetFunction): void {
  set({
    currentSession: null,
    workspaceState: null,
    isDirty: false,
    lastSaved: null,
    checkpoints: []
  });
}
