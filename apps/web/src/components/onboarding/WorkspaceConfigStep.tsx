import { useOnboardingStore, type WorkspaceTemplate } from '@stores/onboardingStore';

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

export default function WorkspaceConfigStep() {
  const { workspaceName, workspaceDescription, workspaceTemplate, setWorkspaceConfig } =
    useOnboardingStore();

  return (
    <div className="workspace-config-step">
      <h2 data-testid="onboarding-step-title">Configure Your Workspace</h2>
      <p className="step-description">
        Create your first workspace with a template that matches your project.
      </p>

      <div className="form-group">
        <label htmlFor="workspace-name">
          Workspace Name <span className="required">*</span>
        </label>
        <input
          id="workspace-name"
          type="text"
          data-testid="workspace-name-input"
          value={workspaceName}
          onChange={e => setWorkspaceConfig({ name: e.target.value })}
          placeholder="e.g., My Project"
          className="form-input"
          required
        />
        {workspaceName.trim().length === 0 && (
          <p className="error-message">Workspace name is required</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="workspace-description">Description (Optional)</label>
        <textarea
          id="workspace-description"
          data-testid="workspace-description-input"
          value={workspaceDescription}
          onChange={e => setWorkspaceConfig({ description: e.target.value })}
          placeholder="Briefly describe your workspace..."
          className="form-textarea"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="workspace-template">Template</label>
        <select
          id="workspace-template"
          data-testid="workspace-template-select"
          value={workspaceTemplate}
          onChange={e => setWorkspaceConfig({ template: e.target.value as WorkspaceTemplate })}
          className="form-select"
        >
          {templates.map(template => (
            <option key={template.value} value={template.value}>
              {template.label} - {template.description}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
