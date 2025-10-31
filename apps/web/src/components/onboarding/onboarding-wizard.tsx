import React, { useState } from 'react';

import { apiClient } from '../../lib/api';
import { type OnboardingState, useOnboardingStore } from '../../stores/onboarding-store';
import { useTourStore } from '../../stores/tour-store';
import { AIToolsStep } from './ai-tools-step';
import { NavigationButtons } from './navigation-buttons';
import { ProgressIndicator } from './progress-indicator';
import { UserTypeStep } from './user-type-step';
import { WorkspaceConfigStep } from './workspace-config-step';

// Step constants
const TOTAL_STEPS = 3;
const USER_TYPE_STEP = 1;
const AI_TOOLS_STEP = 2;
const WORKSPACE_CONFIG_STEP = 3;

/**
 * Handle completion errors by setting error message and resetting submission state
 * @param {unknown} error - The error that occurred
 * @param {(error: string | null) => void} setError - Function to set error state
 * @param {(submitting: boolean) => void} setIsSubmitting - Function to set submission state
 * @returns {void}
 * @type {void}
 */
function handleCompletionError(
  error: unknown,
  setError: (error: string | null) => void,
  setIsSubmitting: (submitting: boolean) => void
): void {
  const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding';
  setError(errorMessage);
  setIsSubmitting(false);
}

/**
 * Create onboarding completion handler
 * @param {OnboardingState} store - Onboarding store state
 * @param {() => void} startTour - Function to start the guided tour
 * @param {(error: string | null) => void} setError - Function to set error state
 * @param {(submitting: boolean) => void} setIsSubmitting - Function to set submission state
 * @returns {() => Promise<void>} Async function to handle onboarding completion
 * @type {() => Promise<void>}
 */
function createOnCompletionHandler(
  store: OnboardingState,
  startTour: () => void,
  setError: (error: string | null) => void,
  setIsSubmitting: (submitting: boolean) => void
): () => Promise<void> {
  return async (): Promise<void> => {
    if (!store.canProceed()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await completeOnboarding({
        userType: store.userType || 'solo',
        selectedAITools: store.selectedAITools,
        workspaceName: store.workspaceName,
        workspaceDescription: store.workspaceDescription,
        workspaceTemplate: store.workspaceTemplate,
        reset: store.reset,
        startTour: startTour
      });
    } catch (error) {
      handleCompletionError(error, setError, setIsSubmitting);
    }
  };
}

/**
 * Create onboarding skip handler
 * @param {() => void} reset - Function to reset onboarding state
 * @param {(error: string | null) => void} setError - Function to set error state
 * @param {(submitting: boolean) => void} setIsSubmitting - Function to set submission state
 * @returns {() => Promise<void>} Async function to handle onboarding skip
 * @type {() => Promise<void>}
 */
function createSkipHandler(
  reset: () => void,
  setError: (error: string | null) => void,
  setIsSubmitting: (submitting: boolean) => void
): () => Promise<void> {
  return async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      await skipOnboarding(reset);
    } catch (error) {
      handleCompletionError(error, setError, setIsSubmitting);
    }
  };
}

/**
 * Render the current step component based on the step number
 * @param {number} currentStep - The current step number
 * @returns {JSX.Element | null} JSX element for the current step or null
 * @type {React.ReactElement | null}
 */
function renderCurrentStep(currentStep: number): React.ReactElement | null {
  switch (currentStep) {
    case USER_TYPE_STEP:
      return <UserTypeStep />;
    case AI_TOOLS_STEP:
      return <AIToolsStep />;
    case WORKSPACE_CONFIG_STEP:
      return <WorkspaceConfigStep />;
    default:
      return null;
  }
}

/**
 * Main onboarding wizard component that guides users through the setup process
 * @returns {JSX.Element} JSX element for the onboarding wizard
 * @type {React.ReactElement}
 */
export function OnboardingWizard(): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = useOnboardingStore();
  const { startTour } = useTourStore();

  const handleComplete = createOnCompletionHandler(store, startTour, setError, setIsSubmitting);
  const handleSkip = createSkipHandler(store.reset, setError, setIsSubmitting);

  return (
    <div className="onboarding-wizard">
      <ProgressIndicator currentStep={store.currentStep} totalSteps={TOTAL_STEPS} />

      {error && (
        <div className="error-banner" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="onboarding-content">{renderCurrentStep(store.currentStep)}</div>

      <NavigationButtons
        currentStep={store.currentStep}
        totalSteps={TOTAL_STEPS}
        canProceed={store.canProceed()}
        onBack={store.previousStep}
        onNext={store.nextStep}
        onSkip={handleSkip}
        onComplete={handleComplete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

/**
 * Configuration for onboarding completion
 */
interface OnboardingConfig {
  userType: string;
  selectedAITools: string[];
  workspaceName: string;
  workspaceDescription: string;
  workspaceTemplate: string;
  reset: () => void;
  startTour: () => void;
}

/**
 * Complete the onboarding process by creating workspace and updating profile
 * @param {OnboardingConfig} config - Onboarding configuration object
 * @param {string} config.userType - The user type
 * @param {string[]} config.selectedAITools - Selected AI tools
 * @param {string} config.workspaceName - Workspace name
 * @param {string} config.workspaceDescription - Workspace description
 * @param {string} config.workspaceTemplate - Workspace template
 * @param {() => void} config.reset - Function to reset onboarding state
 * @param {() => void} config.startTour - Function to start guided tour
 * @returns {Promise<void>} Promise that resolves when onboarding is complete
 */
async function completeOnboarding(config: OnboardingConfig): Promise<void> {
  // Create workspace
  await apiClient.createWorkspace({
    userType: config.userType,
    preferredAITools: config.selectedAITools,
    workspaceName: config.workspaceName,
    workspaceDescription: config.workspaceDescription,
    workspaceTemplate: config.workspaceTemplate
  });

  // Update profile with onboarding completion
  await apiClient.updateProfile({
    preferredAITools: config.selectedAITools,
    onboardingCompleted: true
  });

  // Reset onboarding state
  config.reset();

  // Start guided tour
  config.startTour();

  // Redirect to dashboard
  window.location.href = '/dashboard';
}

/**
 * Skip onboarding by creating default workspace
 * @param {() => void} reset - Function to reset onboarding state
 * @returns {Promise<void>} Promise that resolves when onboarding is skipped
 */
async function skipOnboarding(reset: () => void): Promise<void> {
  // Create default workspace
  await apiClient.createWorkspace({
    userType: 'solo',
    preferredAITools: [],
    workspaceName: 'My Workspace',
    workspaceDescription: '',
    workspaceTemplate: 'Custom'
  });

  // Update profile
  await apiClient.updateProfile({
    onboardingCompleted: false
  });

  // Reset onboarding state
  reset();

  // Redirect to dashboard with skip flag
  window.location.href = '/dashboard?onboarding=skipped';
}
