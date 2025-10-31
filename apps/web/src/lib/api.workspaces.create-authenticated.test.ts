import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Workspace Creation With Auth', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('createWorkspace with authentication', () => {
    it('should include authentication header when token is set', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      apiClient.setToken('auth-token');
      const workspaceData = {
        userType: 'enterprise',
        preferredAITools: ['Claude'],
        workspaceName: 'Enterprise Workspace'
      };

      await apiClient.createWorkspace(workspaceData);

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/api/workspaces',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(workspaceData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer auth-token'
          }
        })
      );
    });
  });
});
