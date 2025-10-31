import { useState } from 'react';

/**
 * Hook to manage skip confirmation state
 * @returns {[boolean, () => void, () => void, () => void]} Skip confirmation state and handlers - [showSkipConfirm, handleSkipClick, handleSkipConfirm, handleSkipCancel]
 * @type {[boolean, () => void, () => void, () => void]}
 */
function useSkipConfirmation(): [boolean, () => void, () => void, () => void] {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleSkipClick = (): void => setShowSkipConfirm(true);
  const handleSkipConfirm = (): void => setShowSkipConfirm(false);
  const handleSkipCancel = (): void => setShowSkipConfirm(false);

  return [showSkipConfirm, handleSkipClick, handleSkipConfirm, handleSkipCancel] as const;
}

/**
 * Get step state
 * @param {number} currentStep - The current step number
 * @param {number} totalSteps - The total number of steps
 * @returns {{isFirstStep: boolean, isLastStep: boolean}} Step state object
 * @type {{isFirstStep: boolean, isLastStep: boolean}}
 */
function getStepState(
  currentStep: number,
  totalSteps: number
): { isFirstStep: boolean; isLastStep: boolean } {
  return {
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps
  };
}

/**
 * Hook to manage navigation buttons state and handlers
 * @param {number} currentStep - The current step number
 * @param {number} totalSteps - The total number of steps
 * @param {() => void} _onSkip - Skip callback function (unused)
 * @returns {{isFirstStep: boolean, isLastStep: boolean, skipHandlers: {showSkipConfirm: boolean, handleSkipClick: () => void, handleSkipConfirm: () => void, handleSkipCancel: () => void}}} Navigation state and handlers
 * @type {{isFirstStep: boolean, isLastStep: boolean, showSkipConfirm: boolean, handleSkipClick: () => void, handleSkipConfirm: () => void, handleSkipCancel: () => void}}
 */
function useNavigationState(
  currentStep: number,
  totalSteps: number,
  _onSkip: () => void
): {
  isFirstStep: boolean;
  isLastStep: boolean;
  showSkipConfirm: boolean;
  handleSkipClick: () => void;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
} {
  const [showSkipConfirm, handleSkipClick, handleSkipConfirm, handleSkipCancel] =
    useSkipConfirmation();
  const { isFirstStep, isLastStep } = getStepState(currentStep, totalSteps);

  return {
    isFirstStep,
    isLastStep,
    showSkipConfirm,
    handleSkipClick,
    handleSkipConfirm,
    handleSkipCancel
  };
}

export { getStepState, useNavigationState, useSkipConfirmation };
