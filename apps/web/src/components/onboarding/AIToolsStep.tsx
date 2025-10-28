import { useOnboardingStore } from '@stores/onboardingStore';

const aiTools = [
  { id: 'claude', label: 'Claude', icon: '🤖' },
  { id: 'chatgpt', label: 'ChatGPT', icon: '💬' },
  { id: 'cursor', label: 'Cursor', icon: '⚡' },
  { id: 'windsurf', label: 'Windsurf', icon: '🌊' },
  { id: 'github-copilot', label: 'GitHub Copilot', icon: '🐙' }
];

export default function AIToolsStep() {
  const { selectedAITools, addAITool, removeAITool } = useOnboardingStore();

  const handleToggleTool = (toolId: string) => {
    if (selectedAITools.includes(toolId)) {
      removeAITool(toolId);
    } else {
      addAITool(toolId);
    }
  };

  return (
    <div className="ai-tools-step">
      <h2 data-testid="onboarding-step-title">Select Your Primary AI Tools</h2>
      <p className="step-description">
        Choose the AI tools you primarily work with. You can change this later in settings.
      </p>

      <div className="ai-tools-list">
        {aiTools.map(tool => {
          const isSelected = selectedAITools.includes(tool.id);

          return (
            <label key={tool.id} className="ai-tool-item">
              <input
                type="checkbox"
                data-testid={`ai-tool-${tool.id}`}
                checked={isSelected}
                onChange={() => handleToggleTool(tool.id)}
                className="ai-tool-checkbox"
              />
              <span className="ai-tool-icon">{tool.icon}</span>
              <span className="ai-tool-label">{tool.label}</span>
              {isSelected && <span className="selected-check">✓</span>}
            </label>
          );
        })}
      </div>

      <p className="help-text">
        {selectedAITools.length === 0
          ? 'Select at least one tool, or skip to configure later.'
          : `${selectedAITools.length} tool${selectedAITools.length > 1 ? 's' : ''} selected`}
      </p>
    </div>
  );
}
