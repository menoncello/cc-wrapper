import React, { useState } from 'react';

import { type Checkpoint, useSessionStore } from '../../stores/session-store';
import { CheckpointCreateView } from './checkpoint-create-view';
import { CheckpointHeader } from './checkpoint-header';
import { CheckpointListView } from './checkpoint-list-view';
import { CheckpointNoSession } from './checkpoint-no-session';

interface CheckpointManagerProps {
  sessionId?: string;
  className?: string;
}

const handleCheckpointSelect = (): void => {
  // Handle checkpoint selection if needed
};

const handleCheckpointRestore = async (): Promise<void> => {
  try {
    const confirmed = window.confirm(
      'Are you sure you want to restore from this checkpoint? Any unsaved changes will be lost.'
    );

    if (confirmed) {
      // Restore logic is handled in the CheckpointList component
    }
  } catch {
    // Error restoring checkpoint - handle gracefully
  }
};

interface RenderContentParams {
  effectiveSessionId: string | undefined;
  activeView: 'list' | 'create';
  checkpoints: Checkpoint[] | undefined;
  handleCheckpointCreated: () => void;
  setActiveView: (view: 'list' | 'create') => void;
}

const createRenderContent = (params: RenderContentParams): (() => React.ReactElement) => {
  return () => {
    if (!params.effectiveSessionId) {
      return <CheckpointNoSession />;
    }

    return params.activeView === 'list' ? (
      <CheckpointListView
        checkpoints={params.checkpoints}
        sessionId={params.effectiveSessionId}
        onCheckpointSelect={handleCheckpointSelect}
        onCheckpointRestore={handleCheckpointRestore}
      />
    ) : (
      <CheckpointCreateView
        sessionId={params.effectiveSessionId}
        onCheckpointCreated={params.handleCheckpointCreated}
        onCancel={() => params.setActiveView('list')}
      />
    );
  };
};

export const CheckpointManager: React.FC<CheckpointManagerProps> = ({
  sessionId,
  className = ''
}) => {
  const { currentSession, checkpoints } = useSessionStore();
  const [activeView, setActiveView] = useState<'list' | 'create'>('list');

  const effectiveSessionId = sessionId || currentSession?.id;

  const handleCheckpointCreated = (): void => {
    setActiveView('list');
  };

  const renderContent = createRenderContent({
    effectiveSessionId,
    activeView,
    checkpoints,
    handleCheckpointCreated,
    setActiveView
  });

  return (
    <div className={`checkpoint-manager ${className}`}>
      <CheckpointHeader
        effectiveSessionId={effectiveSessionId}
        currentSession={currentSession}
        checkpoints={checkpoints}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <div className="bg-gray-50 min-h-[400px]">{renderContent()}</div>
    </div>
  );
};
