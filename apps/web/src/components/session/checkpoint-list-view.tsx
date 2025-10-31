import React from 'react';

import { type Checkpoint } from '../../stores/session-store';
import { CheckpointStats } from './checkpoint-header';
import { CheckpointList } from './checkpoint-list';

interface CheckpointListViewProps {
  checkpoints: Checkpoint[] | undefined;
  sessionId: string;
  onCheckpointSelect: () => void;
  onCheckpointRestore: () => void;
}

export const CheckpointListView: React.FC<CheckpointListViewProps> = ({
  checkpoints,
  sessionId,
  onCheckpointSelect,
  onCheckpointRestore
}) => {
  return (
    <div className="p-6">
      {checkpoints && checkpoints.length > 0 && <CheckpointStats checkpoints={checkpoints} />}
      <CheckpointList
        sessionId={sessionId}
        onCheckpointSelect={onCheckpointSelect}
        onCheckpointRestore={onCheckpointRestore}
      />
    </div>
  );
};
