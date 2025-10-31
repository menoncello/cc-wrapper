/**
 * HTTP Mocks for Testing
 * Provides mocks for fetch/HTTP calls to external services in CI environment
 */

import { mock } from 'bun:test';

// Mock fetch response structure
interface MockResponse {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

// Create mock response helper
const createMockResponse = (data: any, ok = true, status = 200): MockResponse => ({
  ok,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data))
});

// Mock external service responses
export const mockHttpResponses = {
  // Auth service responses
  auth: {
    tokenValidation: createMockResponse({
      id: 'test-user-id',
      email: 'test@example.com',
      permissions: ['read', 'write']
    }),
    userInfo: createMockResponse({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      permissions: ['read', 'write']
    })
  },

  // Terminal service responses
  terminal: {
    commandHistory: createMockResponse({
      history: [
        { command: 'ls -la', timestamp: '2024-01-01T00:00:00Z' },
        { command: 'npm test', timestamp: '2024-01-01T00:01:00Z' }
      ],
      workingDirectory: '/home/test',
      environment: { PATH: '/usr/bin:/bin' }
    }),
    workingDirectory: createMockResponse({
      workingDirectory: '/home/test'
    })
  },

  // Browser service responses
  browser: {
    tabs: createMockResponse({
      tabs: [
        { id: 1, title: 'Test Page', url: 'https://example.com', active: true },
        { id: 2, title: 'Another Page', url: 'https://test.com', active: false }
      ],
      activeTab: 1
    }),
    bookmarks: createMockResponse({
      bookmarks: [
        { id: 1, title: 'Test Bookmark', url: 'https://example.com' }
      ]
    }),
    history: createMockResponse({
      history: [
        { url: 'https://example.com', timestamp: '2024-01-01T00:00:00Z' }
      ]
    })
  },

  // AI service responses
  ai: {
    conversations: createMockResponse({
      conversations: [
        {
          id: 'conv-1',
          title: 'Test Conversation',
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
          ],
          timestamp: '2024-01-01T00:00:00Z'
        }
      ]
    }),
    context: createMockResponse({
      context: 'This is test context'
    }),
    models: createMockResponse({
      models: [
        { id: 'gpt-4', name: 'GPT-4', available: true },
        { id: 'gpt-3.5', name: 'GPT-3.5', available: true }
      ]
    })
  },

  // Notification service responses
  notifications: {
    send: createMockResponse({
      success: true,
      notificationId: 'notif-123'
    }),
    list: createMockResponse({
      notifications: [
        {
          id: 'notif-1',
          title: 'Test Notification',
          message: 'This is a test',
          read: false,
          timestamp: '2024-01-01T00:00:00Z'
        }
      ]
    })
  }
};

// Mock fetch function
export const mockFetch = mock((url: string, options?: RequestInit): Promise<MockResponse> => {
  // Route different URLs to appropriate mock responses
  if (url.includes('/auth/') || url.includes('/token/')) {
    if (url.includes('/token/validate')) {
      return Promise.resolve(mockHttpResponses.auth.tokenValidation);
    }
    return Promise.resolve(mockHttpResponses.auth.userInfo);
  }

  if (url.includes('/terminal/')) {
    if (url.includes('/history')) {
      return Promise.resolve(mockHttpResponses.terminal.commandHistory);
    }
    if (url.includes('/directory')) {
      return Promise.resolve(mockHttpResponses.terminal.workingDirectory);
    }
    return Promise.resolve(mockHttpResponses.terminal.commandHistory);
  }

  if (url.includes('/browser/')) {
    if (url.includes('/tabs')) {
      return Promise.resolve(mockHttpResponses.browser.tabs);
    }
    if (url.includes('/bookmarks')) {
      return Promise.resolve(mockHttpResponses.browser.bookmarks);
    }
    if (url.includes('/history')) {
      return Promise.resolve(mockHttpResponses.browser.history);
    }
    return Promise.resolve(mockHttpResponses.browser.tabs);
  }

  if (url.includes('/ai/')) {
    if (url.includes('/conversations')) {
      return Promise.resolve(mockHttpResponses.ai.conversations);
    }
    if (url.includes('/context')) {
      return Promise.resolve(mockHttpResponses.ai.context);
    }
    if (url.includes('/models')) {
      return Promise.resolve(mockHttpResponses.ai.models);
    }
    return Promise.resolve(mockHttpResponses.ai.conversations);
  }

  if (url.includes('/notifications/')) {
    if (options?.method === 'POST') {
      return Promise.resolve(mockHttpResponses.notifications.send);
    }
    return Promise.resolve(mockHttpResponses.notifications.list);
  }

  // Default mock response for unknown endpoints
  return Promise.resolve(createMockResponse({
    message: 'Mock response',
    url,
    method: options?.method || 'GET'
  }));
});

/**
 * Setup HTTP mocks for testing
 */
export const setupHttpMocks = () => {
  // Mock global fetch
  global.fetch = mockFetch;

  // Mock Response.json if needed
  if (!global.Response) {
    global.Response = {
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      ok: true,
      status: 200
    } as any;
  }
};

/**
 * Cleanup HTTP mocks after testing
 */
export const cleanupHttpMocks = () => {
  // Restore original fetch if it was saved
  if (global.fetch) {
    // @ts-ignore
    delete global.fetch;
  }
};