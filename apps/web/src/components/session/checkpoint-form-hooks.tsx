import React, { useState } from 'react';

// Constants for form validation
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

// Type aliases for better code organization
type PriorityType = 'low' | 'medium' | 'high';

export interface FormData {
  name: string;
  description: string;
  tags: string[];
  tagInput: string;
  priority: PriorityType;
  encryptData: boolean;
  encryptionKey: string;
}

/**
 * Create default form state
 * @returns {FormData} Default form state
 */
function createDefaultFormState(): FormData {
  return {
    name: '',
    description: '',
    tags: [],
    tagInput: '',
    priority: 'medium',
    encryptData: false,
    encryptionKey: ''
  };
}

/**
 * Type for form state with setters
 */
type FormStateWithSetters = FormData & {
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setTags: (value: string[]) => void;
  setTagInput: (value: string) => void;
  setPriority: (value: PriorityType) => void;
  setEncryptData: (value: boolean) => void;
  setEncryptionKey: (value: string) => void;
  resetForm: () => void;
};

/**
 * Type for form state with all setters
 */
type FormStateWithAllSetters = FormData & {
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setTags: (value: string[]) => void;
  setTagInput: (value: string) => void;
  setPriority: (value: PriorityType) => void;
  setEncryptData: (value: boolean) => void;
  setEncryptionKey: (value: string) => void;
};

/**
 * Create form state values
 * @param {FormData} defaultState - Default form state
 * @returns {FormStateWithAllSetters} Form state values with setters
 */
function createFormStateValues(defaultState: FormData): FormStateWithAllSetters {
  const [name, setName] = useState(defaultState.name);
  const [description, setDescription] = useState(defaultState.description);
  const [tags, setTags] = useState<string[]>(defaultState.tags);
  const [tagInput, setTagInput] = useState(defaultState.tagInput);
  const [priority, setPriority] = useState<PriorityType>(defaultState.priority);
  const [encryptData, setEncryptData] = useState(defaultState.encryptData);
  const [encryptionKey, setEncryptionKey] = useState(defaultState.encryptionKey);

  return {
    name,
    description,
    tags,
    tagInput,
    priority,
    encryptData,
    encryptionKey,
    setName,
    setDescription,
    setTags,
    setTagInput,
    setPriority,
    setEncryptData,
    setEncryptionKey
  };
}

/**
 * Type for form state setters
 */
interface FormStateSetters {
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setTags: (value: string[]) => void;
  setTagInput: (value: string) => void;
  setPriority: (value: PriorityType) => void;
  setEncryptData: (value: boolean) => void;
  setEncryptionKey: (value: string) => void;
}

/**
 * Create reset form function
 * @param {FormData} defaultState - Default form state
 * @param {FormStateSetters} setters - Form state setters
 * @returns {() => void} Reset form function
 */
function createResetFormFunction(defaultState: FormData, setters: FormStateSetters): () => void {
  return (): void => {
    setters.setName(defaultState.name);
    setters.setDescription(defaultState.description);
    setters.setTags(defaultState.tags);
    setters.setTagInput(defaultState.tagInput);
    setters.setPriority(defaultState.priority);
    setters.setEncryptData(defaultState.encryptData);
    setters.setEncryptionKey(defaultState.encryptionKey);
  };
}

/**
 * Create form state managers
 * @param {FormData} defaultState - Default form state
 * @returns {FormStateWithSetters} Form state with setters
 */
function createFormStateManagers(defaultState: FormData): FormStateWithSetters {
  const stateValues = createFormStateValues(defaultState);
  const resetForm = createResetFormFunction(defaultState, {
    setName: stateValues.setName,
    setDescription: stateValues.setDescription,
    setTags: stateValues.setTags,
    setTagInput: stateValues.setTagInput,
    setPriority: stateValues.setPriority,
    setEncryptData: stateValues.setEncryptData,
    setEncryptionKey: stateValues.setEncryptionKey
  });

  return {
    ...stateValues,
    resetForm
  };
}

/**
 * Custom hook for checkpoint form state management
 * @returns {FormStateWithSetters} Form state and handlers
 */
export function useCheckpointForm(): FormStateWithSetters {
  const defaultState = createDefaultFormState();
  return createFormStateManagers(defaultState);
}

/**
 * Tag management functions
 * @param {string[]} tags - Current tags array
 * @param {string} tagInput - Current tag input value
 * @param {(value: string[]) => void} setTags - Function to set tags
 * @param {(value: string) => void} setTagInput - Function to set tag input
 * @returns {{
 *   handleAddTag: () => void;
 *   handleRemoveTag: (tagToRemove: string) => void;
 *   handleKeyPress: (e: React.KeyboardEvent) => void;
 * }} Tag handlers
 */
export function useTagHandlers(
  tags: string[],
  tagInput: string,
  setTags: (value: string[]) => void,
  setTagInput: (value: string) => void
): {
  handleAddTag: () => void;
  handleRemoveTag: (tagToRemove: string) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
} {
  const handleAddTag = (): void => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string): void => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      handleAddTag();
    }
  };

  return { handleAddTag, handleRemoveTag, handleKeyPress };
}

/**
 * Interface for checkpoint creation options
 */
interface CheckpointOptions {
  description?: string;
  tags?: string[];
  priority: PriorityType;
  encryptData: boolean;
  encryptionKey?: string;
}

/**
 * Type alias for create checkpoint function
 */
type CreateCheckpointFunction = (name: string, options?: CheckpointOptions) => Promise<string>;

/**
 * Type alias for optional session ID
 */
type OptionalSessionId = string | undefined;

/**
 * Type alias for form data subset used in submission
 */
type FormDataForSubmission = Pick<
  FormData,
  'name' | 'description' | 'tags' | 'priority' | 'encryptData' | 'encryptionKey'
>;

/**
 * Interface for form submission parameters
 */
interface FormSubmissionParams {
  formData: FormDataForSubmission;
  effectiveSessionId: OptionalSessionId;
  createCheckpoint: CreateCheckpointFunction;
  resetForm: () => void;
  onCheckpointCreated?: (checkpointId: string) => void;
}

/**
 * Validate form data before submission
 * @param {FormDataForSubmission} formData - Form data to validate
 * @param {OptionalSessionId} effectiveSessionId - Effective session ID
 * @returns {boolean} Whether form data is valid
 */
function validateFormData(
  formData: FormDataForSubmission,
  effectiveSessionId: OptionalSessionId
): boolean {
  return Boolean(formData.name.trim() && effectiveSessionId);
}

/**
 * Prepare checkpoint options from form data
 * @param {FormDataForSubmission} formData - Form data
 * @returns {CheckpointOptions} Checkpoint options
 */
function prepareCheckpointOptions(formData: FormDataForSubmission): CheckpointOptions {
  return {
    description: formData.description.trim() || undefined,
    tags: formData.tags.length > 0 ? formData.tags : undefined,
    priority: formData.priority,
    encryptData: formData.encryptData,
    encryptionKey:
      formData.encryptData && formData.encryptionKey.trim()
        ? formData.encryptionKey.trim()
        : undefined
  };
}

/**
 * Handle successful checkpoint creation
 * @param {() => void} resetForm - Reset form function
 * @param {(checkpointId: string) => void | undefined} onCheckpointCreated - Callback when checkpoint is created
 * @param {string} checkpointId - Created checkpoint ID
 */
function handleSuccessfulCheckpointCreation(
  resetForm: () => void,
  onCheckpointCreated: ((checkpointId: string) => void) | undefined,
  checkpointId: string
): void {
  resetForm();

  if (onCheckpointCreated) {
    onCheckpointCreated(checkpointId);
  }
}

/**
 * Handle form submission
 * @param {FormSubmissionParams} params - Form submission parameters
 * @returns {Promise<void>} Promise that resolves when checkpoint is created
 */
export async function handleFormSubmit(params: FormSubmissionParams): Promise<void> {
  const { formData, effectiveSessionId, createCheckpoint, resetForm, onCheckpointCreated } = params;

  if (!validateFormData(formData, effectiveSessionId)) {
    return;
  }

  try {
    const checkpointOptions = prepareCheckpointOptions(formData);
    const checkpointId = await createCheckpoint(formData.name.trim(), checkpointOptions);

    handleSuccessfulCheckpointCreation(resetForm, onCheckpointCreated, checkpointId);
  } catch {
    // Error creating checkpoint - handle gracefully
  }
}

export { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH };
