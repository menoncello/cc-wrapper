import React from 'react';

import { type Checkpoint } from '../../stores/session-store';
import { CheckpointEmptyState } from './checkpoint-empty-state';
import { CheckpointListItems } from './checkpoint-list-items';
import { CheckpointLoadingState } from './checkpoint-loading-state';

interface CheckpointListContentProps {
  isLoadingCheckpoints: boolean;
  checkpoints: Checkpoint[];
  selectedCheckpoint: string | null;
  className: string;
  wrappedHandleSelect: (checkpoint: Checkpoint) => void;
  wrappedHandleRestore: (checkpointId: string) => Promise<void>;
  wrappedHandleDelete: (checkpointId: string) => Promise<void>;
}

export const CheckpointListContent: React.FC<CheckpointListContentProps> = ({
  isLoadingCheckpoints,
  checkpoints,
  selectedCheckpoint,
  className,
  wrappedHandleSelect,
  wrappedHandleRestore,
  wrappedHandleDelete
}) => {
  if (isLoadingCheckpoints) {
    return <CheckpointLoadingState className={className} />;
  }

  if (checkpoints.length === 0) {
    return <CheckpointEmptyState className={className} />;
  }

  return (
    <CheckpointListItems
      checkpoints={checkpoints}
      selectedCheckpoint={selectedCheckpoint}
      className={className}
      wrappedHandleSelect={wrappedHandleSelect}
      wrappedHandleRestore={wrappedHandleRestore}
      wrappedHandleDelete={wrappedHandleDelete}
    />
  );
};
