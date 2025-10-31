import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { createMockFailedJsonResponse, mockedFetch, setupTestEnvironment } from './test-utils';

describe('APIClient - Integration Tests - Error Handling', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupTestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('Integration tests - Error Handling', () => {
    it('should handle API error responses gracefully', async () => {
      // Mock 401 Unauthorized response
      mockedFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () =>
            Promise.resolve({
              message: 'Authentication required'
            })
        } as globalThis.Response)
      );

      expect(apiClient.getCurrentUser()).rejects.toThrow('Authentication required');
    });

    it('should handle server errors gracefully', async () => {
      // Mock 500 Internal Server Error
      mockedFetch.mockImplementation(() =>
        createMockFailedJsonResponse(500, 'Internal Server Error')
      );

      expect(
        apiClient.createWorkspace({
          userType: 'solo',
          preferredAITools: ['Claude'],
          workspaceName: 'Test'
        })
      ).rejects.toThrow('Internal Server Error');
    });
  });
});
