import { createMockSuccessResponse, mockedFetch, setupTestEnvironment } from './test-utils';

/**
 * Sets up basic test environment for API tests
 *
 * @returns void
 */
export function setupBasicAPITestEnvironment(): void {
  setupTestEnvironment();
}

/**
 * Sets up API test environment with mocked fetch returning success
 *
 * @returns {import('bun:test').Mock<(url?: string | Request, options?: RequestInit) => Promise<Response>>} The mocked fetch function
 */
export function setupAPITestWithSuccessMock(): typeof mockedFetch {
  setupTestEnvironment();
  mockedFetch.mockImplementation(() => createMockSuccessResponse({ success: true }));
  return mockedFetch;
}
