import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Profile Update Operations', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('updateProfile with preferred AI tools', () => {
    it('should update profile with preferred AI tools', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      const profileData = {
        preferredAITools: ['Claude', 'GPT-4']
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

    it('should include authentication header when token is set', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      apiClient.setToken('auth-token');
      const profileData = {
        tourCompleted: false
      };

      await apiClient.updateProfile(profileData);

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/api/auth/profile',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(profileData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer auth-token'
          }
        })
      );
    });
  });
});
