import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Workspace Creation With Data', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('createWorkspace with all optional data', () => {
    it('should create workspace with all optional data', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      const workspaceData = {
        userType: 'team',
        preferredAITools: ['Claude', 'GPT-4', 'Gemini'],
        workspaceName: 'Team Workspace',
        workspaceDescription: 'A collaborative workspace',
        workspaceTemplate: 'React'
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
