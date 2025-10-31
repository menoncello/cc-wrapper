import React from 'react';

import { CheckpointForm } from './checkpoint-form';

interface CheckpointCreateViewProps {
  sessionId: string;
  onCheckpointCreated: () => void;
  onCancel: () => void;
}

export const CheckpointCreateView: React.FC<CheckpointCreateViewProps> = ({
  sessionId,
  onCheckpointCreated,
  onCancel
}) => {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Create New Checkpoint</h3>
            <p className="text-sm text-gray-600 mt-1">
              Save the current state of your workspace as a checkpoint
            </p>
          </div>
          <div className="p-6">
            <CheckpointForm
              sessionId={sessionId}
              onCheckpointCreated={onCheckpointCreated}
              onCancel={onCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
