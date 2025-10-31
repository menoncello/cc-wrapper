import React, { useState } from 'react';

import type { TourStepConfig } from './tour-steps.config';

interface TourTooltipProps {
  step: TourStepConfig;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onEnd: () => void;
  position: { top: number; left: number };
}

interface SkipConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

interface TourNavigationProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onEnd: () => void;
}

interface TourContentProps {
  step: TourStepConfig;
  currentStepIndex: number;
  totalSteps: number;
  onSkip: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onEnd: () => void;
}

/**
 * Skip confirmation dialog component
 * @param {SkipConfirmDialogProps} props - Component props
 * @param {() => void} props.onConfirm - Function to confirm skipping
 * @param {() => void} props.onCancel - Function to cancel skipping
 * @returns {JSX.Element} Skip confirmation dialog JSX element
 */
const SkipConfirmDialog = ({ onConfirm, onCancel }: SkipConfirmDialogProps): React.ReactElement => (
  <div className="tour-skip-dialog">
    <div className="dialog-overlay" onClick={onCancel} />
    <div className="dialog-content">
      <h3>Skip the tour?</h3>
      <p>Are you sure? You can restart the tour later from settings.</p>
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm}>
          Skip
        </button>
      </div>
    </div>
  </div>
);

/**
 * Tour navigation buttons component
 * @param {TourNavigationProps} props - Component props
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {() => void} props.onNext - Function to proceed to next step
 * @param {() => void} props.onPrevious - Function to go to previous step
 * @param {() => void} props.onEnd - Function to end the tour
 * @returns {JSX.Element} Tour navigation buttons JSX element
 */
const TourNavigation = ({
  isFirstStep,
  isLastStep,
  onNext,
  onPrevious,
  onEnd
}: TourNavigationProps): React.ReactElement => (
  <div className="tour-nav-buttons">
    {!isFirstStep && (
      <button type="button" className="btn btn-secondary" onClick={onPrevious}>
        Previous
      </button>
    )}

    {isLastStep ? (
      <button type="button" className="btn btn-primary" onClick={onEnd}>
        End Tour
      </button>
    ) : (
      <button type="button" className="btn btn-primary" onClick={onNext}>
        Next
      </button>
    )}
  </div>
);

/**
 * Renders the tour tooltip header
 * @param {object} params - Component parameters
 * @param {TourStepConfig} params.step - Current tour step
 * @param {number} params.currentStepIndex - Current step index
 * @param {number} params.totalSteps - Total number of steps
 * @returns {JSX.Element} Tour header JSX element
 */
const RenderTourHeader = ({
  step,
  currentStepIndex,
  totalSteps
}: {
  step: TourStepConfig;
  currentStepIndex: number;
  totalSteps: number;
}): React.ReactElement => (
  <div className="tour-tooltip-header">
    <h3>{step.title}</h3>
    <span className="tour-step-count">
      {currentStepIndex + 1} / {totalSteps}
    </span>
  </div>
);

/**
 * Renders the tour tooltip body
 * @param {TourStepConfig} step - Current tour step
 * @returns {JSX.Element} Tour body JSX element
 */
const RenderTourBody = ({ step }: { step: TourStepConfig }): React.ReactElement => (
  <div className="tour-tooltip-body">
    <p>{step.description}</p>
  </div>
);

/**
 * Renders the tour tooltip footer
 * @param {object} params - Component parameters
 * @param {() => void} params.onSkip - Function to call when skip button is clicked
 * @param {boolean} params.isFirstStep - Whether this is the first step
 * @param {boolean} params.isLastStep - Whether this is the last step
 * @param {() => void} params.onNext - Function to call when next button is clicked
 * @param {() => void} params.onPrevious - Function to call when previous button is clicked
 * @param {() => void} params.onEnd - Function to call when end tour button is clicked
 * @returns {JSX.Element} Tour footer JSX element
 */
const RenderTourFooter = ({
  onSkip,
  isFirstStep,
  isLastStep,
  onNext,
  onPrevious,
  onEnd
}: {
  onSkip: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onEnd: () => void;
}): React.ReactElement => (
  <div className="tour-tooltip-footer">
    <button type="button" className="btn-skip" onClick={onSkip}>
      Skip Tour
    </button>
    <TourNavigation
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      onNext={onNext}
      onPrevious={onPrevious}
      onEnd={onEnd}
    />
  </div>
);

/**
 * Renders the tour tooltip content with header, body, and footer
 * @param {TourContentProps} props - Component props
 * @returns {JSX.Element} Tour content JSX element
 */
const RenderTourContent = ({
  step,
  currentStepIndex,
  totalSteps,
  onSkip,
  isFirstStep,
  isLastStep,
  onNext,
  onPrevious,
  onEnd
}: TourContentProps): React.ReactElement => (
  <div className="tour-tooltip">
    <RenderTourHeader step={step} currentStepIndex={currentStepIndex} totalSteps={totalSteps} />
    <RenderTourBody step={step} />
    <RenderTourFooter
      onSkip={onSkip}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      onNext={onNext}
      onPrevious={onPrevious}
      onEnd={onEnd}
    />
  </div>
);

/**
 * Tour content component
 * @param {TourContentProps} props - Component props
 * @returns {JSX.Element} Tour content JSX element
 */
const TourContent = (props: TourContentProps): React.ReactElement =>
  RenderTourContent({ ...props });

/**
 * Tour tooltip component for displaying guided tour steps
 * @param {TourTooltipProps} props - Component props
 * @returns {JSX.Element} Tour tooltip JSX element
 */
export const TourTooltip = (props: TourTooltipProps): React.ReactElement => {
  const { step, currentStepIndex, totalSteps, onNext, onPrevious, onSkip, onEnd } = props;
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleSkipClick = (): void => setShowSkipConfirm(true);
  const handleSkipConfirm = (): void => {
    setShowSkipConfirm(false);
    onSkip();
  };
  const handleSkipCancel = (): void => setShowSkipConfirm(false);

  return (
    <>
      <TourContent
        step={step}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        onSkip={handleSkipClick}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onNext={onNext}
        onPrevious={onPrevious}
        onEnd={onEnd}
      />

      {showSkipConfirm && (
        <SkipConfirmDialog onConfirm={handleSkipConfirm} onCancel={handleSkipCancel} />
      )}
    </>
  );
};
