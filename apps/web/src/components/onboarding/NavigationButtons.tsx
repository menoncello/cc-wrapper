import { useState } from 'react';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isSubmitting?: boolean;
}

export default function NavigationButtons({
  currentStep,
  totalSteps,
  canProceed,
  onBack,
  onNext,
  onSkip,
  onComplete,
  isSubmitting = false
}: NavigationButtonsProps) {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleSkipClick = () => {
    setShowSkipConfirm(true);
  };

  const handleSkipConfirm = () => {
    setShowSkipConfirm(false);
    onSkip();
  };

  const handleSkipCancel = () => {
    setShowSkipConfirm(false);
  };

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="navigation-buttons">
      <button
        type="button"
        className="btn btn-skip"
        onClick={handleSkipClick}
        disabled={isSubmitting}
      >
        Skip for now
      </button>

      <div className="navigation-buttons-right">
        {!isFirstStep && (
          <button
            type="button"
            data-testid="onboarding-back-button"
            className="btn btn-secondary"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </button>
        )}

        {isLastStep ? (
          <button
            type="button"
            data-testid="onboarding-complete-button"
            className="btn btn-primary"
            onClick={onComplete}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? 'Creating Workspace...' : 'Complete Setup'}
          </button>
        ) : (
          <button
            type="button"
            data-testid="onboarding-next-button"
            className="btn btn-primary"
            onClick={onNext}
            disabled={!canProceed || isSubmitting}
          >
            Next
          </button>
        )}
      </div>

      {showSkipConfirm && (
        <div className="skip-confirm-dialog">
          <div className="dialog-overlay" onClick={handleSkipCancel} />
          <div className="dialog-content">
            <h3>Skip Onboarding?</h3>
            <p>You can complete your profile setup later from settings.</p>
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={handleSkipCancel}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSkipConfirm}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
