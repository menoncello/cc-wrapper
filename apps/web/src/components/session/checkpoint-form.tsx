import React from 'react';

import { useSessionStore } from '../../stores/session-store';
import type { CheckpointCreateOptions } from '../../stores/session-types';
import { EncryptionField } from './checkpoint-form-encryption';
import {
  DescriptionField,
  FormActions,
  NameInputField,
  PriorityField
} from './checkpoint-form-fields';
import {
  handleFormSubmit,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
  useCheckpointForm,
  useTagHandlers
} from './checkpoint-form-hooks';
import { TagsField } from './checkpoint-form-tags';

interface CheckpointFormProps {
  sessionId?: string;
  onCheckpointCreated?: (checkpointId: string) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * No session message component
 * @param {string} className - Additional CSS classes
 * @returns {React.ReactElement} No session message JSX element
 */
function NoSessionMessage({ className }: { className: string }): React.ReactElement {
  return (
    <div className={`p-4 text-center ${className}`}>
      <p className="text-sm text-gray-600">No active session</p>
      <p className="text-xs text-gray-500">Start a session to create checkpoints</p>
    </div>
  );
}

/**
 * Basic checkpoint form fields component
 * @param {object} props - Component props
 * @param {object} props.formData - Form data from hook
 * @returns {React.ReactElement} Basic form fields JSX element
 */
function BasicCheckpointFields({
  formData
}: {
  formData: ReturnType<typeof useCheckpointForm>;
}): React.ReactElement {
  return (
    <>
      <NameInputField
        value={formData.name}
        onChange={formData.setName}
        maxLength={MAX_NAME_LENGTH}
      />

      <DescriptionField
        value={formData.description}
        onChange={formData.setDescription}
        maxLength={MAX_DESCRIPTION_LENGTH}
      />

      <PriorityField value={formData.priority} onChange={formData.setPriority} />
    </>
  );
}

/**
 * Advanced checkpoint form fields component
 * @param {object} props - Component props
 * @param {object} props.formData - Form data from hook
 * @param {object} props.tagHandlers - Tag handlers from hook
 * @returns {React.ReactElement} Advanced form fields JSX element
 */
function AdvancedCheckpointFields({
  formData,
  tagHandlers
}: {
  formData: ReturnType<typeof useCheckpointForm>;
  tagHandlers: ReturnType<typeof useTagHandlers>;
}): React.ReactElement {
  return (
    <>
      <TagsField
        tagInput={formData.tagInput}
        onTagInputChange={formData.setTagInput}
        onAddTag={tagHandlers.handleAddTag}
        onKeyPress={tagHandlers.handleKeyPress}
        tags={formData.tags}
        onRemoveTag={tagHandlers.handleRemoveTag}
      />

      <EncryptionField
        encryptData={formData.encryptData}
        onEncryptDataChange={formData.setEncryptData}
        encryptionKey={formData.encryptionKey}
        onEncryptionKeyChange={formData.setEncryptionKey}
      />
    </>
  );
}

/**
 * Checkpoint form content component
 * @param {object} props - Component props
 * @param {object} props.formData - Form data from hook
 * @param {object} props.tagHandlers - Tag handlers from hook
 * @param {boolean} props.isCreatingCheckpoint - Whether checkpoint is being created
 * @param {() => void} props.onCancel - Cancel handler
 * @param {() => void} props.handleSubmit - Submit handler
 * @returns {React.ReactElement} Form content JSX element
 */
function CheckpointFormContent({
  formData,
  tagHandlers,
  isCreatingCheckpoint,
  onCancel,
  handleSubmit
}: {
  formData: ReturnType<typeof useCheckpointForm>;
  tagHandlers: ReturnType<typeof useTagHandlers>;
  isCreatingCheckpoint: boolean;
  onCancel?: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}): React.ReactElement {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <BasicCheckpointFields formData={formData} />
      <AdvancedCheckpointFields formData={formData} tagHandlers={tagHandlers} />
      <FormActions
        onCancel={onCancel}
        isSubmitting={isCreatingCheckpoint}
        canSubmit={formData.name.trim().length > 0}
      />
    </form>
  );
}

/**
 * Get effective session ID
 * @param {string | undefined} sessionId - Prop session ID
 * @param {{id?: string} | null} currentSession - Current session from store
 * @returns {string | undefined} Effective session ID
 */
function getEffectiveSessionId(
  sessionId: string | undefined,
  currentSession: { id?: string } | null
): string | undefined {
  return sessionId || currentSession?.id;
}

/**
 * Type for create checkpoint function
 */
type CreateCheckpointFunc = (name: string, options?: CheckpointCreateOptions) => Promise<string>;

/**
 * Parameters for submit handler
 */
interface SubmitHandlerParams {
  formData: ReturnType<typeof useCheckpointForm>;
  effectiveSessionId: string | undefined;
  createCheckpoint: CreateCheckpointFunc;
  onCheckpointCreated?: (checkpointId: string) => void;
}

/**
 * Create form submit handler
 * @param {SubmitHandlerParams} params - Submit handler parameters
 * @returns {(e: React.FormEvent) => Promise<void>} Submit handler function
 */
function createSubmitHandler(params: SubmitHandlerParams): (e: React.FormEvent) => Promise<void> {
  const { formData, effectiveSessionId, createCheckpoint, onCheckpointCreated } = params;

  return async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await handleFormSubmit({
      formData,
      effectiveSessionId,
      createCheckpoint,
      resetForm: formData.resetForm,
      onCheckpointCreated
    });
  };
}

/**
 * Interface for form setup data
 */
interface FormSetupData {
  formData: ReturnType<typeof useCheckpointForm>;
  tagHandlers: ReturnType<typeof useTagHandlers>;
  effectiveSessionId: string | undefined;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isCreatingCheckpoint: boolean;
}

/**
 * Setup form hooks and handlers
 * @param {CheckpointFormProps} props - Component props
 * @returns {FormSetupData} Form setup data
 */
function setupFormHooks(props: CheckpointFormProps): FormSetupData {
  const { currentSession, isCreatingCheckpoint, createCheckpoint } = useSessionStore();
  const formData = useCheckpointForm();
  const tagHandlers = useTagHandlers(
    formData.tags,
    formData.tagInput,
    formData.setTags,
    formData.setTagInput
  );

  const effectiveSessionId = getEffectiveSessionId(props.sessionId, currentSession);
  const handleSubmit = createSubmitHandler({
    formData,
    effectiveSessionId,
    createCheckpoint,
    onCheckpointCreated: props.onCheckpointCreated
  });

  return {
    formData,
    tagHandlers,
    effectiveSessionId,
    handleSubmit,
    isCreatingCheckpoint
  };
}

/**
 * Parameters for render checkpoint form content
 */
interface RenderFormContentParams {
  formData: ReturnType<typeof useCheckpointForm>;
  tagHandlers: ReturnType<typeof useTagHandlers>;
  isCreatingCheckpoint: boolean;
  onCancel?: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  className: string;
}

/**
 * Render checkpoint form content
 * @param {RenderFormContentParams} params - Render parameters
 * @returns {React.ReactElement} Form content
 */
function renderCheckpointFormContent(params: RenderFormContentParams): React.ReactElement {
  const { formData, tagHandlers, isCreatingCheckpoint, onCancel, handleSubmit, className } = params;

  return (
    <div className={`checkpoint-form ${className}`}>
      <CheckpointFormContent
        formData={formData}
        tagHandlers={tagHandlers}
        isCreatingCheckpoint={isCreatingCheckpoint}
        onCancel={onCancel}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

/**
 * Checkpoint form component for creating new checkpoints
 * @param {CheckpointFormProps} props - Component props
 * @returns {React.ReactElement} JSX element for checkpoint form
 */
export const CheckpointForm = ({
  sessionId,
  onCheckpointCreated,
  onCancel,
  className = ''
}: CheckpointFormProps): React.ReactElement => {
  const formSetup = setupFormHooks({ sessionId, onCheckpointCreated, onCancel, className });

  if (!formSetup.effectiveSessionId) {
    return <NoSessionMessage className={className} />;
  }

  return renderCheckpointFormContent({
    formData: formSetup.formData,
    tagHandlers: formSetup.tagHandlers,
    isCreatingCheckpoint: formSetup.isCreatingCheckpoint,
    onCancel,
    handleSubmit: formSetup.handleSubmit,
    className
  });
};
