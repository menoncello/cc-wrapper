import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Token Management', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('token clearing and re-authentication', () => {
    it('should handle token clearing and re-authentication', async () => {
      const { mockedFetch, localStorageMock, createMockSuccessResponse } = require('./test-utils');
      mockedFetch.mockImplementation(() => createMockSuccessResponse({ success: true }));

      // Set initial token
      apiClient.setToken('initial-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'initial-token');

      // Clear token
      apiClient.clearToken();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');

      // Make unauthenticated request
      await apiClient.getWorkspaces();

      // Verify no authorization header is sent
      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/api/workspaces',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      const lastCall = mockedFetch.mock.calls[mockedFetch.mock.calls.length - 1];
      if (lastCall && lastCall.length > 1 && lastCall[1]) {
        const headers = (lastCall[1] as any).headers;
        expect(headers['Authorization']).toBeUndefined();
      }
    });
  });
});
