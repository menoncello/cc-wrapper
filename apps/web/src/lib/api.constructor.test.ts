import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { localStorageMock, setupTestEnvironment } from './test-utils';

/**
 * Test suite for APIClient constructor functionality
 */
describe('APIClient - Constructor', () => {
  let apiClient: APIClient;

  /**
   * Set up test environment before each test
   */
  beforeEach(() => {
    setupTestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  /**
   * Test suite for constructor behavior
   */
  describe('constructor', () => {
    /**
     * Test that APIClient initializes correctly with base URL
     */
    it('should initialize with base URL', () => {
      expect(apiClient).toBeDefined();
      expect(apiClient).toBeInstanceOf(APIClient);
    });

    /**
     * Test that APIClient initializes without token when localStorage is empty
     */
    it('should initialize without token when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const client = new APIClient('http://localhost:20001');
      expect(client).toBeDefined();
    });

    /**
     * Test that APIClient loads token from localStorage on initialization
     */
    it('should load token from localStorage on initialization', () => {
      const testToken = 'stored-token-123';
      localStorageMock.getItem.mockReturnValue(testToken as string | null);

      const client = new APIClient('http://localhost:20001');
      expect(client).toBeDefined();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
    });

    /**
     * Test that APIClient handles server-side rendering gracefully
     */
    it('should handle server-side rendering gracefully', () => {
      // Simulate server-side environment (no window object)
      const originalWindow = global.window;
      (global as any).window = undefined;

      expect(() => {
        const client = new APIClient('http://localhost:20001');
        expect(client).toBeDefined();
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });
});
