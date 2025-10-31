import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Authenticated GET Requests', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('GET requests with authentication', () => {
    it('should make GET request with authentication token', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      apiClient.setToken('auth-token-123');
      mockedFetch.mockImplementation(() =>
        require('./test-utils').createMockSuccessResponse({ authenticated: true })
      );

      await apiClient['request']('/protected');

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/protected',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer auth-token-123'
          }
        })
      );
    });
  });
});
