import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Authentication Flow', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('end-to-end authentication', () => {
    it('should handle authentication flow end-to-end', async () => {
      const { mockedFetch, localStorageMock } = require('./test-utils');

      // Mock successful authentication
      mockedFetch.mockImplementation(
        (_url: string | Request | undefined, _options?: RequestInit) => {
          if (_url === 'http://localhost:20001/api/auth/me') {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  id: 1,
                  email: 'user@example.com',
                  authenticated: true
                })
            } as globalThis.Response);
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true })
          } as globalThis.Response);
        }
      );

      // Set authentication token
      apiClient.setToken('user-jwt-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'user-jwt-token');

      // Make authenticated request
      const userData = await apiClient.getCurrentUser();

      expect(userData).toEqual({
        id: 1,
        email: 'user@example.com',
        authenticated: true
      });

      // Verify authentication header was sent
      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/api/auth/me',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer user-jwt-token'
          }
        })
      );
    });
  });
});
