import React from 'react';

import { STROKE_WIDTH_THIN } from './checkpoint-utils';

export const CheckpointNoSession: React.FC = () => {
  return (
    <div className="p-8 text-center">
      <div className="text-gray-400 mx-auto h-16 w-16">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={STROKE_WIDTH_THIN}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">No Active Session</h3>
      <p className="mt-1 text-sm text-gray-600">Start or load a session to manage checkpoints</p>
    </div>
  );
};
