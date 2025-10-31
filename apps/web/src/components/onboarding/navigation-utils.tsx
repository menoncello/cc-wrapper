import { getStepState, useNavigationState } from './navigation-hooks';

/**
 * Navigation configuration interface
 */
interface NavigationConfig {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

/**
 * Creates skip handlers based on navigation state
 * @param {NavigationConfig} config - Navigation configuration
 * @returns {object} Skip handlers object
 * @type {{
 *   showSkipConfirm: boolean;
 *   handleSkipClick: () => void;
 *   handleSkipConfirm: () => void;
 *   handleSkipCancel: () => void;
 * }}
 */
function createSkipHandlers(config: NavigationConfig): {
  showSkipConfirm: boolean;
  handleSkipClick: () => void;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
} {
  const { showSkipConfirm, handleSkipClick, handleSkipConfirm, handleSkipCancel } =
    useNavigationState(config.currentStep, config.totalSteps, config.onSkip);

  return {
    showSkipConfirm,
    handleSkipClick,
    handleSkipConfirm,
    handleSkipCancel
  };
}

/**
 * Creates navigation props for the NavigationContent component
 * @param {NavigationConfig} config - Navigation configuration
 * @returns {object} Object containing all navigation props
 * @type {{
 *   isFirstStep: boolean;
 *   isLastStep: boolean;
 *   canProceed: boolean;
 *   isSubmitting: boolean;
 *   onBack: () => void;
 *   onNext: () => void;
 *   onComplete: () => void;
 *   onSkip: () => void;
 *   skipHandlers: {
 *     showSkipConfirm: boolean;
 *     handleSkipClick: () => void;
 *     handleSkipConfirm: () => void;
 *     handleSkipCancel: () => void;
 *   };
 * }}
 */
function createNavigationProps(config: NavigationConfig): {
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
} {
  const { isFirstStep, isLastStep } = getStepState(config.currentStep, config.totalSteps);
  const skipHandlers = createSkipHandlers(config);

  return {
    isFirstStep,
    isLastStep,
    canProceed: config.canProceed,
    isSubmitting: config.isSubmitting,
    onBack: config.onBack,
    onNext: config.onNext,
    onComplete: config.onComplete,
    onSkip: config.onSkip,
    skipHandlers
  };
}

/**
 * Navigation prop interface
 */
interface NavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export { createNavigationProps };
export type { NavigationProps };
