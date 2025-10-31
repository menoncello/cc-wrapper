import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Get Current User', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('getCurrentUser operations', () => {
    it('should fetch current user data', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      await apiClient.getCurrentUser();

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/api/auth/me',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should include authentication header when token is set', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      apiClient.setToken('auth-token');

      await apiClient.getCurrentUser();

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/api/auth/me',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer auth-token'
          }
        })
      );
    });
  });
});
