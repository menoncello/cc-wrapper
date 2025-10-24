import { useState } from 'react';

import type { TourStepConfig } from './tourSteps.config';

interface TourTooltipProps {
  step: TourStepConfig;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onEnd: () => void;
}

export default function TourTooltip({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onEnd
}: TourTooltipProps) {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

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

  return (
    <>
      <div className="tour-tooltip">
        <div className="tour-tooltip-header">
          <h3>{step.title}</h3>
          <span className="tour-step-count">
            {currentStepIndex + 1} / {totalSteps}
          </span>
        </div>

        <div className="tour-tooltip-body">
          <p>{step.description}</p>
        </div>

        <div className="tour-tooltip-footer">
          <button type="button" className="btn-skip" onClick={handleSkipClick}>
            Skip Tour
          </button>

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
        </div>
      </div>

      {showSkipConfirm && (
        <div className="tour-skip-dialog">
          <div className="dialog-overlay" onClick={handleSkipCancel} />
          <div className="dialog-content">
            <h3>Skip the tour?</h3>
            <p>Are you sure? You can restart the tour later from settings.</p>
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
    </>
  );
}
