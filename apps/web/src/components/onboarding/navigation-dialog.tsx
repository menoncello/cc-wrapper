import React from 'react';

/**
 * Skip confirmation dialog component
 * @param {object} props - Component props
 * @param {boolean} props.isVisible - Whether the dialog is visible
 * @param {() => void} props.onConfirm - Function to call when confirm is clicked
 * @param {() => void} props.onCancel - Function to call when cancel is clicked
 * @returns {JSX.Element} Skip confirmation dialog JSX element
 * @type {React.ReactElement}
 */
function SkipConfirmDialog({
  isVisible,
  onConfirm,
  onCancel
}: {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}): React.ReactElement {
  if (!isVisible) {
    return <></>;
  }

  return (
    <div className="skip-confirm-dialog">
      <div className="dialog-overlay" onClick={onCancel} />
      <div className="dialog-content">
        <h3>Skip Onboarding?</h3>
        <p>You can complete your profile setup later from settings.</p>
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
}

/**
 * Renders skip confirmation dialog wrapper
 * @param {object} props - Component props
 * @param {boolean} props.showSkipConfirm - Whether the skip confirmation is visible
 * @param {() => void} props.handleSkipConfirm - Function to confirm skip
 * @param {() => void} props.handleSkipCancel - Function to cancel skip
 * @param {() => void} props.onSkip - Function to handle skip action
 * @returns {JSX.Element} Skip confirmation dialog wrapper JSX element
 * @type {React.ReactElement}
 */
function SkipDialogWrapper({
  showSkipConfirm,
  handleSkipConfirm,
  handleSkipCancel,
  onSkip
}: {
  showSkipConfirm: boolean;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
  onSkip: () => void;
}): React.ReactElement {
  return (
    <SkipConfirmDialog
      isVisible={showSkipConfirm}
      onConfirm={() => {
        handleSkipConfirm();
        onSkip();
      }}
      onCancel={handleSkipCancel}
    />
  );
}

export { SkipConfirmDialog, SkipDialogWrapper };
