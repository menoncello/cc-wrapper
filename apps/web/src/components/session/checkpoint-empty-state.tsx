import React from 'react';

import { STROKE_WIDTH_DEFAULT } from './checkpoint-utils';

interface CheckpointEmptyStateProps {
  className?: string;
}

export const CheckpointEmptyState: React.FC<CheckpointEmptyStateProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 text-center ${className}`}>
      <div className="text-gray-400">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={STROKE_WIDTH_DEFAULT}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="mt-2 text-sm text-gray-600">No checkpoints found</p>
      <p className="text-xs text-gray-500">Create checkpoints to save important states</p>
    </div>
  );
};
