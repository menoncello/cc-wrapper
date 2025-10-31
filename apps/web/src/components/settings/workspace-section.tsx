import React from 'react';

/**
 * Props for WorkspaceSection component
 */
interface WorkspaceSectionProps {
  workspaces: Array<{ id: string; name: string }>;
  defaultWorkspaceId?: string;
  onUpdateDefaultWorkspace: (workspaceId: string) => void;
}

/**
 * Props for WorkspaceSelect component
 */
interface WorkspaceSelectProps {
  workspaces: Array<{ id: string; name: string }>;
  defaultWorkspaceId?: string;
  onUpdateWorkspace: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * Renders workspace selection dropdown
 * @param {WorkspaceSelectProps} props - Workspace select props
 * @returns {JSX.Element} Workspace select JSX element
 */
const WorkspaceSelect = ({
  workspaces,
  defaultWorkspaceId,
  onUpdateWorkspace
}: WorkspaceSelectProps): React.ReactElement => (
  <select
    value={defaultWorkspaceId || ''}
    onChange={onUpdateWorkspace}
    className="workspace-select"
    data-testid="workspace-select"
  >
    <option value="">No default</option>
    {workspaces.map(ws => (
      <option key={ws.id} value={ws.id}>
        {ws.name}
        {ws.id === defaultWorkspaceId && ' (Default)'}
      </option>
    ))}
  </select>
);

/**
 * Renders empty state when no workspaces are available
 * @returns {JSX.Element} Empty state JSX element
 */
const NoWorkspacesMessage = (): React.ReactElement => <p>No workspaces available</p>;

/**
 * Default workspace selection section component
 * @param {WorkspaceSectionProps} props - Component props
 * @returns {JSX.Element} Workspace section JSX element
 */
export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
  workspaces,
  defaultWorkspaceId,
  onUpdateDefaultWorkspace
}): React.ReactElement => {
  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onUpdateDefaultWorkspace(e.target.value);
  };

  return (
    <section className="settings-section">
      <h2>Default Workspace</h2>
      <p>Select your default workspace that loads on startup.</p>

      {workspaces.length > 0 ? (
        <WorkspaceSelect
          workspaces={workspaces}
          defaultWorkspaceId={defaultWorkspaceId}
          onUpdateWorkspace={handleWorkspaceChange}
        />
      ) : (
        <NoWorkspacesMessage />
      )}
    </section>
  );
};
