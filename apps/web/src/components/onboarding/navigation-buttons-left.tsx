import React from 'react';

export interface NavigationLeftProps {
  isSubmitting: boolean;
  handleSkipClick: () => void;
}

/**
 * Left navigation component containing skip button
 * @param {object} props - Component props
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {() => void} props.handleSkipClick - Function to handle skip click
 * @returns {React.ReactElement} Left navigation component JSX element
 */
export function NavigationLeft({
  isSubmitting,
  handleSkipClick
}: NavigationLeftProps): React.ReactElement {
  return (
    <div className="navigation-buttons-left">
      <button
        type="button"
        className="btn btn-skip"
        onClick={handleSkipClick}
        disabled={isSubmitting}
      >
        Skip for now
      </button>
    </div>
  );
}
