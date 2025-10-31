import React from 'react';

// Constants for form validation
const TEXTAREA_ROWS = 3;

// Type aliases for better code organization
type PriorityType = 'low' | 'medium' | 'high';

/**
 * Name input field component
 * @param {object} props - Component props
 * @param {string} props.value - Input value
 * @param {(value: string) => void} props.onChange - Change handler
 * @param {number} props.maxLength - Maximum length
 * @returns {React.ReactElement} Name input field JSX element
 */
function NameInputField({
  value,
  onChange,
  maxLength
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}): React.ReactElement {
  return (
    <div>
      <label htmlFor="checkpoint-name" className="block text-sm font-medium text-gray-700 mb-1">
        Checkpoint Name *
      </label>
      <input
        type="text"
        id="checkpoint-name"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g., Before refactoring, Feature complete"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        maxLength={maxLength}
        required
      />
      <p className="mt-1 text-xs text-gray-500">
        {value.length}/{maxLength} characters
      </p>
    </div>
  );
}

/**
 * Description label component
 * @returns {React.ReactElement} Description label JSX element
 */
function DescriptionLabel(): React.ReactElement {
  return (
    <label
      htmlFor="checkpoint-description"
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      Description
    </label>
  );
}

/**
 * Character count component
 * @param {object} props - Component props
 * @param {number} props.current - Current character count
 * @param {number} props.max - Maximum character count
 * @returns {React.ReactElement} Character count JSX element
 */
function CharacterCount({ current, max }: { current: number; max: number }): React.ReactElement {
  return (
    <p className="mt-1 text-xs text-gray-500">
      {current}/{max} characters
    </p>
  );
}

/**
 * Description textarea field component
 * @param {object} props - Component props
 * @param {string} props.value - Textarea value
 * @param {(value: string) => void} props.onChange - Change handler
 * @param {number} props.maxLength - Maximum length
 * @returns {React.ReactElement} Description textarea field JSX element
 */
function DescriptionField({
  value,
  onChange,
  maxLength
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}): React.ReactElement {
  return (
    <div>
      <DescriptionLabel />
      <textarea
        id="checkpoint-description"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Optional description of what this checkpoint represents"
        rows={TEXTAREA_ROWS}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        maxLength={maxLength}
      />
      <CharacterCount current={value.length} max={maxLength} />
    </div>
  );
}

/**
 * Priority select field component
 * @param {object} props - Component props
 * @param {PriorityType} props.value - Selected priority
 * @param {(value: PriorityType) => void} props.onChange - Change handler
 * @returns {React.ReactElement} Priority select field JSX element
 */
function PriorityField({
  value,
  onChange
}: {
  value: PriorityType;
  onChange: (value: PriorityType) => void;
}): React.ReactElement {
  return (
    <div>
      <label htmlFor="checkpoint-priority" className="block text-sm font-medium text-gray-700 mb-1">
        Priority
      </label>
      <select
        id="checkpoint-priority"
        value={value}
        onChange={e => onChange(e.target.value as PriorityType)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="low">Low - Cleanup candidate</option>
        <option value="medium">Medium - Standard checkpoint</option>
        <option value="high">High - Important milestone</option>
      </select>
    </div>
  );
}

/**
 * Form action buttons component
 * @param {object} props - Component props
 * @param {() => void} props.onCancel - Cancel handler
 * @param {boolean} props.isSubmitting - Whether form is submitting
 * @param {boolean} props.canSubmit - Whether form can be submitted
 * @returns {React.ReactElement} Form action buttons JSX element
 */
function FormActions({
  onCancel,
  isSubmitting,
  canSubmit
}: {
  onCancel?: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}): React.ReactElement {
  return (
    <div className="flex justify-end space-x-3 pt-4 border-t">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
      )}
      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating...' : 'Create Checkpoint'}
      </button>
    </div>
  );
}

export { DescriptionField, FormActions, NameInputField, PriorityField };
