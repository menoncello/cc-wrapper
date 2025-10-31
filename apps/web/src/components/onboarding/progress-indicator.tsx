import React from 'react';

// Constants
const PERCENTAGE_MULTIPLIER = 100;

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * Progress indicator component for the onboarding wizard
 * @param {object} props - Component props
 * @param {number} props.currentStep - The current step number (0-indexed)
 * @param {number} props.totalSteps - The total number of steps in the wizard
 * @returns {JSX.Element} JSX element for progress indicator
 * @type {React.ReactElement}
 */
export function ProgressIndicator({
  currentStep,
  totalSteps
}: ProgressIndicatorProps): React.ReactElement {
  const percentage = Math.round((currentStep / totalSteps) * PERCENTAGE_MULTIPLIER);

  return (
    <div className="progress-indicator" data-testid="onboarding-progress">
      <div className="progress-text">
        Step {currentStep} of {totalSteps}
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className="progress-percentage" data-testid="progress-percentage">
        {percentage}%
      </div>
    </div>
  );
}
