import { handleRestartOnboarding } from './profile-settings-utils';

/**
 * Props for ActionsSection component
 */
interface ActionsSectionProps {
  onRestartTour: () => void;
}

/**
 * Props for ActionButton component
 */
interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}

/**
 * Renders action button
 * @param {ActionButtonProps} props - Button props
 * @returns {JSX.Element} Button JSX element
 */
const ActionButton = ({ onClick, children, testId }: ActionButtonProps): React.ReactElement => (
  <button type="button" className="btn btn-secondary" onClick={onClick} data-testid={testId}>
    {children}
  </button>
);

/**
 * Actions section component for user actions
 * @param {ActionsSectionProps} props - Component props
 * @returns {JSX.Element} Actions section JSX element
 */
export const ActionsSection: React.FC<ActionsSectionProps> = ({
  onRestartTour
}): React.ReactElement => (
  <section className="settings-section">
    <h2>Actions</h2>

    <div className="action-buttons">
      <ActionButton onClick={handleRestartOnboarding} testId="restart-onboarding-btn">
        Restart Onboarding
      </ActionButton>

      <ActionButton onClick={onRestartTour} testId="restart-tour-btn">
        Restart Tour
      </ActionButton>
    </div>
  </section>
);
