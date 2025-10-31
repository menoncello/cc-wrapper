/**
 * Integration API Routes
 * Handles integration with external services and systems
 */

import { Elysia, t } from 'elysia';

import { IntegrationService } from '../services/integration.service';
import { EnvValidator } from '../lib/env-validation.js';
import { generateSecureUrlId } from '../lib/crypto-utils.js';

// Default integration configuration with validation
const defaultConfig = {
  services: {
    auth: {
      endpoint: EnvValidator.endpoint('AUTH_SERVICE_ENDPOINT', 'http://localhost:20001/auth'),
      apiKey: EnvValidator.apiKey('AUTH_SERVICE_API_KEY', 'test-key'),
      tokenValidationEndpoint: EnvValidator.endpoint('AUTH_TOKEN_VALIDATION', 'http://localhost:20001/auth/validate'),
      userEndpoint: EnvValidator.endpoint('AUTH_USER_ENDPOINT', 'http://localhost:20001/auth/user')
    },
    terminal: {
      socketEndpoint: EnvValidator.endpoint('TERMINAL_SOCKET_ENDPOINT', 'ws://localhost:20002/terminal'),
      commandHistoryEndpoint: EnvValidator.endpoint('TERMINAL_HISTORY_ENDPOINT', 'http://localhost:20002/terminal/history'),
      workingDirectoryEndpoint: EnvValidator.endpoint('TERMINAL_WORKING_DIR_ENDPOINT', 'http://localhost:20002/terminal/pwd')
    },
    browser: {
      extensionEndpoint: EnvValidator.endpoint('BROWSER_EXTENSION_ENDPOINT', 'http://localhost:20003/browser'),
      tabsEndpoint: EnvValidator.endpoint('BROWSER_TABS_ENDPOINT', 'http://localhost:20003/browser/tabs'),
      bookmarksEndpoint: EnvValidator.endpoint('BROWSER_BOOKMARKS_ENDPOINT', 'http://localhost:20003/browser/bookmarks'),
      historyEndpoint: EnvValidator.endpoint('BROWSER_HISTORY_ENDPOINT', 'http://localhost:20003/browser/history')
    },
    ai: {
      conversationsEndpoint: EnvValidator.endpoint('AI_CONVERSATIONS_ENDPOINT', 'http://localhost:20004/ai/conversations'),
      contextEndpoint: EnvValidator.endpoint('AI_CONTEXT_ENDPOINT', 'http://localhost:20004/ai/context'),
      modelsEndpoint: EnvValidator.endpoint('AI_MODELS_ENDPOINT', 'http://localhost:20004/ai/models')
    },
    notifications: {
      serviceUrl: EnvValidator.endpoint('NOTIFICATION_SERVICE_URL', 'http://localhost:20005/notifications'),
      apiKey: EnvValidator.apiKey('NOTIFICATION_SERVICE_API_KEY', 'notification-key'),
      channels: ['email', 'in_app', 'slack']
    }
  },
  webhooks: [],
  externalApis: []
};

const integrationService = new IntegrationService(defaultConfig);

export { defaultConfig };

export const integrationRoutes = new Elysia({ prefix: '/integration' })
  .post(
    '/auth/validate',
    async ({ body }) => {
      try {
        const user = await integrationService.authenticateUser(body.token);
        return {
          success: !!user,
          data: user
        };
      } catch (error) {
        console.error('Auth validation failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Authentication failed'
        };
      }
    },
    {
      body: t.Object({
        token: t.String()
      })
    }
  )
  .get(
    '/workspace-state/:userId/:sessionId',
    async ({ params }) => {
      try {
        const workspaceState = await integrationService.createWorkspaceState(
          params.userId,
          params.sessionId
        );
        return {
          success: true,
          data: workspaceState
        };
      } catch (error) {
        console.error('Failed to get workspace state:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get workspace state'
        };
      }
    },
    {
      params: t.Object({
        userId: t.String(),
        sessionId: t.String()
      })
    }
  )
  .get(
    '/terminal/:userId/:sessionId',
    async ({ params }) => {
      try {
        const terminalState = await integrationService.getTerminalState(
          params.userId,
          params.sessionId
        );
        return {
          success: true,
          data: terminalState
        };
      } catch (error) {
        console.error('Failed to get terminal state:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get terminal state'
        };
      }
    },
    {
      params: t.Object({
        userId: t.String(),
        sessionId: t.String()
      })
    }
  )
  .get(
    '/browser/:userId/:sessionId',
    async ({ params }) => {
      try {
        const browserState = await integrationService.getBrowserState(
          params.userId,
          params.sessionId
        );
        return {
          success: true,
          data: browserState
        };
      } catch (error) {
        console.error('Failed to get browser state:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get browser state'
        };
      }
    },
    {
      params: t.Object({
        userId: t.String(),
        sessionId: t.String()
      })
    }
  )
  .get(
    '/ai/:userId/:sessionId',
    async ({ params }) => {
      try {
        const aiConversations = await integrationService.getAIConversations(
          params.userId,
          params.sessionId
        );
        return {
          success: true,
          data: aiConversations
        };
      } catch (error) {
        console.error('Failed to get AI conversations:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get AI conversations'
        };
      }
    },
    {
      params: t.Object({
        userId: t.String(),
        sessionId: t.String()
      })
    }
  )
  .post(
    '/notifications/send',
    async ({ body }) => {
      try {
        const success = await integrationService.sendNotification(body.userId, {
          title: body.title,
          message: body.message,
          type: body.type,
          channels: body.channels
        });
        return {
          success,
          message: success ? 'Notification sent' : 'Failed to send notification'
        };
      } catch (error) {
        console.error('Failed to send notification:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send notification'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        title: t.String(),
        message: t.String(),
        type: t.Union([t.Literal('info'), t.Literal('warning'), t.Literal('error'), t.Literal('success')]),
        channels: t.Optional(t.Array(t.String()))
      })
    }
  )
  .get(
    '/health',
    async () => {
      try {
        const healthStatus = await integrationService.checkServiceHealth();
        return {
          success: true,
          data: healthStatus
        };
      } catch (error) {
        console.error('Health check failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Health check failed'
        };
      }
    }
  )
  .get(
    '/health/current',
    () => {
      try {
        const currentHealth = integrationService.getServiceHealth();
        return {
          success: true,
          data: Object.fromEntries(currentHealth)
        };
      } catch (error) {
        console.error('Failed to get current health:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get current health'
        };
      }
    }
  )
  .get(
    '/webhooks',
    () => {
      try {
        const webhooks = integrationService.getWebhooks();
        return {
          success: true,
          data: webhooks
        };
      } catch (error) {
        console.error('Failed to get webhooks:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get webhooks'
        };
      }
    }
  )
  .post(
    '/webhooks',
    async ({ body }) => {
      try {
        const webhook = {
          id: generateSecureUrlId('webhook'),
          name: body.name,
          url: body.url,
          events: body.events,
          secret: body.secret,
          active: true,
          retryAttempts: body.retryAttempts || 3,
          timeout: body.timeout || 10000
        };

        integrationService.addWebhook(webhook);
        return {
          success: true,
          data: webhook
        };
      } catch (error) {
        console.error('Failed to add webhook:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add webhook'
        };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        url: t.String(),
        events: t.Array(t.String()),
        secret: t.Optional(t.String()),
        retryAttempts: t.Optional(t.Integer()),
        timeout: t.Optional(t.Integer())
      })
    }
  )
  .delete(
    '/webhooks/:webhookId',
    async ({ params }) => {
      try {
        const success = integrationService.removeWebhook(params.webhookId);
        return {
          success,
          message: success ? 'Webhook removed' : 'Webhook not found'
        };
      } catch (error) {
        console.error('Failed to remove webhook:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to remove webhook'
        };
      }
    },
    {
      params: t.Object({
        webhookId: t.String()
      })
    }
  )
  .post(
    '/webhooks/:webhookId/trigger',
    async ({ params, body }) => {
      try {
        await integrationService.triggerWebhook(body.eventType, body.data);
        return {
          success: true,
          message: 'Webhook triggered'
        };
      } catch (error) {
        console.error('Failed to trigger webhook:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to trigger webhook'
        };
      }
    },
    {
      params: t.Object({
        webhookId: t.String()
      }),
      body: t.Object({
        eventType: t.String(),
        data: t.Any()
      })
    }
  )
  .get(
    '/config',
    () => {
      try {
        const config = integrationService.getConfig();
        // Remove sensitive information
        const sanitizedConfig = {
          ...config,
          services: {
            ...config.services,
            auth: {
              ...config.services.auth,
              apiKey: config.services.auth.apiKey ? '[REDACTED]' : undefined
            },
            notifications: {
              ...config.services.notifications,
              apiKey: config.services.notifications.apiKey ? '[REDACTED]' : undefined
            }
          }
        };
        return {
          success: true,
          data: sanitizedConfig
        };
      } catch (error) {
        console.error('Failed to get config:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get config'
        };
      }
    }
  )
  .put(
    '/config',
    async ({ body }) => {
      try {
        integrationService.updateConfig(body);
        return {
          success: true,
          message: 'Configuration updated'
        };
      } catch (error) {
        console.error('Failed to update config:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update config'
        };
      }
    },
    {
      body: t.Object({
        services: t.Optional(t.Any()),
        webhooks: t.Optional(t.Array(t.Any())),
        externalApis: t.Optional(t.Array(t.Any()))
      })
    }
  )
  .post(
    '/events',
    async ({ body }) => {
      try {
        // This would typically be called by other services to publish events
        const event = {
          id: generateSecureUrlId('event'),
          type: body.type,
          source: body.source || 'external',
          userId: body.userId,
          sessionId: body.sessionId,
          data: body.data,
          timestamp: new Date(),
          processed: false
        };

        // Queue event for processing
        await integrationService.triggerWebhook(event.type, event.data);

        return {
          success: true,
          data: { eventId: event.id }
        };
      } catch (error) {
        console.error('Failed to process event:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process event'
        };
      }
    },
    {
      body: t.Object({
        type: t.String(),
        source: t.Optional(t.String()),
        userId: t.String(),
        sessionId: t.Optional(t.String()),
        data: t.Any()
      })
    }
  );