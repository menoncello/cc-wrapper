import { apiClient } from '@lib/api';
import { useTourStore } from '@stores/tourStore';
import { useEffect, useState } from 'react';

interface ProfileData {
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

const AI_TOOLS = [
  { id: 'claude', label: 'Claude' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'windsurf', label: 'Windsurf' },
  { id: 'github-copilot', label: 'GitHub Copilot' },
  { id: 'custom', label: 'Custom' }
];

export default function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileData>({
    preferredAITools: [],
    notificationPreferences: {
      email: true,
      inApp: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    }
  });

  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { resetTour } = useTourStore();

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
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

      if (userData.profile) {
        setProfile({
          preferredAITools: userData.profile.preferredAITools || [],
          notificationPreferences: userData.profile.notificationPreferences || {
            email: true,
            inApp: true
          },
          defaultWorkspaceId: userData.profile.defaultWorkspaceId
        });
      }

      setWorkspaces(workspacesData.workspaces || []);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
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

  const toggleAITool = (toolId: string) => {
    setProfile(prev => ({
      ...prev,
      preferredAITools: prev.preferredAITools.includes(toolId)
        ? prev.preferredAITools.filter(t => t !== toolId)
        : [...prev.preferredAITools, toolId]
    }));
  };

  const handleRestartOnboarding = () => {
    window.location.href = '/onboarding';
  };

  const handleRestartTour = () => {
    resetTour();
    setMessage({ type: 'success', text: 'Tour reset. Navigate to dashboard to start the tour.' });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-settings">
      <h1>Profile Settings</h1>

      {message && (
        <div className={`message ${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      {/* AI Tools Section */}
      <section className="settings-section">
        <h2>Preferred AI Tools</h2>
        <p>Select the AI tools you primarily work with.</p>

        <div className="ai-tools-grid">
          {AI_TOOLS.map(tool => {
            const isSelected = profile.preferredAITools.includes(tool.id);

            return (
              <label key={tool.id} className="ai-tool-checkbox-label">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleAITool(tool.id)}
                />
                <span>{tool.label}</span>
                {isSelected && <span className="check-icon">✓</span>}
              </label>
            );
          })}
        </div>

        <div className="selected-tools-display">
          {profile.preferredAITools.length > 0 ? (
            <div className="tools-chips">
              {profile.preferredAITools.map(toolId => {
                const tool = AI_TOOLS.find(t => t.id === toolId);
                return (
                  <span key={toolId} className="tool-chip">
                    {tool?.label}
                    <button
                      type="button"
                      onClick={() => toggleAITool(toolId)}
                      className="remove-chip"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="no-tools-message">No tools selected</p>
          )}
        </div>
      </section>

      {/* Notification Preferences Section */}
      <section className="settings-section">
        <h2>Notification Preferences</h2>

        <div className="preference-item">
          <label>
            <input
              type="checkbox"
              checked={profile.notificationPreferences.email}
              onChange={e =>
                setProfile(prev => ({
                  ...prev,
                  notificationPreferences: {
                    ...prev.notificationPreferences,
                    email: e.target.checked
                  }
                }))
              }
            />
            <span>Email notifications</span>
          </label>
        </div>

        <div className="preference-item">
          <label>
            <input
              type="checkbox"
              checked={profile.notificationPreferences.inApp}
              onChange={e =>
                setProfile(prev => ({
                  ...prev,
                  notificationPreferences: {
                    ...prev.notificationPreferences,
                    inApp: e.target.checked
                  }
                }))
              }
            />
            <span>In-app notifications</span>
          </label>
        </div>

        <div className="quiet-hours">
          <label>
            <input
              type="checkbox"
              checked={profile.notificationPreferences.quietHours?.enabled || false}
              onChange={e =>
                setProfile(prev => ({
                  ...prev,
                  notificationPreferences: {
                    ...prev.notificationPreferences,
                    quietHours: {
                      ...(prev.notificationPreferences.quietHours || {
                        start: '22:00',
                        end: '08:00'
                      }),
                      enabled: e.target.checked
                    }
                  }
                }))
              }
            />
            <span>Enable quiet hours</span>
          </label>

          {profile.notificationPreferences.quietHours?.enabled && (
            <div className="quiet-hours-inputs">
              <label>
                Start:
                <input
                  type="time"
                  value={profile.notificationPreferences.quietHours.start}
                  onChange={e =>
                    setProfile(prev => ({
                      ...prev,
                      notificationPreferences: {
                        ...prev.notificationPreferences,
                        quietHours: {
                          ...(prev.notificationPreferences.quietHours || {
                            enabled: false,
                            start: '22:00',
                            end: '08:00'
                          }),
                          start: e.target.value
                        }
                      }
                    }))
                  }
                />
              </label>

              <label>
                End:
                <input
                  type="time"
                  value={profile.notificationPreferences.quietHours.end}
                  onChange={e =>
                    setProfile(prev => ({
                      ...prev,
                      notificationPreferences: {
                        ...prev.notificationPreferences,
                        quietHours: {
                          ...(prev.notificationPreferences.quietHours || {
                            enabled: false,
                            start: '22:00',
                            end: '08:00'
                          }),
                          end: e.target.value
                        }
                      }
                    }))
                  }
                />
              </label>
            </div>
          )}
        </div>
      </section>

      {/* Default Workspace Section */}
      <section className="settings-section">
        <h2>Default Workspace</h2>
        <p>Select your default workspace that loads on startup.</p>

        {workspaces.length > 0 ? (
          <select
            value={profile.defaultWorkspaceId || ''}
            onChange={e => setProfile(prev => ({ ...prev, defaultWorkspaceId: e.target.value }))}
            className="workspace-select"
          >
            <option value="">No default</option>
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
                {ws.id === profile.defaultWorkspaceId && ' (Default)'}
              </option>
            ))}
          </select>
        ) : (
          <p>No workspaces available</p>
        )}
      </section>

      {/* Actions Section */}
      <section className="settings-section">
        <h2>Actions</h2>

        <div className="action-buttons">
          <button type="button" className="btn btn-secondary" onClick={handleRestartOnboarding}>
            Restart Onboarding
          </button>

          <button type="button" className="btn btn-secondary" onClick={handleRestartTour}>
            Restart Tour
          </button>
        </div>
      </section>

      {/* Save Button */}
      <div className="save-section">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
