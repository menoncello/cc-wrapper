import React from 'react';

/**
 * Skip button component
 * @param {{isSubmitting: boolean, onSkipClick: () => void}} props - Component props
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onSkipClick - Function to handle skip click
 * @returns {React.ReactElement} Skip button JSX element
 */
function SkipButton({
  isSubmitting,
  onSkipClick
}: {
  isSubmitting: boolean;
  onSkipClick: () => void;
}): React.ReactElement {
  return (
    <button type="button" className="btn btn-skip" onClick={onSkipClick} disabled={isSubmitting}>
      Skip for now
    </button>
  );
}

/**
 * Back button component
 * @param {{isSubmitting: boolean, onBack: () => void}} props - Component props
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
 * @param {{canProceed: boolean, isSubmitting: boolean, onComplete: () => void}} props - Component props
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
 * @param {{canProceed: boolean, isSubmitting: boolean, onNext: () => void}} props - Component props
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
 * @param {{isLastStep: boolean, canProceed: boolean, isSubmitting: boolean, onNext: () => void, onComplete: () => void}} props - Component props
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

export { ActionButton, BackButton, CompleteButton, NextButton, SkipButton };
