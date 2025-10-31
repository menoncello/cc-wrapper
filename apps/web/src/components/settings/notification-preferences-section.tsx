import React from 'react';

import { DEFAULT_QUIET_HOURS, type ProfileData } from './profile-settings-utils';

/**
 * Props for NotificationPreferencesSection component
 */
interface NotificationPreferencesSectionProps {
  notificationPreferences: ProfileData['notificationPreferences'];
  onUpdateEmail: (checked: boolean) => void;
  onUpdateInApp: (checked: boolean) => void;
  onUpdateQuietHoursEnabled: (enabled: boolean) => void;
  onUpdateQuietHoursStart: (startTime: string) => void;
  onUpdateQuietHoursEnd: (endTime: string) => void;
}

/**
 * Props for CheckboxPreference component
 */
interface CheckboxPreferenceProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  testId?: string;
}

/**
 * Renders checkbox preference item
 * @param {CheckboxPreferenceProps} props - Checkbox preference props
 * @returns {JSX.Element} Checkbox preference JSX element
 */
const CheckboxPreference = ({
  checked,
  onChange,
  label,
  testId
}: CheckboxPreferenceProps): React.ReactElement => (
  <div className="preference-item">
    <label>
      <input type="checkbox" checked={checked} onChange={onChange} data-testid={testId} />
      <span>{label}</span>
    </label>
  </div>
);

/**
 * Props for QuietHoursConfig component
 */
interface QuietHoursConfigProps {
  enabled: boolean;
  startTime: string;
  endTime: string;
  onEnabledChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEndTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Renders time input fields
 * @param {object} props - Time input props
 * @param {string} props.startTime - Start time value
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onStartTimeChange - Start time change handler
 * @param {string} props.endTime - End time value
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onEndTimeChange - End time change handler
 * @returns {JSX.Element} Time input JSX element
 */
const TimeInputs = ({
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange
}: {
  startTime: string;
  onStartTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  endTime: string;
  onEndTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}): React.ReactElement => (
  <div className="quiet-hours-inputs">
    <label>
      Start:
      <input
        type="time"
        value={startTime}
        onChange={onStartTimeChange}
        data-testid="quiet-hours-start"
      />
    </label>

    <label>
      End:
      <input type="time" value={endTime} onChange={onEndTimeChange} data-testid="quiet-hours-end" />
    </label>
  </div>
);

/**
 * Renders quiet hours configuration
 * @param {QuietHoursConfigProps} props - Quiet hours props
 * @returns {JSX.Element} Quiet hours configuration JSX element
 */
const QuietHoursConfig = ({
  enabled,
  startTime,
  endTime,
  onEnabledChange,
  onStartTimeChange,
  onEndTimeChange
}: QuietHoursConfigProps): React.ReactElement => (
  <div className="quiet-hours">
    <CheckboxPreference
      checked={enabled}
      onChange={onEnabledChange}
      label="Enable quiet hours"
      testId="quiet-hours-toggle"
    />

    {enabled && (
      <TimeInputs
        startTime={startTime}
        onStartTimeChange={onStartTimeChange}
        endTime={endTime}
        onEndTimeChange={onEndTimeChange}
      />
    )}
  </div>
);

/**
 * Creates event handlers for notification preferences
 * @param {NotificationPreferencesSectionProps} props - Component props
 * @returns {{
 *   email: (e: React.ChangeEvent<HTMLInputElement>) => void;
 *   inApp: (e: React.ChangeEvent<HTMLInputElement>) => void;
 *   quietHoursEnabled: (e: React.ChangeEvent<HTMLInputElement>) => void;
 *   quietHoursStart: (e: React.ChangeEvent<HTMLInputElement>) => void;
 *   quietHoursEnd: (e: React.ChangeEvent<HTMLInputElement>) => void;
 * }} Event handlers
 */
const createNotificationHandlers = ({
  onUpdateEmail,
  onUpdateInApp,
  onUpdateQuietHoursEnabled,
  onUpdateQuietHoursStart,
  onUpdateQuietHoursEnd
}: Omit<NotificationPreferencesSectionProps, 'notificationPreferences'>): {
  email: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inApp: (e: React.ChangeEvent<HTMLInputElement>) => void;
  quietHoursEnabled: (e: React.ChangeEvent<HTMLInputElement>) => void;
  quietHoursStart: (e: React.ChangeEvent<HTMLInputElement>) => void;
  quietHoursEnd: (e: React.ChangeEvent<HTMLInputElement>) => void;
} => ({
  email: (e: React.ChangeEvent<HTMLInputElement>): void => onUpdateEmail(e.target.checked),
  inApp: (e: React.ChangeEvent<HTMLInputElement>): void => onUpdateInApp(e.target.checked),
  quietHoursEnabled: (e: React.ChangeEvent<HTMLInputElement>): void =>
    onUpdateQuietHoursEnabled(e.target.checked),
  quietHoursStart: (e: React.ChangeEvent<HTMLInputElement>): void =>
    onUpdateQuietHoursStart(e.target.value),
  quietHoursEnd: (e: React.ChangeEvent<HTMLInputElement>): void =>
    onUpdateQuietHoursEnd(e.target.value)
});

/**
 * Renders notification checkboxes
 * @param {object} props - Notification checkboxes props
 * @param {ProfileData['notificationPreferences']} props.notificationPreferences - Notification preferences object
 * @param {ReturnType<typeof createNotificationHandlers>} props.handlers - Event handlers object
 * @returns {JSX.Element} Notification checkboxes JSX element
 */
const NotificationCheckboxes = ({
  notificationPreferences,
  handlers
}: {
  notificationPreferences: ProfileData['notificationPreferences'];
  handlers: ReturnType<typeof createNotificationHandlers>;
}): React.ReactElement => (
  <>
    <CheckboxPreference
      checked={notificationPreferences.email}
      onChange={handlers.email}
      label="Email notifications"
      testId="email-notifications"
    />

    <CheckboxPreference
      checked={notificationPreferences.inApp}
      onChange={handlers.inApp}
      label="In-app notifications"
      testId="inapp-notifications"
    />
  </>
);

/**
 * Gets quiet hours configuration with defaults
 * @param {ProfileData['notificationPreferences']} notificationPreferences - Notification preferences
 * @returns {ProfileData['notificationPreferences']['quietHours']} Quiet hours configuration
 */
const getQuietHoursConfig = (
  notificationPreferences: ProfileData['notificationPreferences']
): NonNullable<ProfileData['notificationPreferences']['quietHours']> =>
  notificationPreferences.quietHours || {
    enabled: false,
    ...DEFAULT_QUIET_HOURS
  };

/**
 * Creates main content for notification preferences section
 * @param {object} props - Content props
 * @param {ProfileData['notificationPreferences']} props.notificationPreferences - Notification preferences
 * @param {ReturnType<typeof createNotificationHandlers>} props.handlers - Event handlers
 * @param {ProfileData['notificationPreferences']['quietHours']} props.quietHours - Quiet hours configuration
 * @returns {JSX.Element} Section content
 */
const NotificationPreferencesContent = ({
  notificationPreferences,
  handlers,
  quietHours
}: {
  notificationPreferences: ProfileData['notificationPreferences'];
  handlers: ReturnType<typeof createNotificationHandlers>;
  quietHours: NonNullable<ProfileData['notificationPreferences']['quietHours']>;
}): React.ReactElement => (
  <>
    <NotificationCheckboxes notificationPreferences={notificationPreferences} handlers={handlers} />

    <QuietHoursConfig
      enabled={quietHours.enabled}
      startTime={quietHours.start}
      endTime={quietHours.end}
      onEnabledChange={handlers.quietHoursEnabled}
      onStartTimeChange={handlers.quietHoursStart}
      onEndTimeChange={handlers.quietHoursEnd}
    />
  </>
);

/**
 * Notification preferences section component
 * @param {NotificationPreferencesSectionProps} props - Component props
 * @returns {JSX.Element} Notification preferences section JSX element
 */
export const NotificationPreferencesSection: React.FC<NotificationPreferencesSectionProps> = ({
  notificationPreferences,
  onUpdateEmail,
  onUpdateInApp,
  onUpdateQuietHoursEnabled,
  onUpdateQuietHoursStart,
  onUpdateQuietHoursEnd
}): React.ReactElement => {
  const quietHours = getQuietHoursConfig(notificationPreferences);
  const handlers = createNotificationHandlers({
    onUpdateEmail,
    onUpdateInApp,
    onUpdateQuietHoursEnabled,
    onUpdateQuietHoursStart,
    onUpdateQuietHoursEnd
  });

  return (
    <section className="settings-section">
      <h2>Notification Preferences</h2>
      <NotificationPreferencesContent
        notificationPreferences={notificationPreferences}
        handlers={handlers}
        quietHours={quietHours}
      />
    </section>
  );
};
