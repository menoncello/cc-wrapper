import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Advanced Notification Preferences', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('updateProfile with all fields including notifications', () => {
    it('should update profile with all fields', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      const profileData = {
        preferredAITools: ['Claude'],
        notificationPreferences: {
          email: false,
          inApp: true,
          quietHours: {
            enabled: false,
            start: '23:00',
            end: '07:00'
          }
        },
        defaultWorkspaceId: 'workspace-123',
        tourCompleted: true,
        onboardingCompleted: true
      };

      await apiClient.updateProfile(profileData);

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/api/auth/profile',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(profileData),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });
});
