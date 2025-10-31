import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Basic Notification Preferences', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('updateProfile with basic notification preferences', () => {
    it('should update profile with notification preferences', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      const profileData = {
        notificationPreferences: {
          email: true,
          inApp: false,
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          }
        }
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
