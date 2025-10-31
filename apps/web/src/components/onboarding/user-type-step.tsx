import React from 'react';

import { useOnboardingStore, type UserType } from '../../stores/onboarding-store';

const userTypeOptions: Array<{
  value: UserType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'solo',
    label: 'Solo Developer',
    description: 'Working on personal projects or freelancing',
    icon: '👤'
  },
  {
    value: 'team',
    label: 'Team',
    description: 'Collaborating with a small to medium team',
    icon: '👥'
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: 'Large organization with multiple teams',
    icon: '🏢'
  }
];

/**
 * User type selection step component for onboarding
 * @returns {JSX.Element} JSX element for user type selection
 * @type {React.ReactElement}
 */
export function UserTypeStep(): React.ReactElement {
  const { userType, setUserType } = useOnboardingStore();

  return (
    <div className="user-type-step">
      <h2 data-testid="onboarding-step-title">Select Your User Type</h2>
      <p className="step-description">
        Help us tailor your experience by selecting how you plan to use CC Wrapper.
      </p>

      <div className="user-type-grid">
        {userTypeOptions.map(option => (
          <button
            key={option.value}
            type="button"
            className={`user-type-card ${userType === option.value ? 'selected' : ''}`}
            data-testid={`user-type-${option.value}`}
            aria-selected={userType === option.value}
            onClick={() => setUserType(option.value)}
          >
            <div className="card-icon">{option.icon}</div>
            <h3 className="card-title">{option.label}</h3>
            <p className="card-description">{option.description}</p>
            {userType === option.value && <div className="selected-indicator">✓</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
