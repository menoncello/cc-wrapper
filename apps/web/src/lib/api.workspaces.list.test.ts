import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Workspace Listing', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('getWorkspaces operations', () => {
    it('should fetch workspaces list', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      await apiClient.getWorkspaces();

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/api/workspaces',
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

      await apiClient.getWorkspaces();

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/api/workspaces',
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
