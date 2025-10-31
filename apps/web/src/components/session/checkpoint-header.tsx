import React from 'react';

import { type Checkpoint } from '../../stores/session-store';
import { BYTES_PER_MB, STROKE_WIDTH_DEFAULT } from './checkpoint-utils';

interface CheckpointHeaderProps {
  effectiveSessionId: string | undefined;
  currentSession: { id?: string; name?: string } | null;
  checkpoints: Checkpoint[] | undefined;
  activeView: 'list' | 'create';
  onViewChange: (view: 'list' | 'create') => void;
}

/**
 * Type for view button
 */
type ViewType = 'list' | 'create';

/**
 * Get button class name based on view
 * @param {ViewType} activeView - Currently active view
 * @param {ViewType} view - View for this button
 * @returns {string} Button class name
 */
function getButtonClassName(activeView: ViewType, view: ViewType): string {
  const baseClasses = 'px-3 py-1.5 text-sm rounded-md transition-colors';
  const activeClasses = 'bg-blue-100 text-blue-700';
  const inactiveClasses = 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';

  return `${baseClasses} ${activeView === view ? activeClasses : inactiveClasses}`;
}

/**
 * Get session description text
 * @param {string | undefined} effectiveSessionId - Effective session ID
 * @param {{id?: string; name?: string} | null} currentSession - Current session
 * @returns {string} Session description text
 */
function getSessionDescription(
  effectiveSessionId: string | undefined,
  currentSession: { id?: string; name?: string } | null
): string {
  if (!effectiveSessionId) {
    return 'No active session';
  }

  const sessionName = currentSession?.name;
  if (sessionName) {
    return `Manage checkpoints for session "${sessionName}"`;
  }

  return 'Manage checkpoints for session';
}

/**
 * View toggle buttons component
 * @param {object} props - Component props
 * @param {ViewType} props.activeView - Currently active view
 * @param {(view: ViewType) => void} props.onViewChange - View change handler
 * @returns {React.ReactElement} View toggle buttons
 */
function ViewToggleButtons({
  activeView,
  onViewChange
}: {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onViewChange('list')}
        className={getButtonClassName(activeView, 'list')}
      >
        List
      </button>
      <button
        onClick={() => onViewChange('create')}
        className={getButtonClassName(activeView, 'create')}
      >
        Create
      </button>
    </div>
  );
}

/**
 * Header title component
 * @param {object} props - Component props
 * @param {string} props.sessionDescription - Session description text
 * @returns {React.ReactElement} Header title
 */
function HeaderTitle({ sessionDescription }: { sessionDescription: string }): React.ReactElement {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Checkpoints</h2>
      <p className="text-sm text-gray-600">{sessionDescription}</p>
    </div>
  );
}

/**
 * Header content component
 * @param {object} props - Component props
 * @param {string | undefined} props.effectiveSessionId - Effective session ID
 * @param {{id?: string; name?: string} | null} props.currentSession - Current session
 * @param {ViewType} props.activeView - Currently active view
 * @param {(view: ViewType) => void} props.onViewChange - View change handler
 * @returns {React.ReactElement} Header content
 */
function HeaderContent({
  effectiveSessionId,
  currentSession,
  activeView,
  onViewChange
}: {
  effectiveSessionId: string | undefined;
  currentSession: { id?: string; name?: string } | null;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}): React.ReactElement {
  const sessionDescription = getSessionDescription(effectiveSessionId, currentSession);

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <HeaderTitle sessionDescription={sessionDescription} />

        {effectiveSessionId && (
          <ViewToggleButtons activeView={activeView} onViewChange={onViewChange} />
        )}
      </div>
    </div>
  );
}

export const CheckpointHeader: React.FC<CheckpointHeaderProps> = ({
  effectiveSessionId,
  currentSession,
  activeView,
  onViewChange
}) => {
  return (
    <HeaderContent
      effectiveSessionId={effectiveSessionId}
      currentSession={currentSession}
      activeView={activeView}
      onViewChange={onViewChange}
    />
  );
};

interface CheckpointStatsProps {
  checkpoints: Checkpoint[] | undefined;
}

/**
 * Calculate total storage used
 * @param {Checkpoint[] | undefined} checkpoints - Checkpoints array
 * @returns {number} Total storage in bytes
 */
function calculateTotalStorage(checkpoints: Checkpoint[] | undefined): number {
  return checkpoints ? checkpoints.reduce((sum, cp) => sum + cp.compressedSize, 0) : 0;
}

/**
 * Format storage size in MB
 * @param {number} totalStorage - Total storage in bytes
 * @returns {string} Formatted storage size in MB
 */
function formatStorageSize(totalStorage: number): string {
  return (totalStorage / BYTES_PER_MB).toFixed(1);
}

/**
 * Get latest checkpoint date
 * @param {Checkpoint[] | undefined} checkpoints - Checkpoints array
 * @returns {string} Formatted date string or 'None'
 */
function getLatestCheckpointDate(checkpoints: Checkpoint[] | undefined): string {
  if (checkpoints && checkpoints.length > 0) {
    const latestCheckpoint = checkpoints[0];
    if (latestCheckpoint) {
      return new Date(latestCheckpoint.createdAt).toLocaleDateString();
    }
  }
  return 'None';
}

/**
 * Document icon component
 * @returns {React.ReactElement} Document icon
 */
function DocumentIcon(): React.ReactElement {
  return (
    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={STROKE_WIDTH_DEFAULT}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

/**
 * Storage icon component
 * @returns {React.ReactElement} Storage icon
 */
function StorageIcon(): React.ReactElement {
  return (
    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={STROKE_WIDTH_DEFAULT}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

/**
 * Clock icon component
 * @returns {React.ReactElement} Clock icon
 */
function ClockIcon(): React.ReactElement {
  return (
    <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={STROKE_WIDTH_DEFAULT}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Stat card component
 * @param {object} props - Component props
 * @param {React.ReactElement} props.icon - Icon component
 * @param {string} props.title - Card title
 * @param {string | number} props.value - Card value
 * @param {string} props.valueColor - Text color for value
 * @returns {React.ReactElement} Stat card
 */
function StatCard({
  icon,
  title,
  value,
  valueColor
}: {
  icon: React.ReactElement;
  title: string;
  value: string | number;
  valueColor: string;
}): React.ReactElement {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Stats grid component
 * @param {object} props - Component props
 * @param {Checkpoint[] | undefined} props.checkpoints - Checkpoints array
 * @returns {React.ReactElement} Stats grid
 */
function StatsGrid({ checkpoints }: { checkpoints: Checkpoint[] | undefined }): React.ReactElement {
  const totalStorage = calculateTotalStorage(checkpoints);
  const storageUsed = formatStorageSize(totalStorage);
  const checkpointCount = checkpoints ? checkpoints.length : 0;
  const latestDate = getLatestCheckpointDate(checkpoints);

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        icon={<DocumentIcon />}
        title="Total Checkpoints"
        value={checkpointCount}
        valueColor="text-blue-600"
      />
      <StatCard
        icon={<StorageIcon />}
        title="Storage Used"
        value={`${storageUsed} MB`}
        valueColor="text-green-600"
      />
      <StatCard
        icon={<ClockIcon />}
        title="Latest Checkpoint"
        value={latestDate}
        valueColor="text-purple-600"
      />
    </div>
  );
}

export const CheckpointStats: React.FC<CheckpointStatsProps> = ({ checkpoints }) => {
  return <StatsGrid checkpoints={checkpoints} />;
};
