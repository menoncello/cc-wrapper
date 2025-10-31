import React from 'react';

export interface NavigationSkipDialogProps {
  showSkipConfirm: boolean;
  handleSkipConfirm: () => void;
  handleSkipCancel: () => void;
  onSkip: () => void;
}

/**
 * Dialog content component
 * @returns {React.ReactElement} Dialog content JSX element
 */
function DialogContent(): React.ReactElement {
  return (
    <>
      <h3>Skip Onboarding?</h3>
      <p>You can complete your profile setup later from settings.</p>
    </>
  );
}

/**
 * Dialog actions component
 * @param {{onCancel: () => void, onConfirm: () => void}} props - Component props
 * @param {() => void} props.onCancel - Function to call when cancel is clicked
 * @param {() => void} props.onConfirm - Function to call when confirm is clicked
 * @returns {React.ReactElement} Dialog actions JSX element
 */
function DialogActions({
  onCancel,
  onConfirm
}: {
  onCancel: () => void;
  onConfirm: () => void;
}): React.ReactElement {
  return (
    <div className="dialog-actions">
      <button type="button" className="btn btn-secondary" onClick={onCancel}>
        Cancel
      </button>
      <button type="button" className="btn btn-primary" onClick={onConfirm}>
        Skip
      </button>
    </div>
  );
}

/**
 * Skip confirmation dialog component
 * @param {NavigationSkipDialogProps} props - Component props
 * @param {boolean} props.showSkipConfirm - Whether the dialog is visible
 * @param {() => void} props.handleSkipConfirm - Function to call when confirm is clicked
 * @param {() => void} props.handleSkipCancel - Function to call when cancel is clicked
 * @param {() => void} props.onSkip - Function to call when skip is confirmed
 * @returns {React.ReactElement} Skip confirmation dialog JSX element
 */
export function NavigationSkipDialog({
  showSkipConfirm,
  handleSkipConfirm,
  handleSkipCancel,
  onSkip
}: NavigationSkipDialogProps): React.ReactElement {
  if (!showSkipConfirm) {
    return <></>;
  }

  const handleConfirm = (): void => {
    handleSkipConfirm();
    onSkip();
  };

  return (
    <div className="skip-confirm-dialog">
      <div className="dialog-overlay" onClick={handleSkipCancel} />
      <div className="dialog-content">
        <DialogContent />
        <DialogActions onCancel={handleSkipCancel} onConfirm={handleConfirm} />
      </div>
    </div>
  );
}
