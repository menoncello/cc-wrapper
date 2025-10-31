import React from 'react';

import { useOnboardingStore, type WorkspaceTemplate } from '../../stores/onboarding-store';

const templates: Array<{
  value: WorkspaceTemplate;
  label: string;
  description: string;
}> = [
  {
    value: 'React',
    label: 'React',
    description: 'Modern React with TypeScript and Vite'
  },
  {
    value: 'Node.js',
    label: 'Node.js',
    description: 'Backend API with Express or Fastify'
  },
  {
    value: 'Python',
    label: 'Python',
    description: 'Python application with common tools'
  },
  {
    value: 'Custom',
    label: 'Custom',
    description: 'Start with a blank workspace'
  }
];

/**
 * Workspace configuration step component for onboarding
 * @returns {JSX.Element} JSX element for workspace configuration
 * @type {React.ReactElement}
 */
export function WorkspaceConfigStep(): React.ReactElement {
  const { workspaceName, workspaceDescription, workspaceTemplate, setWorkspaceConfig } =
    useOnboardingStore();

  return (
    <div className="workspace-config-step">
      <h2 data-testid="onboarding-step-title">Configure Your Workspace</h2>
      <p className="step-description">
        Create your first workspace with a template that matches your project.
      </p>

      <WorkspaceNameInput
        value={workspaceName}
        onChange={value => setWorkspaceConfig({ name: value })}
      />

      <WorkspaceDescriptionInput
        value={workspaceDescription}
        onChange={value => setWorkspaceConfig({ description: value })}
      />

      <WorkspaceTemplateSelect
        value={workspaceTemplate}
        onChange={value => setWorkspaceConfig({ template: value as WorkspaceTemplate })}
      />
    </div>
  );
}

interface WorkspaceNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Workspace name input component
 * @param {object} props - Component props
 * @param {string} props.value - Current workspace name value
 * @param {(value: string) => void} props.onChange - Change handler
 * @returns {JSX.Element} JSX element for workspace name input
 * @type {React.ReactElement}
 */
function WorkspaceNameInput({ value, onChange }: WorkspaceNameInputProps): React.ReactElement {
  return (
    <div className="form-group">
      <label htmlFor="workspace-name">
        Workspace Name <span className="required">*</span>
      </label>
      <input
        id="workspace-name"
        type="text"
        data-testid="workspace-name-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g., My Project"
        className="form-input"
        required
      />
      {value.trim().length === 0 && <p className="error-message">Workspace name is required</p>}
    </div>
  );
}

interface WorkspaceDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Workspace description input component
 * @param {object} props - Component props
 * @param {string} props.value - Current workspace description value
 * @param {(value: string) => void} props.onChange - Change handler
 * @returns {JSX.Element} JSX element for workspace description input
 * @type {React.ReactElement}
 */
function WorkspaceDescriptionInput({
  value,
  onChange
}: WorkspaceDescriptionInputProps): React.ReactElement {
  return (
    <div className="form-group">
      <label htmlFor="workspace-description">Description (Optional)</label>
      <textarea
        id="workspace-description"
        data-testid="workspace-description-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Briefly describe your workspace..."
        className="form-textarea"
        rows={3}
      />
    </div>
  );
}

interface WorkspaceTemplateSelectProps {
  value: WorkspaceTemplate;
  onChange: (value: string) => void;
}

/**
 * Workspace template select component
 * @param {object} props - Component props
 * @param {WorkspaceTemplate} props.value - Current selected template
 * @param {(value: string) => void} props.onChange - Change handler
 * @returns {JSX.Element} JSX element for workspace template select
 * @type {React.ReactElement}
 */
function WorkspaceTemplateSelect({
  value,
  onChange
}: WorkspaceTemplateSelectProps): React.ReactElement {
  return (
    <div className="form-group">
      <label htmlFor="workspace-template">Template</label>
      <select
        id="workspace-template"
        data-testid="workspace-template-select"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="form-select"
      >
        {templates.map(template => (
          <option key={template.value} value={template.value}>
            {template.label} - {template.description}
          </option>
        ))}
      </select>
    </div>
  );
}
