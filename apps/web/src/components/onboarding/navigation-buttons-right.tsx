import React from 'react';

export interface NavigationRightProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
}

/**
 * Back button component
 * @param {object} props - Component props
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onBack - Function to handle back click
 * @returns {React.ReactElement} Back button JSX element
 */
function BackButton({
  isSubmitting,
  onBack
}: {
  isSubmitting: boolean;
  onBack: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      data-testid="onboarding-back-button"
      className="btn btn-secondary"
      onClick={onBack}
      disabled={isSubmitting}
    >
      Back
    </button>
  );
}

/**
 * Complete button component
 * @param {object} props - Component props
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onComplete - Function to handle complete click
 * @returns {React.ReactElement} Complete button JSX element
 */
function CompleteButton({
  canProceed,
  isSubmitting,
  onComplete
}: {
  canProceed: boolean;
  isSubmitting: boolean;
  onComplete: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      data-testid="onboarding-complete-button"
      className="btn btn-primary"
      onClick={onComplete}
      disabled={!canProceed || isSubmitting}
    >
      {isSubmitting ? 'Creating Workspace...' : 'Complete Setup'}
    </button>
  );
}

/**
 * Next button component
 * @param {object} props - Component props
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onNext - Function to handle next click
 * @returns {React.ReactElement} Next button JSX element
 */
function NextButton({
  canProceed,
  isSubmitting,
  onNext
}: {
  canProceed: boolean;
  isSubmitting: boolean;
  onNext: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      data-testid="onboarding-next-button"
      className="btn btn-primary"
      onClick={onNext}
      disabled={!canProceed || isSubmitting}
    >
      Next
    </button>
  );
}

/**
 * Action button component (next or complete)
 * @param {object} props - Component props
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onNext - Function to handle next click
 * @param {() => void} props.onComplete - Function to handle complete click
 * @returns {React.ReactElement} Action button JSX element
 */
function ActionButton({
  isLastStep,
  canProceed,
  isSubmitting,
  onNext,
  onComplete
}: {
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  onComplete: () => void;
}): React.ReactElement {
  return isLastStep ? (
    <CompleteButton canProceed={canProceed} isSubmitting={isSubmitting} onComplete={onComplete} />
  ) : (
    <NextButton canProceed={canProceed} isSubmitting={isSubmitting} onNext={onNext} />
  );
}

/**
 * Right navigation component containing back and action buttons
 * @param {object} props - Component props
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onBack - Function to call when the back button is clicked
 * @param {() => void} props.onNext - Function to call when the next button is clicked
 * @param {() => void} props.onComplete - Function to call when the wizard is completed
 * @returns {React.ReactElement} Right navigation component JSX element
 */
export function NavigationRight({
  isFirstStep,
  isLastStep,
  canProceed,
  isSubmitting,
  onBack,
  onNext,
  onComplete
}: NavigationRightProps): React.ReactElement {
  return (
    <div className="navigation-buttons-right">
      {!isFirstStep && <BackButton isSubmitting={isSubmitting} onBack={onBack} />}
      <ActionButton
        isLastStep={isLastStep}
        canProceed={canProceed}
        isSubmitting={isSubmitting}
        onNext={onNext}
        onComplete={onComplete}
      />
    </div>
  );
}
