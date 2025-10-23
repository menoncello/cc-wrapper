import { apiClient } from '@lib/api';
import { useOnboardingStore } from '@stores/onboardingStore';
import { useTourStore } from '@stores/tourStore';
import { useState } from 'react';

import AIToolsStep from './AIToolsStep';
import NavigationButtons from './NavigationButtons';
import ProgressIndicator from './ProgressIndicator';
import UserTypeStep from './UserTypeStep';
import WorkspaceConfigStep from './WorkspaceConfigStep';

const TOTAL_STEPS = 3;

export default function OnboardingWizard() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    currentStep,
    userType,
    selectedAITools,
    workspaceName,
    workspaceDescription,
    workspaceTemplate,
    nextStep,
    previousStep,
    canProceed,
    reset
  } = useOnboardingStore();

  const { startTour } = useTourStore();

  const handleComplete = async () => {
    if (!canProceed()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create workspace
      await apiClient.createWorkspace({
        userType: userType || 'solo',
        preferredAITools: selectedAITools,
        workspaceName,
        workspaceDescription,
        workspaceTemplate
      });

      // Update profile with onboarding completion
      await apiClient.updateProfile({
        preferredAITools: selectedAITools,
        onboardingCompleted: true
      });

      // Reset onboarding state
      reset();

      // Start guided tour
      startTour();

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip onboarding');
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <UserTypeStep />;
      case 2:
        return <AIToolsStep />;
      case 3:
        return <WorkspaceConfigStep />;
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-wizard">
      <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {error && (
        <div className="error-banner" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="onboarding-content">{renderCurrentStep()}</div>

      <NavigationButtons
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        canProceed={canProceed()}
        onBack={previousStep}
        onNext={nextStep}
        onSkip={handleSkip}
        onComplete={handleComplete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
