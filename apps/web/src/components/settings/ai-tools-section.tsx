import { AI_TOOLS } from './profile-settings-utils';

/**
 * Props for AIToolsSection component
 */
interface AIToolsSectionProps {
  preferredAITools: string[];
  onToggleTool: (toolId: string) => void;
}

/**
 * Props for ToolCheckbox component
 */
interface ToolCheckboxProps {
  tool: { id: string; label: string };
  isSelected: boolean;
  onToggle: () => void;
}

/**
 * Renders individual AI tool checkbox
 * @param {ToolCheckboxProps} props - Tool checkbox props
 * @returns {JSX.Element} Tool checkbox JSX element
 */
const ToolCheckbox = ({ tool, isSelected, onToggle }: ToolCheckboxProps): React.ReactElement => (
  <label key={tool.id} className="ai-tool-checkbox-label">
    <input type="checkbox" checked={isSelected} onChange={onToggle} />
    <span>{tool.label}</span>
    {isSelected && <span className="check-icon">✓</span>}
  </label>
);

/**
 * Props for ToolChip component
 */
interface ToolChipProps {
  toolId: string;
  onRemove: () => void;
}

/**
 * Renders tool chip with remove button
 * @param {ToolChipProps} props - Tool chip props
 * @returns {JSX.Element} Tool chip JSX element
 */
const ToolChip = ({ toolId, onRemove }: ToolChipProps): React.ReactElement => {
  const tool = AI_TOOLS.find(t => t.id === toolId);

  return (
    <span key={toolId} className="tool-chip">
      {tool?.label}
      <button type="button" onClick={onRemove} className="remove-chip">
        ×
      </button>
    </span>
  );
};

/**
 * Props for SelectedToolsDisplay component
 */
interface SelectedToolsDisplayProps {
  preferredAITools: string[];
  onToggleTool: (toolId: string) => void;
}

/**
 * Renders selected tools display
 * @param {SelectedToolsDisplayProps} props - Selected tools props
 * @returns {JSX.Element} Selected tools display JSX element
 */
const SelectedToolsDisplay = ({
  preferredAITools,
  onToggleTool
}: SelectedToolsDisplayProps): React.ReactElement => (
  <div className="selected-tools-display">
    {preferredAITools.length > 0 ? (
      <div className="tools-chips">
        {preferredAITools.map(toolId => (
          <ToolChip key={toolId} toolId={toolId} onRemove={() => onToggleTool(toolId)} />
        ))}
      </div>
    ) : (
      <p className="no-tools-message">No tools selected</p>
    )}
  </div>
);

/**
 * AI Tools selection section component
 * @param {AIToolsSectionProps} props - Component props
 * @returns {JSX.Element} AI tools section JSX element
 */
export const AIToolsSection: React.FC<AIToolsSectionProps> = ({
  preferredAITools,
  onToggleTool
}): React.ReactElement => (
  <section className="settings-section">
    <h2>Preferred AI Tools</h2>
    <p>Select the AI tools you primarily work with.</p>

    <div className="ai-tools-grid">
      {AI_TOOLS.map(tool => (
        <ToolCheckbox
          key={tool.id}
          tool={tool}
          isSelected={preferredAITools.includes(tool.id)}
          onToggle={() => onToggleTool(tool.id)}
        />
      ))}
    </div>

    <SelectedToolsDisplay preferredAITools={preferredAITools} onToggleTool={onToggleTool} />
  </section>
);
