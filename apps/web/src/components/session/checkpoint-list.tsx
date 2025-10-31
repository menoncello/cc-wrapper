import React from 'react';

import { type Checkpoint } from '../../stores/session-store';
import { CheckpointListContainer } from './checkpoint-list-container';

interface CheckpointListProps {
  sessionId?: string;
  onCheckpointSelect?: (checkpoint: Checkpoint) => void;
  onCheckpointRestore?: (checkpointId: string) => void;
  onCheckpointDelete?: (checkpointId: string) => void;
  className?: string;
}

/**
 * Checkpoint list component for displaying checkpoints
 */
export const CheckpointList: React.FC<CheckpointListProps> = props => {
  return <CheckpointListContainer {...props} />;
};
