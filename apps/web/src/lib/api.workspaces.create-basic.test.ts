import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Basic Workspace Creation', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('createWorkspace basic operations', () => {
    it('should create workspace with required data', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      const workspaceData = {
        userType: 'solo',
        preferredAITools: ['Claude', 'GPT-4'],
        workspaceName: 'My Workspace'
      };

      await apiClient.createWorkspace(workspaceData);

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/api/workspaces',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(workspaceData),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });
});
