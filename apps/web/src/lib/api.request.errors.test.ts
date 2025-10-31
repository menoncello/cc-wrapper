import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Request Error Handling', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('HTTP error responses', () => {
    it('should handle HTTP error response with JSON error message', async () => {
      const { mockedFetch } = require('./test-utils');
      const errorResponse = { message: 'Resource not found', code: 'NOT_FOUND' };
      mockedFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve(errorResponse)
        } as globalThis.Response)
      );

      expect(apiClient['request']('/items/999')).rejects.toThrow('Resource not found');
    });

    it('should handle HTTP error response without JSON message', async () => {
      const { mockedFetch } = require('./test-utils');
      mockedFetch.mockImplementation(() =>
        require('./test-utils').createMockFailedJsonResponse(500, 'Internal Server Error')
      );

      expect(apiClient['request']('/error')).rejects.toThrow('Internal Server Error');
    });

    it('should handle HTTP error response with failed JSON parsing', async () => {
      const { mockedFetch } = require('./test-utils');
      mockedFetch.mockImplementation(() =>
        require('./test-utils').createMockFailedJsonResponse(400, 'Bad Request')
      );

      expect(apiClient['request']('/bad-request')).rejects.toThrow('Bad Request');
    });
  });

  describe('Network errors', () => {
    it('should handle network error', async () => {
      const { mockedFetch } = require('./test-utils');
      mockedFetch.mockImplementation(() =>
        require('./test-utils').createMockNetworkError('Network error')
      );

      expect(apiClient['request']('/network-error')).rejects.toThrow('Network error');
    });
  });
});
