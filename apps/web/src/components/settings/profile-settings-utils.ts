import { apiClient } from '@lib/api';

/**
 * Interface for user profile data structure
 */
export interface ProfileData {
  preferredAITools: string[];
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  defaultWorkspaceId?: string;
}

/**
 * Interface for message display state
 */
export interface MessageState {
  type: 'success' | 'error';
  text: string;
}

/**
 * Interface for raw user data from API
 */
interface RawUserData {
  profile?: {
    preferredAITools?: string[];
    notificationPreferences?: ProfileData['notificationPreferences'];
    defaultWorkspaceId?: string;
  };
}

/**
 * Interface for raw workspaces data from API
 */
interface RawWorkspacesData {
  workspaces?: Array<{ id: string; name: string }>;
}

/**
 * Available AI tools configuration
 */
export const AI_TOOLS = [
  { id: 'claude', label: 'Claude' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'windsurf', label: 'Windsurf' },
  { id: 'github-copilot', label: 'GitHub Copilot' },
  { id: 'custom', label: 'Custom' }
] as const;

/**
 * Default quiet hours configuration
 */
export const DEFAULT_QUIET_HOURS = {
  start: '22:00',
  end: '08:00'
} as const;

/**
 * Default profile data structure
 */
const DEFAULT_PROFILE_DATA: ProfileData = {
  preferredAITools: [],
  notificationPreferences: {
    email: true,
    inApp: true,
    quietHours: {
      enabled: false,
      ...DEFAULT_QUIET_HOURS
    }
  }
};

/**
 * Creates initial profile state
 * @returns {ProfileData} Default profile data
 */
export const createInitialProfile = (): ProfileData => ({
  ...DEFAULT_PROFILE_DATA
});

/**
 * Creates initial workspaces state
 * @returns {Array<{ id: string; name: string }>} Empty workspaces array
 */
export const createInitialWorkspaces = (): Array<{ id: string; name: string }> => [];

/**
 * Transforms raw user profile data to ProfileData format
 * @param {object} profile - Raw profile data from API
 * @param {string[]} profile.preferredAITools - Array of preferred AI tool IDs
 * @param {ProfileData['notificationPreferences']} profile.notificationPreferences - User notification preferences
 * @param {string} profile.defaultWorkspaceId - Default workspace ID
 * @returns {ProfileData} Formatted profile data
 */
const transformProfileData = (profile: {
  preferredAITools?: string[];
  notificationPreferences?: ProfileData['notificationPreferences'];
  defaultWorkspaceId?: string;
}): ProfileData => ({
  preferredAITools: profile.preferredAITools || [],
  notificationPreferences: profile.notificationPreferences || {
    email: true,
    inApp: true
  },
  defaultWorkspaceId: profile.defaultWorkspaceId
});

/**
 * Fetches user and workspace data from API
 * @returns {Promise<{userData: RawUserData, workspacesData: RawWorkspacesData}>} Raw API data
 */
const fetchApiData = async (): Promise<{
  userData: RawUserData;
  workspacesData: RawWorkspacesData;
}> => {
  const [userData, workspacesData] = (await Promise.all([
    apiClient.getCurrentUser(),
    apiClient.getWorkspaces()
  ])) as [
    {
      profile?: {
        preferredAITools?: string[];
        notificationPreferences?: ProfileData['notificationPreferences'];
        defaultWorkspaceId?: string;
      };
    },
    { workspaces?: Array<{ id: string; name: string }> }
  ];

  return { userData, workspacesData };
};

/**
 * Loads user data from API
 * @returns {Promise<{profile?: ProfileData, workspaces?: Array<{ id: string; name: string }>}>} User profile and workspaces data
 */
const loadUserData = async (): Promise<{
  profile?: ProfileData;
  workspaces?: Array<{ id: string; name: string }>;
}> => {
  try {
    const { userData, workspacesData } = await fetchApiData();

    return {
      profile: userData.profile ? transformProfileData(userData.profile) : undefined,
      workspaces: workspacesData.workspaces || []
    };
  } catch {
    return { profile: undefined, workspaces: [] };
  }
};

/**
 * Sets profile data from loaded user data
 * @param {Function} setProfile - Profile state setter
 * @param {Function} setWorkspaces - Workspaces state setter
 * @returns {Promise<void>}
 */
const setProfileFromData = async (
  setProfile: (profile: ProfileData) => void,
  setWorkspaces: (workspaces: Array<{ id: string; name: string }>) => void
): Promise<void> => {
  const { profile, workspaces } = await loadUserData();

  if (profile) {
    setProfile(profile);
  }

  setWorkspaces(workspaces || []);
};

/**
 * Loads profile data from API and updates state
 * @param {Function} setProfile - Profile state setter
 * @param {Function} setWorkspaces - Workspaces state setter
 * @param {Function} setIsLoading - Loading state setter
 * @returns {Promise<void>}
 */
export const loadProfileData = async (
  setProfile: (profile: ProfileData) => void,
  setWorkspaces: (workspaces: Array<{ id: string; name: string }>) => void,
  setIsLoading: (loading: boolean) => void
): Promise<void> => {
  try {
    await setProfileFromData(setProfile, setWorkspaces);
  } finally {
    setIsLoading(false);
  }
};

/**
 * Saves profile data to API
 * @param {ProfileData} profile - Profile data to save
 * @param {Function} setIsSaving - Saving state setter
 * @param {Function} setMessage - Message state setter
 * @returns {Promise<void>}
 */
export const saveProfileData = async (
  profile: ProfileData,
  setIsSaving: (saving: boolean) => void,
  setMessage: (message: MessageState | null) => void
): Promise<void> => {
  setIsSaving(true);
  setMessage(null);

  try {
    await apiClient.updateProfile(profile);
    setMessage({ type: 'success', text: 'Profile settings updated successfully' });
  } catch (error) {
    setMessage({
      type: 'error',
      text: error instanceof Error ? error.message : 'Failed to update profile'
    });
  } finally {
    setIsSaving(false);
  }
};

/**
 * Updates profile state using an updater function
 * @param {ProfileData} currentProfile - Current profile state
 * @param {Function} updater - Function to update profile state
 * @param {Function} setProfile - Profile state setter
 * @returns {void}
 */
const updateProfile = (
  currentProfile: ProfileData,
  updater: (prev: ProfileData) => ProfileData,
  setProfile: (profile: ProfileData) => void
): void => {
  setProfile(updater(currentProfile));
};

/**
 * Toggles AI tool selection
 * @param {string} toolId - Tool ID to toggle
 * @param {ProfileData} currentProfile - Current profile state
 * @param {Function} setProfile - Profile state setter
 * @returns {void}
 */
export const toggleAITool = (
  toolId: string,
  currentProfile: ProfileData,
  setProfile: (profile: ProfileData) => void
): void => {
  updateProfile(
    currentProfile,
    prev => ({
      ...prev,
      preferredAITools: prev.preferredAITools.includes(toolId)
        ? prev.preferredAITools.filter(t => t !== toolId)
        : [...prev.preferredAITools, toolId]
    }),
    setProfile
  );
};

/**
 * Updates notification preferences using updater function
 * @param {ProfileData} currentProfile - Current profile state
 * @param {Function} preferencesUpdater - Function to update notification preferences
 * @param {Function} setProfile - Profile state setter
 * @returns {void}
 */
const updateNotificationPreferences = (
  currentProfile: ProfileData,
  preferencesUpdater: (
    prev: ProfileData['notificationPreferences']
  ) => ProfileData['notificationPreferences'],
  setProfile: (profile: ProfileData) => void
): void => {
  updateProfile(
    currentProfile,
    prev => ({
      ...prev,
      notificationPreferences: preferencesUpdater(prev.notificationPreferences)
    }),
    setProfile
  );
};

/**
 * Updates email notification preference
 * @param {boolean} checked - Checkbox state
 * @param {ProfileData} currentProfile - Current profile state
 * @param {Function} setProfile - Profile state setter
 * @returns {void}
 */
export const updateEmailNotification = (
  checked: boolean,
  currentProfile: ProfileData,
  setProfile: (profile: ProfileData) => void
): void => {
  updateNotificationPreferences(
    currentProfile,
    prev => ({
      ...prev,
      email: checked
    }),
    setProfile
  );
};

/**
 * Updates in-app notification preference
 * @param {boolean} checked - Checkbox state
 * @param {ProfileData} currentProfile - Current profile state
 * @param {Function} setProfile - Profile state setter
 * @returns {void}
 */
export const updateInAppNotification = (
  checked: boolean,
  currentProfile: ProfileData,
  setProfile: (profile: ProfileData) => void
): void => {
  updateNotificationPreferences(
    currentProfile,
    prev => ({
      ...prev,
      inApp: checked
    }),
    setProfile
  );
};

/**
 * Updates quiet hours enabled state
 * @param {boolean} enabled - Quiet hours enabled state
 * @param {ProfileData} currentProfile - Current profile state
 * @param {Function} setProfile - Profile state setter
 * @returns {void}
 */
export const updateQuietHoursEnabled = (
  enabled: boolean,
  currentProfile: ProfileData,
  setProfile: (profile: ProfileData) => void
): void => {
  updateNotificationPreferences(
    currentProfile,
    prev => ({
      ...prev,
      quietHours: {
        ...(prev.quietHours || DEFAULT_QUIET_HOURS),
        enabled
      }
    }),
    setProfile
  );
};

/**
 * Updates quiet hours start time
 * @param {string} startTime - Start time value
 * @param {ProfileData} currentProfile - Current profile state
 * @param {Function} setProfile - Profile state setter
 * @returns {void}
 */
export const updateQuietHoursStart = (
  startTime: string,
  currentProfile: ProfileData,
  setProfile: (profile: ProfileData) => void
): void => {
  updateNotificationPreferences(
    currentProfile,
    prev => ({
      ...prev,
      quietHours: {
        ...(prev.quietHours || { ...DEFAULT_QUIET_HOURS, enabled: false }),
        start: startTime
      }
    }),
    setProfile
  );
};

/**
 * Updates quiet hours end time
 * @param {string} endTime - End time value
 * @param {ProfileData} currentProfile - Current profile state
 * @param {Function} setProfile - Profile state setter
 * @returns {void}
 */
export const updateQuietHoursEnd = (
  endTime: string,
  currentProfile: ProfileData,
  setProfile: (profile: ProfileData) => void
): void => {
  updateNotificationPreferences(
    currentProfile,
    prev => ({
      ...prev,
      quietHours: {
        ...(prev.quietHours || { ...DEFAULT_QUIET_HOURS, enabled: false }),
        end: endTime
      }
    }),
    setProfile
  );
};

/**
 * Updates default workspace
 * @param {string} workspaceId - Workspace ID
 * @param {ProfileData} currentProfile - Current profile state
 * @param {Function} setProfile - Profile state setter
 * @returns {void}
 */
export const updateDefaultWorkspace = (
  workspaceId: string,
  currentProfile: ProfileData,
  setProfile: (profile: ProfileData) => void
): void => {
  updateProfile(currentProfile, prev => ({ ...prev, defaultWorkspaceId: workspaceId }), setProfile);
};

/**
 * Handles restart onboarding action
 * @returns {void}
 */
export const handleRestartOnboarding = (): void => {
  window.location.href = '/onboarding';
};

/**
 * Handles restart tour action
 * @param {Function} resetTour - Tour reset function
 * @param {Function} setMessage - Message state setter
 * @returns {void}
 */
export const handleRestartTour = (
  resetTour: () => void,
  setMessage: (message: MessageState | null) => void
): void => {
  resetTour();
  setMessage({ type: 'success', text: 'Tour reset. Navigate to dashboard to start the tour.' });
};
