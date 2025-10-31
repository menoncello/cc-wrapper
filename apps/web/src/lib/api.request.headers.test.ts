import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Request Headers', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('Header management', () => {
    it('should merge custom headers with default headers', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      mockedFetch.mockImplementation(() =>
        require('./test-utils').createMockSuccessResponse({ success: true })
      );

      await apiClient['request']('/test', {
        headers: {
          'X-Custom-Header': 'custom-value',
          Accept: 'application/vnd.api+json'
        }
      });

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/test',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
            Accept: 'application/vnd.api+json'
          }
        })
      );
    });

    it('should override default header with custom header', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      mockedFetch.mockImplementation(() =>
        require('./test-utils').createMockSuccessResponse({ success: true })
      );

      await apiClient['request']('/test', {
        headers: {
          'Content-Type': 'text/plain'
        }
      });

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/test',
        expect.objectContaining({
          headers: {
            'Content-Type': 'text/plain'
          }
        })
      );
    });
  });
});
