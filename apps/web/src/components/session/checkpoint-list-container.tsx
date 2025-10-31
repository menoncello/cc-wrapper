import React, { useState } from 'react';

import {
  type Checkpoint,
  type CheckpointRestoreOptions,
  useSessionStore
} from '../../stores/session-store';
import { CheckpointListContent } from './checkpoint-list-content';

interface CheckpointListContainerProps {
  sessionId?: string;
  onCheckpointSelect?: (checkpoint: Checkpoint) => void;
  onCheckpointRestore?: (checkpointId: string) => void;
  onCheckpointDelete?: (checkpointId: string) => void;
  className?: string;
}

/**
 * Hook for loading checkpoints when session changes
 * @param {string | undefined} sessionId - Session ID
 * @param {(params: { sessionId: string }) => void} loadCheckpoints - Load checkpoints function
 */
function useCheckpointLoader(
  sessionId: string | undefined,
  loadCheckpoints: (params: { sessionId: string }) => void
): void {
  React.useEffect(() => {
    if (sessionId) {
      loadCheckpoints({ sessionId });
    }
  }, [sessionId, loadCheckpoints]);
}

/**
 * Hook for handling checkpoint selection
 * @returns {[string | null, (checkpoint: Checkpoint) => void]} Selected checkpoint and handler
 */
function useCheckpointSelection(): [string | null, (checkpoint: Checkpoint) => void] {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string | null>(null);

  const handleCheckpointSelect = (checkpoint: Checkpoint): void => {
    setSelectedCheckpoint(checkpoint.id);
  };

  return [selectedCheckpoint, handleCheckpointSelect];
}

/**
 * Create restore handler with fallback
 * @param {(checkpointId: string) => void | undefined} onCheckpointRestore - External restore handler
 * @param {(checkpointId: string) => Promise<void> | undefined} restoreCheckpoint - Store restore handler
 * @returns {(checkpointId: string) => Promise<void>} Restore handler
 */
function createRestoreHandler(
  onCheckpointRestore: ((checkpointId: string) => void) | undefined,
  restoreCheckpoint:
    | ((checkpointId: string, options?: CheckpointRestoreOptions) => Promise<boolean>)
    | undefined
): (checkpointId: string, options?: CheckpointRestoreOptions) => Promise<void> {
  return async (checkpointId: string, options?: CheckpointRestoreOptions): Promise<void> => {
    if (onCheckpointRestore) {
      onCheckpointRestore(checkpointId);
    } else if (restoreCheckpoint) {
      try {
        await restoreCheckpoint(checkpointId, options);
      } catch {
        // Error restoring checkpoint - handle gracefully
        throw new Error('Failed to restore checkpoint');
      }
    } else {
      throw new Error('No restore handler available');
    }
  };
}

/**
 * Create delete handler with fallback
 * @param {(checkpointId: string) => void | undefined} onCheckpointDelete - External delete handler
 * @param {(checkpointId: string) => Promise<void> | undefined} deleteCheckpoint - Store delete handler
 * @returns {(checkpointId: string) => Promise<void>} Delete handler
 */
function createDeleteHandler(
  onCheckpointDelete: ((checkpointId: string) => void) | undefined,
  deleteCheckpoint: ((checkpointId: string) => Promise<void>) | undefined
): (checkpointId: string) => Promise<void> {
  return async (checkpointId: string): Promise<void> => {
    if (onCheckpointDelete) {
      onCheckpointDelete(checkpointId);
    } else if (deleteCheckpoint) {
      try {
        await deleteCheckpoint(checkpointId);
      } catch {
        // Error deleting checkpoint - handle gracefully
      }
    }
  };
}

/**
 * Interface for container hooks return value
 */
interface ContainerHooksReturn {
  checkpoints: Checkpoint[] | undefined;
  isLoadingCheckpoints: boolean;
  selectedCheckpoint: string | null;
  handleCheckpointSelect: (checkpoint: Checkpoint) => void;
  handleRestore: (checkpointId: string, options?: CheckpointRestoreOptions) => Promise<void>;
  handleDelete: (checkpointId: string) => Promise<void>;
}

/**
 * Interface for session store hooks return value
 */
interface SessionStoreHooksReturn {
  checkpoints: Checkpoint[];
  isLoadingCheckpoints: boolean;
  loadCheckpoints: (params: { sessionId: string }) => void;
  deleteCheckpoint: (checkpointId: string) => Promise<void>;
  restoreCheckpoint: (checkpointId: string, options?: CheckpointRestoreOptions) => Promise<boolean>;
}

/**
 * Setup session store hooks
 * @returns {SessionStoreHooksReturn} Session store hooks
 */
function useSessionStoreHooks(): SessionStoreHooksReturn {
  const {
    checkpoints,
    isLoadingCheckpoints,
    loadCheckpoints,
    deleteCheckpoint,
    restoreCheckpoint
  } = useSessionStore();
  return {
    checkpoints: checkpoints || [],
    isLoadingCheckpoints,
    loadCheckpoints,
    deleteCheckpoint,
    restoreCheckpoint
  };
}

/**
 * Create combined checkpoint select handler
 * @param {(checkpoint: Checkpoint) => void} handleBaseSelect - Base select handler
 * @param {((checkpoint: Checkpoint) => void) | undefined} onCheckpointSelect - External select handler
 * @returns {(checkpoint: Checkpoint) => void} Combined select handler
 */
function createCombinedSelectHandler(
  handleBaseSelect: (checkpoint: Checkpoint) => void,
  onCheckpointSelect: ((checkpoint: Checkpoint) => void) | undefined
): (checkpoint: Checkpoint) => void {
  return (checkpoint: Checkpoint): void => {
    handleBaseSelect(checkpoint);
    if (onCheckpointSelect) {
      onCheckpointSelect(checkpoint);
    }
  };
}

/**
 * Create checkpoint select handler
 * @param {(checkpoint: Checkpoint) => void} handleCheckpointSelectBase - Base select handler
 * @param {((checkpoint: Checkpoint) => void) | undefined} onCheckpointSelect - External select handler
 * @returns {(checkpoint: Checkpoint) => void} Combined select handler
 */
const createCheckpointSelectHandler = (
  handleCheckpointSelectBase: (checkpoint: Checkpoint) => void,
  onCheckpointSelect: ((checkpoint: Checkpoint) => void) | undefined
): ((checkpoint: Checkpoint) => void) => {
  return createCombinedSelectHandler(handleCheckpointSelectBase, onCheckpointSelect);
};

/**
 * Create checkpoint action handlers
 * @param {((checkpointId: string) => void) | undefined} onCheckpointRestore - Restore handler
 * @param {((checkpointId: string) => void) | undefined} onCheckpointDelete - Delete handler
 * @param {object} hooks - Session store hooks
 * @returns {object} Action handlers object
 */
const createActionHandlers = (
  onCheckpointRestore: ((checkpointId: string) => void) | undefined,
  onCheckpointDelete: ((checkpointId: string) => void) | undefined,
  hooks: ReturnType<typeof useSessionStoreHooks>
): {
  handleRestore: (checkpointId: string, options?: CheckpointRestoreOptions) => Promise<void>;
  handleDelete: (checkpointId: string) => Promise<void>;
} => {
  const handleRestore = createRestoreHandler(onCheckpointRestore, hooks.restoreCheckpoint);
  const handleDelete = createDeleteHandler(onCheckpointDelete, hooks.deleteCheckpoint);

  return {
    handleRestore,
    handleDelete
  };
};

/**
 * Container hooks and handlers
 * @param {object} params - Parameters
 * @param {string | undefined} params.sessionId - Session ID
 * @param {((checkpoint: Checkpoint) => void) | undefined} params.onCheckpointSelect - Select handler
 * @param {((checkpointId: string) => void) | undefined} params.onCheckpointRestore - Restore handler
 * @param {((checkpointId: string) => void) | undefined} params.onCheckpointDelete - Delete handler
 * @returns {ContainerHooksReturn} Hooks and handlers
 */

/**
 * Create container hooks return object
 * @param {object} params - Parameters
 * @param {ReturnType<typeof useSessionStoreHooks>} params.sessionStoreHooks - Session store hooks
 * @param {Checkpoint | null} params.selectedCheckpoint - Selected checkpoint
 * @param {(checkpoint: Checkpoint) => void} params.handleCheckpointSelect - Select handler
 * @param {(checkpointId: string) => Promise<void>} params.handleRestore - Restore handler
 * @param {(checkpointId: string) => Promise<void>} params.handleDelete - Delete handler
 * @returns {ContainerHooksReturn} Container hooks return object
 */
const createContainerReturn = ({
  sessionStoreHooks,
  selectedCheckpoint,
  handleCheckpointSelect,
  handleRestore,
  handleDelete
}: {
  sessionStoreHooks: ReturnType<typeof useSessionStoreHooks>;
  selectedCheckpoint: string | null;
  handleCheckpointSelect: (checkpoint: Checkpoint) => void;
  handleRestore: (checkpointId: string, options?: CheckpointRestoreOptions) => Promise<void>;
  handleDelete: (checkpointId: string) => Promise<void>;
}): ContainerHooksReturn => ({
  checkpoints: sessionStoreHooks.checkpoints,
  isLoadingCheckpoints: sessionStoreHooks.isLoadingCheckpoints,
  selectedCheckpoint,
  handleCheckpointSelect,
  handleRestore,
  handleDelete
});

/**
 * Initialize container hooks
 * @param {string | undefined} sessionId - Session ID
 * @returns {object} Initialized hooks and base handlers
 */
const initializeContainerHooks = (
  sessionId: string | undefined
): {
  sessionStoreHooks: ReturnType<typeof useSessionStoreHooks>;
  selectedCheckpoint: string | null;
  handleCheckpointSelectBase: (checkpoint: Checkpoint) => void;
} => {
  const sessionStoreHooks = useSessionStoreHooks();
  const [selectedCheckpoint, handleCheckpointSelectBase] = useCheckpointSelection();

  useCheckpointLoader(sessionId, sessionStoreHooks.loadCheckpoints);

  return {
    sessionStoreHooks,
    selectedCheckpoint,
    handleCheckpointSelectBase
  };
};

/**
 * Container hooks and handlers
 * @param {object} params - Parameters
 * @param {string | undefined} params.sessionId - Session ID
 * @param {((checkpoint: Checkpoint) => void) | undefined} params.onCheckpointSelect - Select handler
 * @param {((checkpointId: string) => void) | undefined} params.onCheckpointRestore - Restore handler
 * @param {((checkpointId: string) => void) | undefined} params.onCheckpointDelete - Delete handler
 * @returns {ContainerHooksReturn} Hooks and handlers
 */
function useContainerHooks({
  sessionId,
  onCheckpointSelect,
  onCheckpointRestore,
  onCheckpointDelete
}: {
  sessionId: string | undefined;
  onCheckpointSelect: ((checkpoint: Checkpoint) => void) | undefined;
  onCheckpointRestore: ((checkpointId: string) => void) | undefined;
  onCheckpointDelete: ((checkpointId: string) => void) | undefined;
}): ContainerHooksReturn {
  const { sessionStoreHooks, selectedCheckpoint, handleCheckpointSelectBase } =
    initializeContainerHooks(sessionId);

  const handleCheckpointSelect = createCheckpointSelectHandler(
    handleCheckpointSelectBase,
    onCheckpointSelect
  );

  const { handleRestore, handleDelete } = createActionHandlers(
    onCheckpointRestore,
    onCheckpointDelete,
    sessionStoreHooks
  );

  return createContainerReturn({
    sessionStoreHooks,
    selectedCheckpoint,
    handleCheckpointSelect,
    handleRestore,
    handleDelete
  });
}

/**
 * Checkpoint list container component
 */
export const CheckpointListContainer: React.FC<CheckpointListContainerProps> = ({
  sessionId,
  onCheckpointSelect,
  onCheckpointRestore,
  onCheckpointDelete,
  className = ''
}) => {
  const containerHooks = useContainerHooks({
    sessionId,
    onCheckpointSelect,
    onCheckpointRestore,
    onCheckpointDelete
  });

  return (
    <CheckpointListContent
      isLoadingCheckpoints={containerHooks.isLoadingCheckpoints}
      checkpoints={containerHooks.checkpoints || []}
      selectedCheckpoint={containerHooks.selectedCheckpoint}
      className={className}
      wrappedHandleSelect={containerHooks.handleCheckpointSelect}
      wrappedHandleRestore={containerHooks.handleRestore}
      wrappedHandleDelete={containerHooks.handleDelete}
    />
  );
};
