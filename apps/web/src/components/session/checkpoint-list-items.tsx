import React from 'react';

import { type Checkpoint } from '../../stores/session-store';
import { CheckpointItem } from './checkpoint-item';

interface CheckpointListItemsProps {
  checkpoints: Checkpoint[];
  selectedCheckpoint: string | null;
  className: string;
  wrappedHandleSelect: (checkpoint: Checkpoint) => void;
  wrappedHandleRestore: (checkpointId: string) => Promise<void>;
  wrappedHandleDelete: (checkpointId: string) => Promise<void>;
}

export const CheckpointListItems: React.FC<CheckpointListItemsProps> = ({
  checkpoints,
  selectedCheckpoint,
  className,
  wrappedHandleSelect,
  wrappedHandleRestore,
  wrappedHandleDelete
}) => {
  return (
    <div className={`checkpoint-list ${className}`}>
      <div className="space-y-2">
        {checkpoints.map(checkpoint => (
          <CheckpointItem
            key={checkpoint.id}
            checkpoint={checkpoint}
            isSelected={selectedCheckpoint === checkpoint.id}
            onSelect={wrappedHandleSelect}
            onRestore={wrappedHandleRestore}
            onDelete={wrappedHandleDelete}
          />
        ))}
      </div>
    </div>
  );
};
