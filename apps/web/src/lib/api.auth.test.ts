import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupTestEnvironment } from './test-utils';

describe('APIClient - Authentication', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupTestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('setToken', () => {
    it('should set authentication token', () => {
      const token = 'test-token-123';
      apiClient.setToken(token);
      expect(apiClient).toBeDefined();
    });

    it('should store token in localStorage', () => {
      const token = 'test-token-456';
      apiClient.setToken(token);
      expect(global.localStorage.setItem).toHaveBeenCalledWith('auth_token', token);
    });

    it('should handle server-side rendering when setting token', () => {
      const originalWindow = global.window;
      (global as Record<string, unknown>).window = undefined;

      expect(() => {
        apiClient.setToken('server-token');
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('clearToken', () => {
    it('should clear authentication token', () => {
      apiClient.setToken('test-token');
      apiClient.clearToken();
      expect(apiClient).toBeDefined();
    });

    it('should remove token from localStorage', () => {
      apiClient.setToken('test-token');
      apiClient.clearToken();
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should handle server-side rendering when clearing token', () => {
      const originalWindow = global.window;
      (global as Record<string, unknown>).window = undefined;

      expect(() => {
        apiClient.clearToken();
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });
});
