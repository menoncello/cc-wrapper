import React from 'react';

interface CheckpointLoadingStateProps {
  className?: string;
}

export const CheckpointLoadingState: React.FC<CheckpointLoadingStateProps> = ({
  className = ''
}) => {
  return (
    <div className={`p-4 text-center ${className}`}>
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="mt-2 text-sm text-gray-600">Loading checkpoints...</p>
    </div>
  );
};
