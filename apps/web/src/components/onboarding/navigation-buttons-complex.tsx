import React, { useState } from 'react';

import { NavigationSkipDialog } from './navigation-buttons-dialog';
import { NavigationLeft } from './navigation-buttons-left';
import { NavigationRight } from './navigation-buttons-right';

// Constants for navigation
const FIRST_STEP_INDEX = 1;

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
 * Hook to manage skip confirmation state
 * @returns {[boolean, () => void, () => void, () => void]} Skip confirmation state and handlers
 */
function useSkipConfirmation(): [boolean, () => void, () => void, () => void] {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleSkipClick = (): void => setShowSkipConfirm(true);
  const handleSkipConfirm = (): void => setShowSkipConfirm(false);
  const handleSkipCancel = (): void => setShowSkipConfirm(false);

  return [showSkipConfirm, handleSkipClick, handleSkipConfirm, handleSkipCancel] as const;
}

/**
 * Get step navigation state
 * @param {number} currentStep - The current step number
 * @param {number} totalSteps - The total number of steps
 * @returns {{isFirstStep: boolean, isLastStep: boolean}} Object with step state information
 */
function getStepState(
  currentStep: number,
  totalSteps: number
): { isFirstStep: boolean; isLastStep: boolean } {
  return {
    isFirstStep: currentStep === FIRST_STEP_INDEX,
    isLastStep: currentStep === totalSteps
  };
}

/**
 * Get navigation hooks and state
 * @param {number} currentStep - The current step number
 * @param {number} totalSteps - The total number of steps
 * @returns {{showSkipConfirm: boolean, handleSkipClick: () => void, handleSkipConfirm: () => void, handleSkipCancel: () => void, isFirstStep: boolean, isLastStep: boolean}} Navigation state and handlers
 */
function useNavigationState(
  currentStep: number,
  totalSteps: number
): {
  showSkipConfirm: boolean;
  handleSkipClick: () => void;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
} {
  const [showSkipConfirm, handleSkipClick, handleSkipConfirm, handleSkipCancel] =
    useSkipConfirmation();
  const { isFirstStep, isLastStep } = getStepState(currentStep, totalSteps);

  return {
    showSkipConfirm,
    handleSkipClick,
    handleSkipConfirm,
    handleSkipCancel,
    isFirstStep,
    isLastStep
  };
}

/**
 * Renders left navigation component
 * @param {{isSubmitting: boolean, handleSkipClick: () => void}} props - Component props containing submission state and skip handler
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.handleSkipClick - Function to handle skip click
 * @returns {React.ReactElement} Left navigation component JSX element
 */
function NavigationLeftComponent(props: {
  isSubmitting: boolean;
  handleSkipClick: () => void;
}): React.ReactElement {
  return (
    <NavigationLeft isSubmitting={props.isSubmitting} handleSkipClick={props.handleSkipClick} />
  );
}

/**
 * Renders right navigation component
 * @param {{isFirstStep: boolean, isLastStep: boolean, canProceed: boolean, isSubmitting: boolean, onBack: () => void, onNext: () => void, onComplete: () => void}} props - Component props containing navigation state and handlers
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onBack - Function to call when the back button is clicked
 * @param {() => void} props.onNext - Function to call when the next button is clicked
 * @param {() => void} props.onComplete - Function to call when the wizard is completed
 * @returns {React.ReactElement} Right navigation component JSX element
 */
function NavigationRightComponent(props: {
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
}): React.ReactElement {
  return (
    <NavigationRight
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      canProceed={props.canProceed}
      isSubmitting={props.isSubmitting}
      onBack={props.onBack}
      onNext={props.onNext}
      onComplete={props.onComplete}
    />
  );
}

/**
 * Renders navigation left section
 * @param {{isSubmitting: boolean, handleSkipClick: () => void}} props - Component props containing left navigation state
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.handleSkipClick - Function to handle skip click
 * @returns {React.ReactElement} Left navigation JSX element
 */
function NavigationLeftSection(props: {
  isSubmitting: boolean;
  handleSkipClick: () => void;
}): React.ReactElement {
  return (
    <NavigationLeftComponent
      isSubmitting={props.isSubmitting}
      handleSkipClick={props.handleSkipClick}
    />
  );
}

/**
 * Renders navigation right section
 * @param {{isFirstStep: boolean, isLastStep: boolean, canProceed: boolean, isSubmitting: boolean, onBack: () => void, onNext: () => void, onComplete: () => void}} props - Component props containing right navigation state
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onBack - Function to call when the back button is clicked
 * @param {() => void} props.onNext - Function to call when the next button is clicked
 * @param {() => void} props.onComplete - Function to call when the wizard is completed
 * @returns {React.ReactElement} Right navigation JSX element
 */
function NavigationRightSection(props: {
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
}): React.ReactElement {
  return (
    <NavigationRightComponent
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      canProceed={props.canProceed}
      isSubmitting={props.isSubmitting}
      onBack={props.onBack}
      onNext={props.onNext}
      onComplete={props.onComplete}
    />
  );
}

/**
 * Renders skip dialog component
 * @param {{onSkip: () => void, showSkipConfirm: boolean, handleSkipConfirm: () => void, handleSkipCancel: () => void}} props - Component props containing skip state and handlers
 * @param {() => void} props.onSkip - Function to call when the skip button is clicked
 * @param {boolean} props.showSkipConfirm - Whether the skip confirmation is visible
 * @param {() => void} props.handleSkipConfirm - Function to confirm skip
 * @param {() => void} props.handleSkipCancel - Function to cancel skip
 * @returns {React.ReactElement} Skip dialog component JSX element
 */
function NavigationSkipComponent(props: {
  onSkip: () => void;
  showSkipConfirm: boolean;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
}): React.ReactElement {
  return (
    <NavigationSkipDialog
      showSkipConfirm={props.showSkipConfirm}
      handleSkipConfirm={props.handleSkipConfirm}
      handleSkipCancel={props.handleSkipCancel}
      onSkip={props.onSkip}
    />
  );
}

/**
 * Renders left navigation wrapper
 * @param {{isSubmitting: boolean, handleSkipClick: () => void}} props - Component props containing left navigation state
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.handleSkipClick - Function to handle skip click
 * @returns {React.ReactElement} Left navigation wrapper JSX element
 */
function LeftNavWrapper(props: {
  isSubmitting: boolean;
  handleSkipClick: () => void;
}): React.ReactElement {
  return <NavigationLeftSection {...props} />;
}

/**
 * Renders right navigation wrapper
 * @param {{isFirstStep: boolean, isLastStep: boolean, canProceed: boolean, isSubmitting: boolean, onBack: () => void, onNext: () => void, onComplete: () => void}} props - Component props containing right navigation state
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onBack - Function to call when the back button is clicked
 * @param {() => void} props.onNext - Function to call when the next button is clicked
 * @param {() => void} props.onComplete - Function to call when the wizard is completed
 * @returns {React.ReactElement} Right navigation wrapper JSX element
 */
function RightNavWrapper(props: {
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
}): React.ReactElement {
  return <NavigationRightSection {...props} />;
}

/**
 * Renders skip navigation wrapper
 * @param {{onSkip: () => void, showSkipConfirm: boolean, handleSkipConfirm: () => void, handleSkipCancel: () => void}} props - Component props containing skip state and handlers
 * @param {() => void} props.onSkip - Function to call when the skip button is clicked
 * @param {boolean} props.showSkipConfirm - Whether the skip confirmation is visible
 * @param {() => void} props.handleSkipConfirm - Function to confirm skip
 * @param {() => void} props.handleSkipCancel - Function to cancel skip
 * @returns {React.ReactElement} Skip navigation wrapper JSX element
 */
function SkipNavWrapper(props: {
  onSkip: () => void;
  showSkipConfirm: boolean;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
}): React.ReactElement {
  return <NavigationSkipComponent {...props} />;
}

/**
 * Renders left navigation section
 * @param {{isSubmitting: boolean, handleSkipClick: () => void}} props - Component props containing left navigation state
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.handleSkipClick - Function to handle skip click
 * @returns {React.ReactElement} Left navigation section JSX element
 */
function renderLeftSection(props: {
  isSubmitting: boolean;
  handleSkipClick: () => void;
}): React.ReactElement {
  return (
    <LeftNavWrapper isSubmitting={props.isSubmitting} handleSkipClick={props.handleSkipClick} />
  );
}

/**
 * Renders right navigation section
 * @param {{isFirstStep: boolean, isLastStep: boolean, canProceed: boolean, isSubmitting: boolean, onBack: () => void, onNext: () => void, onComplete: () => void}} props - Component props containing right navigation state
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.onBack - Function to call when the back button is clicked
 * @param {() => void} props.onNext - Function to call when the next button is clicked
 * @param {() => void} props.onComplete - Function to call when the wizard is completed
 * @returns {React.ReactElement} Right navigation section JSX element
 */
function renderRightSection(props: {
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
}): React.ReactElement {
  return (
    <RightNavWrapper
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      canProceed={props.canProceed}
      isSubmitting={props.isSubmitting}
      onBack={props.onBack}
      onNext={props.onNext}
      onComplete={props.onComplete}
    />
  );
}

/**
 * Renders skip navigation section
 * @param {{onSkip: () => void, showSkipConfirm: boolean, handleSkipConfirm: () => void, handleSkipCancel: () => void}} props - Component props containing skip state and handlers
 * @param {() => void} props.onSkip - Function to call when the skip button is clicked
 * @param {boolean} props.showSkipConfirm - Whether the skip confirmation is visible
 * @param {() => void} props.handleSkipConfirm - Function to confirm skip
 * @param {() => void} props.handleSkipCancel - Function to cancel skip
 * @returns {React.ReactElement} Skip navigation section JSX element
 */
function renderSkipSection(props: {
  onSkip: () => void;
  showSkipConfirm: boolean;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
}): React.ReactElement {
  return (
    <SkipNavWrapper
      onSkip={props.onSkip}
      showSkipConfirm={props.showSkipConfirm}
      handleSkipConfirm={props.handleSkipConfirm}
      handleSkipCancel={props.handleSkipCancel}
    />
  );
}

/**
 * Props for NavigationContent component
 */
interface NavigationContentProps {
  isSubmitting: boolean;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  showSkipConfirm: boolean;
  handleSkipClick: () => void;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
}

/**
 * Renders navigation content inside the container
 * @param {NavigationContentProps} props - Component props containing all navigation state and handlers
 * @returns {React.ReactElement} Navigation content JSX element
 */
function NavigationContent(props: NavigationContentProps): React.ReactElement {
  return (
    <>
      {renderLeftSection({
        isSubmitting: props.isSubmitting,
        handleSkipClick: props.handleSkipClick
      })}
      {renderRightSection({
        isFirstStep: props.isFirstStep,
        isLastStep: props.isLastStep,
        canProceed: props.canProceed,
        isSubmitting: props.isSubmitting,
        onBack: props.onBack,
        onNext: props.onNext,
        onComplete: props.onComplete
      })}
      {renderSkipSection({
        onSkip: props.onSkip,
        showSkipConfirm: props.showSkipConfirm,
        handleSkipConfirm: props.handleSkipConfirm,
        handleSkipCancel: props.handleSkipCancel
      })}
    </>
  );
}

/**
 * Renders the main navigation container
 * @param {{isSubmitting: boolean, canProceed: boolean, onBack: () => void, onNext: () => void, onSkip: () => void, onComplete: () => void, isFirstStep: boolean, isLastStep: boolean, showSkipConfirm: boolean, handleSkipClick: () => void, handleSkipConfirm: () => void, handleSkipCancel: () => void}} props - Component props containing all navigation state and handlers
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {boolean} props.canProceed - Whether the user can proceed
 * @param {() => void} props.onBack - Function to call when the back button is clicked
 * @param {() => void} props.onNext - Function to call when the next button is clicked
 * @param {() => void} props.onSkip - Function to call when the skip button is clicked
 * @param {() => void} props.onComplete - Function to call when the wizard is completed
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.showSkipConfirm - Whether the skip confirmation is visible
 * @param {() => void} props.handleSkipClick - Function to handle skip click
 * @param {() => void} props.handleSkipConfirm - Function to confirm skip
 * @param {() => void} props.handleSkipCancel - Function to cancel skip
 * @returns {React.ReactElement} Main navigation container JSX element
 */
function NavigationContainer(props: {
  isSubmitting: boolean;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  showSkipConfirm: boolean;
  handleSkipClick: () => void;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
}): React.ReactElement {
  return (
    <div className="navigation-buttons">
      <NavigationContent {...props} />
    </div>
  );
}

/**
 * Navigation buttons component for the onboarding wizard
 * @param {NavigationButtonsProps} props - Component props
 * @param {number} props.currentStep - The current step number (0-indexed)
 * @param {number} props.totalSteps - The total number of steps in the wizard
 * @param {boolean} props.canProceed - Whether the user can proceed to the next step
 * @param {() => void} props.onBack - Function to call when the back button is clicked
 * @param {() => void} props.onNext - Function to call when the next button is clicked
 * @param {() => void} props.onSkip - Function to call when the skip button is clicked
 * @param {() => void} props.onComplete - Function to call when the wizard is completed
 * @param {boolean} props.isSubmitting - Whether the form is currently submitting
 * @returns {React.ReactElement} JSX element for navigation buttons
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
  const navigationState = useNavigationState(currentStep, totalSteps);

  return (
    <NavigationContainer
      isSubmitting={isSubmitting}
      canProceed={canProceed}
      onBack={onBack}
      onNext={onNext}
      onSkip={onSkip}
      onComplete={onComplete}
      {...navigationState}
    />
  );
}
