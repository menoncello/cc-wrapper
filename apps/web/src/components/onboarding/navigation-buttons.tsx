import React from 'react';

import { ActionButton, BackButton, SkipButton } from './navigation-button-components';
import { SkipDialogWrapper } from './navigation-dialog';
import { createNavigationProps } from './navigation-utils';

export interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isSubmitting?: boolean;
}

/**
 * Renders right side navigation buttons
 * @param {object} props - Component props
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onBack - Function to handle back click
 * @param {() => void} props.onNext - Function to handle next click
 * @param {() => void} props.onComplete - Function to handle complete click
 * @returns {JSX.Element} Right navigation buttons JSX element
 * @type {React.ReactElement}
 */
function NavigationRightSide({
  isFirstStep,
  isLastStep,
  canProceed,
  isSubmitting,
  onBack,
  onNext,
  onComplete
}: {
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
}): React.ReactElement {
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

/**
 * Renders main navigation components
 * @param {object} props - Component props
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onBack - Function to handle back click
 * @param {() => void} props.onNext - Function to handle next click
 * @param {() => void} props.onComplete - Function to handle complete click
 * @param {() => void} props.onSkipClick - Function to handle skip click
 * @returns {React.ReactElement} Main navigation components JSX element
 * @type {React.ReactElement}
 */
function NavigationMain(props: {
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  onSkipClick: () => void;
}): React.ReactElement {
  return (
    <>
      <SkipButton isSubmitting={props.isSubmitting} onSkipClick={props.onSkipClick} />
      <NavigationRightSide
        isFirstStep={props.isFirstStep}
        isLastStep={props.isLastStep}
        canProceed={props.canProceed}
        isSubmitting={props.isSubmitting}
        onBack={props.onBack}
        onNext={props.onNext}
        onComplete={props.onComplete}
      />
    </>
  );
}

/**
 * Creates navigation props
 * @param {object} props - Component props
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onBack - Function to handle back click
 * @param {() => void} props.onNext - Function to handle next click
 * @param {() => void} props.onComplete - Function to handle complete click
 * @param {() => void} props.handleSkipClick - Function to handle skip click
 * @returns {object} Navigation props object
 * @type {{
 *   isFirstStep: boolean;
 *   isLastStep: boolean;
 *   canProceed: boolean;
 *   isSubmitting: boolean;
 *   onBack: () => void;
 *   onNext: () => void;
 *   onComplete: () => void;
 *   onSkipClick: () => void;
 * }}
 */
function createNavProps(props: {
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  handleSkipClick: () => void;
}): {
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  onSkipClick: () => void;
} {
  return {
    isFirstStep: props.isFirstStep,
    isLastStep: props.isLastStep,
    canProceed: props.canProceed,
    isSubmitting: props.isSubmitting,
    onBack: props.onBack,
    onNext: props.onNext,
    onComplete: props.onComplete,
    onSkipClick: props.handleSkipClick
  };
}

/**
 * Creates dialog props
 * @param {object} props - Component props
 * @param {boolean} props.showSkipConfirm - Whether to show the skip confirmation dialog
 * @param {() => void} props.handleSkipConfirm - Function to handle skip confirmation
 * @param {() => void} props.handleSkipCancel - Function to handle skip cancellation
 * @param {() => void} props.onSkip - Function to handle skip action
 * @returns {object} Dialog props object
 * @type {{
 *   showSkipConfirm: boolean;
 *   handleSkipConfirm: () => void;
 *   handleSkipCancel: () => void;
 *   onSkip: () => void;
 * }}
 */
function createDialogProps(props: {
  showSkipConfirm: boolean;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
  onSkip: () => void;
}): {
  showSkipConfirm: boolean;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
  onSkip: () => void;
} {
  return {
    showSkipConfirm: props.showSkipConfirm,
    handleSkipConfirm: props.handleSkipConfirm,
    handleSkipCancel: props.handleSkipCancel,
    onSkip: props.onSkip
  };
}

/**
 * Renders navigation content components
 * @param {object} props - Component props
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onBack - Function to handle back click
 * @param {() => void} props.onNext - Function to handle next click
 * @param {() => void} props.onComplete - Function to handle complete click
 * @param {() => void} props.onSkip - Function to handle skip click
 * @param {object} props.skipHandlers - Skip handlers object
 * @param {boolean} props.skipHandlers.showSkipConfirm - Whether to show skip confirmation
 * @param {() => void} props.skipHandlers.handleSkipClick - Function to handle skip click
 * @param {() => void} props.skipHandlers.handleSkipConfirm - Function to handle skip confirmation
 * @param {() => void} props.skipHandlers.handleSkipCancel - Function to handle skip cancellation
 * @returns {React.ReactElement} Navigation content components JSX element
 * @type {React.ReactElement}
 */
function NavigationContent(props: {
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  onSkip: () => void;
  skipHandlers: {
    showSkipConfirm: boolean;
    handleSkipClick: () => void;
    handleSkipConfirm: () => void;
    handleSkipCancel: () => void;
  };
}): React.ReactElement {
  return (
    <>
      <NavigationMain
        {...createNavProps({ ...props, handleSkipClick: props.skipHandlers.handleSkipClick })}
      />
      <SkipDialogWrapper {...createDialogProps({ ...props.skipHandlers, onSkip: props.onSkip })} />
    </>
  );
}

/**
 * Navigation buttons component for the onboarding wizard
 * @param {object} props - Component props
 * @param {number} props.currentStep - The current step number (0-indexed)
 * @param {number} props.totalSteps - The total number of steps in the wizard
 * @param {boolean} props.canProceed - Whether the user can proceed to the next step
 * @param {() => void} props.onBack - Function to call when the back button is clicked
 * @param {() => void} props.onNext - Function to call when the next button is clicked
 * @param {() => void} props.onSkip - Function to call when the skip button is clicked
 * @param {() => void} props.onComplete - Function to call when the wizard is completed
 * @param {boolean} props.isSubmitting - Whether the form is currently submitting
 * @returns {React.ReactElement} JSX element for navigation buttons
 * @type {React.ReactElement}
 */
export function NavigationButtons({
  currentStep,
  totalSteps,
  canProceed,
  onBack,
  onNext,
  onSkip,
  onComplete,
  isSubmitting = false
}: NavigationButtonsProps): React.ReactElement {
  const navigationProps = createNavigationProps({
    currentStep,
    totalSteps,
    canProceed,
    isSubmitting,
    onBack,
    onNext,
    onSkip,
    onComplete
  });

  return (
    <div className="navigation-buttons">
      <NavigationContent {...navigationProps} />
    </div>
  );
}
