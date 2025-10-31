// Constants for session management
export const DEFAULT_AUTO_SAVE_INTERVAL = 30000; // 30 seconds
export const DEFAULT_CHECKPOINT_LIMIT = 20;
export const DEFAULT_CHECKPOINT_SORT_BY = 'createdAt';
export const DEFAULT_CHECKPOINT_SORT_ORDER = 'desc';
export const DEFAULT_CHECKPOINT_PRIORITY = 'medium';

// Base URL for session API
export const SESSION_API_BASE = '/api/sessions/v1';
export const CHECKPOINT_API_BASE = '/api/checkpoints/v1';

export const initialState = {
  currentSession: null,
  workspaceState: null,
  isDirty: false,
  lastSaved: null,
  autoSaveEnabled: true,
  autoSaveInterval: DEFAULT_AUTO_SAVE_INTERVAL,

  checkpoints: [],
  checkpointFilter: {
    limit: DEFAULT_CHECKPOINT_LIMIT,
    sortBy: DEFAULT_CHECKPOINT_SORT_BY,
    sortOrder: DEFAULT_CHECKPOINT_SORT_ORDER
  },
  isLoadingCheckpoints: false,

  isCreatingCheckpoint: false,
  isRestoringCheckpoint: false,
  checkpointName: '',
  checkpointDescription: '',
  checkpointTags: [],
  checkpointPriority: DEFAULT_CHECKPOINT_PRIORITY
};
