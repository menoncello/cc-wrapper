import React from 'react';

import { useOnboardingStore } from '../../stores/onboarding-store';

/**
 * AI tool configuration interface
 */
interface AITool {
  id: string;
  label: string;
  icon: string;
}

interface RenderAIToolProps {
  tool: AITool;
  isSelected: boolean;
  onToggle: (toolId: string) => void;
}

const aiTools: AITool[] = [
  { id: 'claude', label: 'Claude', icon: '🤖' },
  { id: 'chatgpt', label: 'ChatGPT', icon: '💬' },
  { id: 'cursor', label: 'Cursor', icon: '⚡' },
  { id: 'windsurf', label: 'Windsurf', icon: '🌊' },
  { id: 'github-copilot', label: 'GitHub Copilot', icon: '🐙' }
];

/**
 * Render individual AI tool item
 * @param {object} props - Component props
 * @param {AITool} props.tool - AI tool object
 * @param {boolean} props.isSelected - Whether the tool is selected
 * @param {(toolId: string) => void} props.onToggle - Function to toggle tool selection
 * @returns {JSX.Element} JSX element for the AI tool item
 */
function renderAITool({ tool, isSelected, onToggle }: RenderAIToolProps): React.ReactElement {
  return (
    <label key={tool.id} className="ai-tool-item">
      <input
        type="checkbox"
        data-testid={`ai-tool-${tool.id}`}
        checked={isSelected}
        onChange={() => onToggle(tool.id)}
        className="ai-tool-checkbox"
      />
      <span className="ai-tool-icon">{tool.icon}</span>
      <span className="ai-tool-label">{tool.label}</span>
      {isSelected && <span className="selected-check">✓</span>}
    </label>
  );
}

/**
 * Handle toggling an AI tool selection
 * @param {string} toolId - The ID of the tool to toggle
 * @param {string[]} selectedTools - Currently selected tools
 * @param {(toolId: string) => void} addTool - Function to add a tool
 * @param {(toolId: string) => void} removeTool - Function to remove a tool
 */
function handleToggleTool(
  toolId: string,
  selectedTools: string[],
  addTool: (toolId: string) => void,
  removeTool: (toolId: string) => void
): void {
  if (selectedTools.includes(toolId)) {
    removeTool(toolId);
  } else {
    addTool(toolId);
  }
}

/**
 * Create tool toggle handler
 * @param {string[]} selectedTools - Currently selected tools
 * @param {(toolId: string) => void} addTool - Function to add a tool
 * @param {(toolId: string) => void} removeTool - Function to remove a tool
 * @returns {(toolId: string) => void} Tool toggle handler function
 * @type {(toolId: string) => void}
 */
function createToolToggleHandler(
  selectedTools: string[],
  addTool: (toolId: string) => void,
  removeTool: (toolId: string) => void
): (toolId: string) => void {
  return (toolId: string): void => {
    handleToggleTool(toolId, selectedTools, addTool, removeTool);
  };
}

/**
 * Render AI tools list
 * @param {string[]} selectedTools - Currently selected tools
 * @param {(toolId: string) => void} addTool - Function to add a tool
 * @param {(toolId: string) => void} removeTool - Function to remove a tool
 * @returns {JSX.Element} AI tools list JSX element
 * @type {React.ReactElement}
 */
function renderAIToolsList(
  selectedTools: string[],
  addTool: (toolId: string) => void,
  removeTool: (toolId: string) => void
): React.ReactElement {
  const handleToggle = createToolToggleHandler(selectedTools, addTool, removeTool);

  return (
    <div className="ai-tools-list">
      {aiTools.map(tool =>
        renderAITool({
          tool,
          isSelected: selectedTools.includes(tool.id),
          onToggle: handleToggle
        })
      )}
    </div>
  );
}

/**
 * AI Tools selection step component for onboarding
 * @returns {JSX.Element} JSX element for the AI tools step
 * @type {React.ReactElement}
 */
export function AIToolsStep(): React.ReactElement {
  const { selectedAITools, addAITool, removeAITool } = useOnboardingStore();

  return (
    <div className="ai-tools-step">
      <h2 data-testid="onboarding-step-title">Select Your Primary AI Tools</h2>
      <p className="step-description">
        Choose the AI tools you primarily work with. You can change this later in settings.
      </p>

      {renderAIToolsList(selectedAITools, addAITool, removeAITool)}

      <p className="help-text">{getHelpText(selectedAITools.length)}</p>
    </div>
  );
}

/**
 * Get help text based on selected tools count
 * @param {number} count - Number of selected tools
 * @returns {string} Help text message
 */
function getHelpText(count: number): string {
  if (count === 0) {
    return 'Select at least one tool, or skip to configure later.';
  }

  const toolWord = count > 1 ? 'tools' : 'tool';
  return `${count} ${toolWord} selected`;
}
