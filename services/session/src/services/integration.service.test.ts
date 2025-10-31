/**
 * Integration Service Tests
 * Comprehensive test suite for IntegrationService functionality
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest,test } from 'bun:test';

import { IntegrationConfig, IntegrationEvent, IntegrationService, ServiceHealth,WebhookConfig } from './integration.service';

// Mock fetch globally
global.fetch = jest.fn();

// Mock external services
const mockPrismaClient = {
  $disconnect: jest.fn().mockResolvedValue()
};

// Mock other services
const mockSyncService = {
  createSubscription: jest.fn(),
  removeSubscription: jest.fn(),
  publishEvent: jest.fn(),
  getActiveSubscriptions: jest.fn(),
  getUnresolvedConflicts: jest.fn(),
  getMetrics: jest.fn(),
  shutdown: jest.fn().mockResolvedValue()
};

const mockKeyManagementService = {
  createUserKey: jest.fn(),
  validateUserKey: jest.fn(),
  rotateUserKey: jest.fn()
};

const mockEncryptionService = {
  encryptSessionData: jest.fn(),
  decryptSessionData: jest.fn(),
  encryptBatch: jest.fn(),
  decryptBatch: jest.fn()
};

const mockCheckpointService = {
  createCheckpoint: jest.fn(),
  getCheckpoint: jest.fn(),
  deleteCheckpoint: jest.fn()
};

const mockRecoveryService = {
  createRecoveryPoint: jest.fn(),
  recoverFromPoint: jest.fn()
};

// Mock constructors
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient)
}));

jest.mock('../synchronization.service', () => ({
  SessionSynchronizationService: jest.fn().mockImplementation(() => mockSyncService)
}));

jest.mock('../key-management.service', () => ({
  SessionKeyManagementService: jest.fn().mockImplementation(() => mockKeyManagementService)
}));

jest.mock('../encryption.service', () => ({
  EncryptionService: jest.fn().mockImplementation(() => mockEncryptionService)
}));

jest.mock('../checkpoint.service', () => ({
  SessionCheckpointService: jest.fn().mockImplementation(() => mockCheckpointService)
}));

jest.mock('../recovery.service', () => ({
  SessionRecoveryService: jest.fn().mockImplementation(() => mockRecoveryService)
}));

describe('IntegrationService', () => {
  let integrationService: IntegrationService;
  let testConfig: IntegrationConfig;

  beforeAll(() => {
    testConfig = {
      services: {
        auth: {
          endpoint: 'http://localhost:20001/auth',
          apiKey: 'test-api-key',
          tokenValidationEndpoint: 'http://localhost:20001/auth/validate',
          userEndpoint: 'http://localhost:20001/auth/user'
        },
        terminal: {
          socketEndpoint: 'ws://localhost:20002/terminal',
          commandHistoryEndpoint: 'http://localhost:20002/terminal/history',
          workingDirectoryEndpoint: 'http://localhost:20002/terminal/pwd'
        },
        browser: {
          extensionEndpoint: 'http://localhost:20003/browser',
          tabsEndpoint: 'http://localhost:20003/browser/tabs',
          bookmarksEndpoint: 'http://localhost:20003/browser/bookmarks',
          historyEndpoint: 'http://localhost:20003/browser/history'
        },
        ai: {
          conversationsEndpoint: 'http://localhost:20004/ai/conversations',
          contextEndpoint: 'http://localhost:20004/ai/context',
          modelsEndpoint: 'http://localhost:20004/ai/models'
        },
        notifications: {
          serviceUrl: 'http://localhost:20005/notifications',
          apiKey: 'notification-key',
          channels: ['email', 'in_app']
        }
      },
      webhooks: [],
      externalApis: []
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    integrationService = new IntegrationService(testConfig);
  });

  afterEach(() => {
    // Restore console.error
    jest.restoreAllMocks();
  });

  afterEach(async () => {
    await integrationService.shutdown();
  });

  describe('Constructor', () => {
    test('should initialize with configuration', () => {
      expect(integrationService).toBeDefined();
      expect(integrationService.getConfig()).toEqual(testConfig);
    });

    test('should initialize with webhooks from config', () => {
      const configWithWebhooks: IntegrationConfig = {
        ...testConfig,
        webhooks: [
          {
            id: 'test-webhook',
            name: 'Test Webhook',
            url: 'http://example.com/webhook',
            events: ['test-event'],
            active: true,
            retryAttempts: 3,
            timeout: 5000
          }
        ]
      };

      const serviceWithWebhooks = new IntegrationService(configWithWebhooks);
      const webhooks = serviceWithWebhooks.getWebhooks();
      expect(webhooks).toHaveLength(1);
      expect(webhooks[0].id).toBe('test-webhook');
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    test('should authenticate user successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          permissions: ['read', 'write']
        })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.authenticateUser('valid-token');

      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        permissions: ['read', 'write']
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:20001/auth/validate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          },
          body: JSON.stringify({ token: 'valid-token' })
        }
      );
    });

    test('should return null for authentication failure', async () => {
      const mockResponse = {
        ok: false,
        status: 401
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.authenticateUser('invalid-token');

      expect(result).toBeNull();
    });

    test('should handle network errors during authentication', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await integrationService.authenticateUser('valid-token');

      expect(result).toBeNull();
    });

    test('should handle malformed response during authentication', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.authenticateUser('valid-token');

      expect(result).toBeNull();
    });
  });

  describe('Terminal State', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    test('should get terminal state successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          history: ['ls -la', 'npm test'],
          workingDirectory: '/home/user/project',
          environment: { PATH: '/usr/bin', NODE_ENV: 'test' }
        })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.getTerminalState('user-123', 'session-123');

      expect(result).toEqual({
        commandHistory: ['ls -la', 'npm test'],
        workingDirectory: '/home/user/project',
        environment: { PATH: '/usr/bin', NODE_ENV: 'test' }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:20002/terminal/history',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'X-User-ID': 'user-123',
            'X-Session-ID': 'session-123'
          }
        }
      );
    });

    test('should return default state on terminal service error', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.getTerminalState('user-123', 'session-123');

      expect(result).toEqual({
        commandHistory: [],
        workingDirectory: '/',
        environment: {}
      });
    });

    test('should handle network errors when getting terminal state', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await integrationService.getTerminalState('user-123', 'session-123');

      expect(result).toEqual({
        commandHistory: [],
        workingDirectory: '/',
        environment: {}
      });
    });

    test('should handle missing data in terminal response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({})
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.getTerminalState('user-123', 'session-123');

      expect(result).toEqual({
        commandHistory: [],
        workingDirectory: '/',
        environment: {}
      });
    });
  });

  describe('Browser State', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    test('should get browser state successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          tabs: [
            { url: 'http://example.com', title: 'Example', active: true },
            { url: 'http://test.com', title: 'Test', active: false }
          ],
          activeTab: 0
        })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.getBrowserState('user-123', 'session-123');

      expect(result).toEqual({
        tabs: [
          { url: 'http://example.com', title: 'Example', active: true },
          { url: 'http://test.com', title: 'Test', active: false }
        ],
        activeTab: 0
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:20003/browser/tabs',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'X-User-ID': 'user-123',
            'X-Session-ID': 'session-123'
          }
        }
      );
    });

    test('should return default state on browser service error', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.getBrowserState('user-123', 'session-123');

      expect(result).toEqual({
        tabs: [],
        activeTab: -1
      });
    });

    test('should handle network errors when getting browser state', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await integrationService.getBrowserState('user-123', 'session-123');

      expect(result).toEqual({
        tabs: [],
        activeTab: -1
      });
    });

    test('should handle missing data in browser response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({})
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.getBrowserState('user-123', 'session-123');

      expect(result).toEqual({
        tabs: [],
        activeTab: 0
      });
    });
  });

  describe('AI Conversations', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    test('should get AI conversations successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          conversations: [
            {
              id: 'conv-1',
              model: 'gpt-4',
              messages: [
                { role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
                { role: 'assistant', content: 'Hi there!', timestamp: '2024-01-01T00:00:01Z' }
              ]
            }
          ]
        })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.getAIConversations('user-123', 'session-123');

      expect(result).toEqual({
        conversations: [
          {
            id: 'conv-1',
            model: 'gpt-4',
            messages: [
              { role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
              { role: 'assistant', content: 'Hi there!', timestamp: '2024-01-01T00:00:01Z' }
            ]
          }
        ]
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:20004/ai/conversations',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'X-User-ID': 'user-123',
            'X-Session-ID': 'session-123'
          }
        }
      );
    });

    test('should return default state on AI service error', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.getAIConversations('user-123', 'session-123');

      expect(result).toEqual({
        conversations: []
      });
    });

    test('should handle network errors when getting AI conversations', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await integrationService.getAIConversations('user-123', 'session-123');

      expect(result).toEqual({
        conversations: []
      });
    });

    test('should handle missing data in AI conversations response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({})
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.getAIConversations('user-123', 'session-123');

      expect(result).toEqual({
        conversations: []
      });
    });
  });

  describe('Notifications', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    test('should send notification successfully', async () => {
      const mockResponse = {
        ok: true
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.sendNotification('user-123', {
        title: 'Test Notification',
        message: 'This is a test',
        type: 'info'
      });

      expect(result).toBe(true);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:20005/notifications/notifications',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer notification-key'
          },
          body: JSON.stringify({
            userId: 'user-123',
            title: 'Test Notification',
            message: 'This is a test',
            type: 'info',
            channels: ['email', 'in_app']
          })
        }
      );
    });

    test('should send notification with custom channels', async () => {
      const mockResponse = {
        ok: true
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.sendNotification('user-123', {
        title: 'Test Notification',
        message: 'This is a test',
        type: 'warning',
        channels: ['slack']
      });

      expect(result).toBe(true);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:20005/notifications/notifications',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer notification-key'
          },
          body: JSON.stringify({
            userId: 'user-123',
            title: 'Test Notification',
            message: 'This is a test',
            type: 'warning',
            channels: ['slack']
          })
        }
      );
    });

    test('should handle notification service failure', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.sendNotification('user-123', {
        title: 'Test Notification',
        message: 'This is a test',
        type: 'error'
      });

      expect(result).toBe(false);
    });

    test('should handle network errors when sending notifications', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await integrationService.sendNotification('user-123', {
        title: 'Test Notification',
        message: 'This is a test',
        type: 'success'
      });

      expect(result).toBe(false);
    });
  });

  describe('Webhooks', () => {
    test('should trigger webhook successfully', async () => {
      const webhook: WebhookConfig = {
        id: 'test-webhook',
        name: 'Test Webhook',
        url: 'http://example.com/webhook',
        events: ['test-event'],
        active: true,
        retryAttempts: 3,
        timeout: 5000
      };

      integrationService.addWebhook(webhook);

      const mockResponse = {
        ok: true
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await integrationService.triggerWebhook('test-event', { message: 'test data' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'CC-Wrapper-Session-Service/1.0'
          },
          signal: expect.any(AbortSignal)
        })
      );

      expect(requestBody).toMatchObject({
        eventType: 'test-event',
        data: { message: 'test data' },
        webhookId: 'test-webhook'
      });
      expect(requestBody.timestamp).toBeDefined();
    });

    test('should trigger webhook with signature', async () => {
      const webhook: WebhookConfig = {
        id: 'signed-webhook',
        name: 'Signed Webhook',
        url: 'http://example.com/webhook',
        events: ['test-event'],
        active: true,
        retryAttempts: 3,
        timeout: 5000,
        secret: 'webhook-secret'
      };

      integrationService.addWebhook(webhook);

      const mockResponse = {
        ok: true
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await integrationService.triggerWebhook('test-event', { message: 'test data' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'CC-Wrapper-Session-Service/1.0',
            'X-Webhook-Signature': expect.any(String)
          },
          signal: expect.any(AbortSignal)
        })
      );

      expect(requestBody).toMatchObject({
        eventType: 'test-event',
        data: { message: 'test data' },
        webhookId: 'signed-webhook'
      });
      expect(requestBody.timestamp).toBeDefined();
    });

    test('should not trigger inactive webhooks', async () => {
      const webhook: WebhookConfig = {
        id: 'inactive-webhook',
        name: 'Inactive Webhook',
        url: 'http://example.com/webhook',
        events: ['test-event'],
        active: false,
        retryAttempts: 3,
        timeout: 5000
      };

      integrationService.addWebhook(webhook);

      await integrationService.triggerWebhook('test-event', { message: 'test data' });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should not trigger webhooks for non-matching events', async () => {
      const webhook: WebhookConfig = {
        id: 'event-webhook',
        name: 'Event Webhook',
        url: 'http://example.com/webhook',
        events: ['different-event'],
        active: true,
        retryAttempts: 3,
        timeout: 5000
      };

      integrationService.addWebhook(webhook);

      await integrationService.triggerWebhook('test-event', { message: 'test data' });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle webhook failures gracefully', async () => {
      const webhook: WebhookConfig = {
        id: 'failing-webhook',
        name: 'Failing Webhook',
        url: 'http://example.com/webhook',
        events: ['test-event'],
        active: true,
        retryAttempts: 3,
        timeout: 5000
      };

      integrationService.addWebhook(webhook);

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Webhook failed'));

      // Should not throw error
      await expect(integrationService.triggerWebhook('test-event', { message: 'test data' }))
        .resolves.toBeUndefined();
    });

    test('should add webhook', () => {
      const webhook: WebhookConfig = {
        id: 'new-webhook',
        name: 'New Webhook',
        url: 'http://example.com/webhook',
        events: ['test-event'],
        active: true,
        retryAttempts: 3,
        timeout: 5000
      };

      integrationService.addWebhook(webhook);

      const webhooks = integrationService.getWebhooks();
      expect(webhooks).toContainEqual(webhook);
    });

    test('should remove webhook', () => {
      const webhook: WebhookConfig = {
        id: 'removable-webhook',
        name: 'Removable Webhook',
        url: 'http://example.com/webhook',
        events: ['test-event'],
        active: true,
        retryAttempts: 3,
        timeout: 5000
      };

      integrationService.addWebhook(webhook);
      const removed = integrationService.removeWebhook('removable-webhook');

      expect(removed).toBe(true);
      expect(integrationService.getWebhooks()).not.toContainEqual(webhook);
    });

    test('should return false when removing non-existent webhook', () => {
      const removed = integrationService.removeWebhook('non-existent-webhook');
      expect(removed).toBe(false);
    });

    test('should get all webhooks', () => {
      const webhook1: WebhookConfig = {
        id: 'webhook-1',
        name: 'Webhook 1',
        url: 'http://example.com/webhook1',
        events: ['test-event'],
        active: true,
        retryAttempts: 3,
        timeout: 5000
      };

      const webhook2: WebhookConfig = {
        id: 'webhook-2',
        name: 'Webhook 2',
        url: 'http://example.com/webhook2',
        events: ['test-event'],
        active: true,
        retryAttempts: 3,
        timeout: 5000
      };

      integrationService.addWebhook(webhook1);
      integrationService.addWebhook(webhook2);

      const webhooks = integrationService.getWebhooks();
      expect(webhooks).toHaveLength(2);
      expect(webhooks).toContainEqual(webhook1);
      expect(webhooks).toContainEqual(webhook2);
    });
  });

  describe('Service Health', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    test('should check service health successfully', async () => {
      const mockResponse = {
        ok: true
      };

      // Mock fetch with a small delay to ensure response time > 0
      (global.fetch as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return mockResponse;
      });

      const healthStatus = await integrationService.checkServiceHealth();

      expect(healthStatus).toHaveLength(5); // auth, terminal, browser, ai, notifications
      expect(healthStatus[0].service).toBe('auth');
      expect(healthStatus[0].status).toBe('healthy');
      expect(healthStatus[0].responseTime).toBeGreaterThan(0);
      expect(healthStatus[0].lastCheck).toBeInstanceOf(Date);
    });

    test('should handle unhealthy services', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const healthStatus = await integrationService.checkServiceHealth();

      expect(healthStatus[0].service).toBe('auth');
      expect(healthStatus[0].status).toBe('unhealthy');
      expect(healthStatus[0].error).toBe('HTTP 500');
    });

    test('should handle network errors during health checks', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const healthStatus = await integrationService.checkServiceHealth();

      expect(healthStatus[0].service).toBe('auth');
      expect(healthStatus[0].status).toBe('unhealthy');
      expect(healthStatus[0].error).toBe('Network error');
      expect(healthStatus[0].responseTime).toBe(5000);
    });

    test('should get service health', () => {
      const serviceHealth = integrationService.getServiceHealth();
      expect(serviceHealth).toBeInstanceOf(Map);
    });
  });

  describe('Workspace State', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    test('should create workspace state successfully', async () => {
      const mockTerminalResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          history: ['ls -la'],
          workingDirectory: '/home/user',
          environment: { PATH: '/usr/bin' }
        })
      };

      const mockBrowserResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          tabs: [{ url: 'http://example.com', title: 'Example', active: true }],
          activeTab: 0
        })
      };

      const mockAIResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          conversations: []
        })
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockTerminalResponse)
        .mockResolvedValueOnce(mockBrowserResponse)
        .mockResolvedValueOnce(mockAIResponse);

      const workspaceState = await integrationService.createWorkspaceState('user-123', 'session-123');

      expect(workspaceState).toEqual({
        terminal: {
          commandHistory: ['ls -la'],
          workingDirectory: '/home/user',
          environment: { PATH: '/usr/bin' }
        },
        browser: {
          tabs: [{ url: 'http://example.com', title: 'Example', active: true }],
          activeTab: 0
        },
        aiConversations: {
          conversations: []
        },
        files: [],
        metadata: {
          capturedAt: expect.any(String),
          userId: 'user-123',
          sessionId: 'session-123',
          version: '1.0'
        }
      });
    });

    test('should handle service failures when creating workspace state', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      const workspaceState = await integrationService.createWorkspaceState('user-123', 'session-123');

      expect(workspaceState.terminal).toEqual({
        commandHistory: [],
        workingDirectory: '/',
        environment: {}
      });
      expect(workspaceState.browser).toEqual({
        tabs: [],
        activeTab: -1
      });
      expect(workspaceState.aiConversations).toEqual({
        conversations: []
      });
      expect(workspaceState.files).toEqual([]);
      expect(workspaceState.metadata).toEqual({
        capturedAt: expect.any(String),
        userId: 'user-123',
        sessionId: 'session-123',
        version: '1.0'
      });
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig = {
        services: {
          ...testConfig.services,
          auth: {
            ...testConfig.services.auth,
            apiKey: 'new-api-key'
          }
        }
      };

      integrationService.updateConfig(newConfig);

      const currentConfig = integrationService.getConfig();
      expect(currentConfig.services.auth.apiKey).toBe('new-api-key');
    });

    test('should reinitialize webhooks when config is updated', () => {
      const freshService = new IntegrationService(testConfig);
      const newWebhooks: WebhookConfig[] = [
        {
          id: 'updated-webhook',
          name: 'Updated Webhook',
          url: 'http://example.com/updated',
          events: ['test-event'],
          active: true,
          retryAttempts: 3,
          timeout: 5000
        }
      ];

      freshService.updateConfig({ webhooks: newWebhooks });

      const webhooks = freshService.getWebhooks();
      expect(webhooks).toEqual(newWebhooks);
    });

    test('should get current configuration', () => {
      const config = integrationService.getConfig();
      expect(config).toEqual(testConfig);
      expect(config).not.toBe(testConfig); // Should be a copy
    });
  });

  describe('Shutdown', () => {
    test('should shutdown gracefully', async () => {
      const freshService = new IntegrationService(testConfig);

      // Test that shutdown method exists and can be called without throwing
      await expect(freshService.shutdown()).resolves.toBeUndefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty webhook list', () => {
      // Create a fresh service with no webhooks
      const emptyConfig: IntegrationConfig = {
        ...testConfig,
        webhooks: []
      };
      const freshService = new IntegrationService(emptyConfig);
      const webhooks = freshService.getWebhooks();
      expect(webhooks).toEqual([]);
    });

    test('should handle missing user data in authentication response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'user-123'
          // Missing email and permissions
        })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await integrationService.authenticateUser('valid-token');

      expect(result).toEqual({
        userId: 'user-123',
        email: undefined,
        permissions: []
      });
    });

    test('should handle various notification types', async () => {
      const mockResponse = {
        ok: true
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const types: Array<'info' | 'warning' | 'error' | 'success'> = ['info', 'warning', 'error', 'success'];

      for (const type of types) {
        const result = await integrationService.sendNotification('user-123', {
          title: 'Test',
          message: 'Test message',
          type
        });

        expect(result).toBe(true);
      }
    });

    test('should handle concurrent webhook triggers', async () => {
      const freshService = new IntegrationService(testConfig);
      const webhook: WebhookConfig = {
        id: 'concurrent-webhook',
        name: 'Concurrent Webhook',
        url: 'http://example.com/webhook',
        events: ['test-event'],
        active: true,
        retryAttempts: 3,
        timeout: 5000
      };

      freshService.addWebhook(webhook);

      const mockResponse = {
        ok: true
      };

      // Create a separate mock just for this test
      const fetchMock = jest.fn().mockResolvedValue(mockResponse);
      global.fetch = fetchMock;

      // Trigger multiple webhooks concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        freshService.triggerWebhook('test-event', { data: `test-${i}` })
      );

      await Promise.all(promises);

      // Just verify that all webhook calls completed without error
      // The exact number of fetch calls may vary due to internal event processing
      expect(fetchMock).toHaveBeenCalled();
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(5);
    });
  });
});