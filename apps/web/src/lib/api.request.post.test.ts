import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';
import { setupAPITestWithSuccessMock, setupBasicAPITestEnvironment } from './test-setup-helper';

describe('APIClient - POST Requests', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    setupBasicAPITestEnvironment();
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('POST requests with body', () => {
    it('should make POST request with body', async () => {
      const mockedFetch = setupAPITestWithSuccessMock();
      mockedFetch.mockImplementation(() =>
        require('./test-utils').createMockSuccessResponse({ id: 1, created: true }, 201)
      );

      const postData = { name: 'Test', type: 'example' };
      const result = await apiClient['request']('/create', {
        method: 'POST',
        body: JSON.stringify(postData)
      });

      expect(mockedFetch).toHaveBeenCalledWith(
        'http://localhost:20001/create',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
      expect(result).toEqual({ id: 1, created: true });
    });
  });
});
