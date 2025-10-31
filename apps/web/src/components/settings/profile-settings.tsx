import { useTourStore } from '@stores/tour-store';
import React, { useEffect, useState } from 'react';

import { ActionsSection } from './actions-section';
import { AIToolsSection } from './ai-tools-section';
import { NotificationPreferencesSection } from './notification-preferences-section';
import {
  createInitialProfile,
  createInitialWorkspaces,
  handleRestartTour,
  loadProfileData,
  type MessageState,
  type ProfileData,
  saveProfileData,
  toggleAITool,
  updateDefaultWorkspace,
  updateEmailNotification,
  updateInAppNotification,
  updateQuietHoursEnabled,
  updateQuietHoursEnd,
  updateQuietHoursStart
} from './profile-settings-utils';
import { WorkspaceSection } from './workspace-section';

/**
 * Renders loading state
 * @returns {JSX.Element} Loading JSX element
 */
const LoadingState = (): React.ReactElement => <div>Loading...</div>;

/**
 * Renders message display
 * @param {MessageState} message - Message to display
 * @returns {JSX.Element} Message JSX element
 */
const MessageDisplay = ({ message }: { message: MessageState }): React.ReactElement => (
  <div className={`message ${message.type}`} role="alert">
    {message.text}
  </div>
);

/**
 * Props for SaveButton component
 */
interface SaveButtonProps {
  isSaving: boolean;
  onSave: () => void;
}

/**
 * Renders save button
 * @param {SaveButtonProps} props - Save button props
 * @returns {JSX.Element} Save button JSX element
 */
const SaveButton = ({ isSaving, onSave }: SaveButtonProps): React.ReactElement => (
  <div className="save-section">
    <button
      type="button"
      className="btn btn-primary"
      onClick={onSave}
      disabled={isSaving}
      data-testid="save-button"
    >
      {isSaving ? 'Saving...' : 'Save Changes'}
    </button>
  </div>
);

/**
 * Interface for notification handlers
 */
interface NotificationHandlers {
  email: (checked: boolean) => void;
  inApp: (checked: boolean) => void;
  quietHoursEnabled: (enabled: boolean) => void;
  quietHoursStart: (startTime: string) => void;
  quietHoursEnd: (endTime: string) => void;
}

/**
 * Creates notification handlers for profile updates
 * @param {ProfileData} profile - Current profile data
 * @param {Function} setProfile - Profile state setter
 * @returns {NotificationHandlers} Notification handlers
 */
const createNotificationHandlers = (
  profile: ProfileData,
  setProfile: (profile: ProfileData) => void
): NotificationHandlers => ({
  email: (checked: boolean): void => updateEmailNotification(checked, profile, setProfile),
  inApp: (checked: boolean): void => updateInAppNotification(checked, profile, setProfile),
  quietHoursEnabled: (enabled: boolean): void =>
    updateQuietHoursEnabled(enabled, profile, setProfile),
  quietHoursStart: (startTime: string): void =>
    updateQuietHoursStart(startTime, profile, setProfile),
  quietHoursEnd: (endTime: string): void => updateQuietHoursEnd(endTime, profile, setProfile)
});

/**
 * Interface for event handlers
 */
interface EventHandlers {
  save: () => Promise<void>;
  toggleAITool: (toolId: string) => void;
  restartTour: () => void;
  updateDefaultWorkspace: (workspaceId: string) => void;
}

/**
 * Interface for state management object
 */
interface StateManagement {
  profile: ProfileData;
  setProfile: (profile: ProfileData) => void;
  setIsSaving: (saving: boolean) => void;
  setMessage: (message: MessageState | null) => void;
}

/**
 * Creates state management object
 * @param {ProfileData} profile - Current profile state
 * @param {Function} setProfile - Profile state setter
 * @param {Function} setIsSaving - Saving state setter
 * @param {Function} setMessage - Message state setter
 * @returns {StateManagement} State management object
 */
const createStateManagement = (
  profile: ProfileData,
  setProfile: (profile: ProfileData) => void,
  setIsSaving: (saving: boolean) => void,
  setMessage: (message: MessageState | null) => void
): StateManagement => ({
  profile,
  setProfile,
  setIsSaving,
  setMessage
});

/**
 * Creates event handlers for profile settings interactions
 * @param {object} stateManagement - State management object
 * @param {Function} resetTour - Tour reset function
 * @returns {EventHandlers} Event handlers
 */
const createEventHandlers = (
  stateManagement: ReturnType<typeof createStateManagement>,
  resetTour: () => void
): EventHandlers => ({
  save: (): Promise<void> =>
    saveProfileData(
      stateManagement.profile,
      stateManagement.setIsSaving,
      stateManagement.setMessage
    ),
  toggleAITool: (toolId: string): void =>
    toggleAITool(toolId, stateManagement.profile, stateManagement.setProfile),
  restartTour: (): void => handleRestartTour(resetTour, stateManagement.setMessage),
  updateDefaultWorkspace: (workspaceId: string): void =>
    updateDefaultWorkspace(workspaceId, stateManagement.profile, stateManagement.setProfile)
});

/**
 * Props for ProfileSettingsContent component
 */
interface ProfileSettingsContentProps {
  profile: ProfileData;
  workspaces: Array<{ id: string; name: string }>;
  message: MessageState | null;
  isSaving: boolean;
  handlers: EventHandlers;
  notificationHandlers: NotificationHandlers;
}

/**
 * Renders the settings header
 * @returns {JSX.Element} Header JSX element
 */
const SettingsHeader = (): React.ReactElement => <h1>Profile Settings</h1>;

/**
 * Renders all settings sections
 * @param {ProfileSettingsContentProps} props - Content props
 * @returns {JSX.Element} Settings sections JSX element
 */
const SettingsSections = ({
  profile,
  workspaces,
  handlers,
  notificationHandlers
}: Pick<
  ProfileSettingsContentProps,
  'profile' | 'workspaces' | 'handlers' | 'notificationHandlers'
>): React.ReactElement => (
  <>
    <AIToolsSection
      preferredAITools={profile.preferredAITools}
      onToggleTool={handlers.toggleAITool}
    />

    <NotificationPreferencesSection
      notificationPreferences={profile.notificationPreferences}
      onUpdateEmail={notificationHandlers.email}
      onUpdateInApp={notificationHandlers.inApp}
      onUpdateQuietHoursEnabled={notificationHandlers.quietHoursEnabled}
      onUpdateQuietHoursStart={notificationHandlers.quietHoursStart}
      onUpdateQuietHoursEnd={notificationHandlers.quietHoursEnd}
    />

    <WorkspaceSection
      workspaces={workspaces}
      defaultWorkspaceId={profile.defaultWorkspaceId}
      onUpdateDefaultWorkspace={handlers.updateDefaultWorkspace}
    />

    <ActionsSection onRestartTour={handlers.restartTour} />
  </>
);

/**
 * Renders the main profile settings content
 * @param {ProfileSettingsContentProps} props - Content props
 * @returns {JSX.Element} Main content JSX element
 */
const ProfileSettingsContent = ({
  profile,
  workspaces,
  message,
  isSaving,
  handlers,
  notificationHandlers
}: ProfileSettingsContentProps): React.ReactElement => (
  <div className="profile-settings">
    <SettingsHeader />

    {message && <MessageDisplay message={message} />}

    <SettingsSections
      profile={profile}
      workspaces={workspaces}
      handlers={handlers}
      notificationHandlers={notificationHandlers}
    />

    <SaveButton isSaving={isSaving} onSave={handlers.save} />
  </div>
);

/**
 * Interface for profile settings state
 */
interface ProfileSettingsState {
  profile: ProfileData;
  workspaces: Array<{ id: string; name: string }>;
  isLoading: boolean;
  isSaving: boolean;
  message: MessageState | null;
  handlers: EventHandlers;
  notificationHandlers: NotificationHandlers;
}

/**
 * Creates state and handlers for profile settings
 * @returns {ProfileSettingsState} State and handlers object
 */
const useProfileSettingsState = (): ProfileSettingsState => {
  const [profile, setProfile] = useState<ProfileData>(createInitialProfile());
  const [workspaces, setWorkspaces] =
    useState<Array<{ id: string; name: string }>>(createInitialWorkspaces());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState | null>(null);

  const { resetTour } = useTourStore();

  useEffect(() => {
    loadProfileData(setProfile, setWorkspaces, setIsLoading);
  }, []);

  const stateManagement = createStateManagement(profile, setProfile, setIsSaving, setMessage);
  const handlers = createEventHandlers(stateManagement, resetTour);
  const notificationHandlers = createNotificationHandlers(profile, setProfile);

  return {
    profile,
    workspaces,
    isLoading,
    isSaving,
    message,
    handlers,
    notificationHandlers
  };
};

/**
 * Profile settings component for managing user preferences
 * @returns {JSX.Element} Profile settings JSX element
 */
export const ProfileSettings: React.FC = (): React.ReactElement => {
  const { profile, workspaces, isLoading, isSaving, message, handlers, notificationHandlers } =
    useProfileSettingsState();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <ProfileSettingsContent
      profile={profile}
      workspaces={workspaces}
      message={message}
      isSaving={isSaving}
      handlers={handlers}
      notificationHandlers={notificationHandlers}
    />
  );
};
