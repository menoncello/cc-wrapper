import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - Basic GET Requests', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('GET requests without authentication', () => {
    it('should make GET request without authentication', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      mockedFetch.mockImplementation(() =>
        require('./test-utils').createMockSuccessResponse({ data: 'test' })
      );

      const result = await apiClient['request']('/test');

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/test',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle successful response with JSON data', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      const responseData = { id: 1, name: 'Test Item', status: 'active' };
      mockedFetch.mockImplementation(() =>
        require('./test-utils').createMockSuccessResponse(responseData)
      );

      const result = await apiClient['request']('/items/1');
      expect(result).toEqual(responseData);
    });
  });
});
