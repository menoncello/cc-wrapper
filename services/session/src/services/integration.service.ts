/**
 * Integration Service
 * Handles integration with existing services and external APIs
 */

import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';

import { SessionCheckpointService } from './checkpoint.service';
import { EncryptionService } from './encryption.service';
import { SessionKeyManagementService } from './key-management.service';
import { SessionRecoveryService } from './recovery.service';
import { SessionSynchronizationService } from './synchronization.service';

export interface IntegrationConfig {
  services: {
    auth: AuthConfig;
    terminal: TerminalConfig;
    browser: BrowserConfig;
    ai: AIConfig;
    notifications: NotificationConfig;
  };
  webhooks: WebhookConfig[];
  externalApis: ExternalApiConfig[];
}

export interface AuthConfig {
  endpoint: string;
  apiKey: string;
  tokenValidationEndpoint: string;
  userEndpoint: string;
}

export interface TerminalConfig {
  socketEndpoint: string;
  commandHistoryEndpoint: string;
  workingDirectoryEndpoint: string;
}

export interface BrowserConfig {
  extensionEndpoint: string;
  tabsEndpoint: string;
  bookmarksEndpoint: string;
  historyEndpoint: string;
}

export interface AIConfig {
  conversationsEndpoint: string;
  contextEndpoint: string;
  modelsEndpoint: string;
}

export interface NotificationConfig {
  serviceUrl: string;
  apiKey: string;
  channels: string[];
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  retryAttempts: number;
  timeout: number;
}

export interface ExternalApiConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export interface IntegrationEvent {
  id: string;
  type: string;
  source: string;
  userId: string;
  sessionId?: string;
  data: any;
  timestamp: Date;
  processed: boolean;
  error?: string;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  error?: string;
}

/**
 *
 */
export class IntegrationService {
  private prisma: PrismaClient;
  private syncService: SessionSynchronizationService;
  private keyManagementService: SessionKeyManagementService;
  private encryptionService: EncryptionService;
  private checkpointService: SessionCheckpointService;
  private recoveryService: SessionRecoveryService;
  private config: IntegrationConfig;
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private webhooks: Map<string, WebhookConfig> = new Map();
  private eventQueue: IntegrationEvent[] = [];

  /**
   *
   * @param config
   */
  constructor(config: IntegrationConfig) {
    this.prisma = new PrismaClient();
    this.config = config;
    this.syncService = new SessionSynchronizationService();
    this.keyManagementService = new SessionKeyManagementService();
    this.encryptionService = new EncryptionService();
    this.checkpointService = new SessionCheckpointService();
    this.recoveryService = new SessionRecoveryService();

    this.initializeWebhooks();
    this.startHealthChecks();
    this.startEventProcessing();
  }

  /**
   * Authenticate user and get user information
   * @param token
   */
  async authenticateUser(token: string): Promise<{
    userId: string;
    email: string;
    permissions: string[];
  } | null> {
    try {
      const response = await fetch(`${this.config.services.auth.tokenValidationEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.services.auth.apiKey}`
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error(`Auth service error: ${response.status}`);
      }

      const userData = await response.json();
      return {
        userId: userData.id,
        email: userData.email,
        permissions: userData.permissions || []
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      return null;
    }
  }

  /**
   * Get terminal state for session capture
   * @param userId
   * @param sessionId
   */
  async getTerminalState(userId: string, sessionId: string): Promise<{
    commandHistory: string[];
    workingDirectory: string;
    environment: Record<string, string>;
  }> {
    try {
      const response = await fetch(`${this.config.services.terminal.commandHistoryEndpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.services.auth.apiKey}`,
          'X-User-ID': userId,
          'X-Session-ID': sessionId
        }
      });

      if (!response.ok) {
        throw new Error(`Terminal service error: ${response.status}`);
      }

      const terminalData = await response.json();
      return {
        commandHistory: terminalData.history || [],
        workingDirectory: terminalData.workingDirectory || '/',
        environment: terminalData.environment || {}
      };
    } catch (error) {
      console.error('Failed to get terminal state:', error);
      return {
        commandHistory: [],
        workingDirectory: '/',
        environment: {}
      };
    }
  }

  /**
   * Get browser state for session capture
   * @param userId
   * @param sessionId
   */
  async getBrowserState(userId: string, sessionId: string): Promise<{
    tabs: Array<{
      url: string;
      title: string;
      active: boolean;
    }>;
    activeTab: number;
  }> {
    try {
      const response = await fetch(`${this.config.services.browser.tabsEndpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.services.auth.apiKey}`,
          'X-User-ID': userId,
          'X-Session-ID': sessionId
        }
      });

      if (!response.ok) {
        throw new Error(`Browser service error: ${response.status}`);
      }

      const browserData = await response.json();
      return {
        tabs: browserData.tabs || [],
        activeTab: browserData.activeTab || 0
      };
    } catch (error) {
      console.error('Failed to get browser state:', error);
      return {
        tabs: [],
        activeTab: -1
      };
    }
  }

  /**
   * Get AI conversation state for session capture
   * @param userId
   * @param sessionId
   */
  async getAIConversations(userId: string, sessionId: string): Promise<{
    conversations: Array<{
      id: string;
      model: string;
      messages: Array<{
        role: string;
        content: string;
        timestamp: string;
      }>;
    }>;
  }> {
    try {
      const response = await fetch(`${this.config.services.ai.conversationsEndpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.services.auth.apiKey}`,
          'X-User-ID': userId,
          'X-Session-ID': sessionId
        }
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const aiData = await response.json();
      return {
        conversations: aiData.conversations || []
      };
    } catch (error) {
      console.error('Failed to get AI conversations:', error);
      return {
        conversations: []
      };
    }
  }

  /**
   * Send notification to user
   * @param userId
   * @param notification
   * @param notification.title
   * @param notification.message
   * @param notification.type
   * @param notification.channels
   */
  async sendNotification(userId: string, notification: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    channels?: string[];
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.services.notifications.serviceUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.services.notifications.apiKey}`
        },
        body: JSON.stringify({
          userId,
          ...notification,
          channels: notification.channels || this.config.services.notifications.channels
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Trigger webhook for integration event
   * @param eventType
   * @param data
   */
  async triggerWebhook(eventType: string, data: any): Promise<void> {
    const relevantWebhooks = Array.from(this.webhooks.values())
      .filter(webhook => webhook.active && webhook.events.includes(eventType));

    for (const webhook of relevantWebhooks) {
      try {
        const payload = {
          eventType,
          data,
          timestamp: new Date().toISOString(),
          webhookId: webhook.id
        };

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'CC-Wrapper-Session-Service/1.0',
            ...(webhook.secret && { 'X-Webhook-Signature': this.generateSignature(payload, webhook.secret) })
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(webhook.timeout)
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status}`);
        }

        console.log(`Webhook ${webhook.name} triggered successfully for event ${eventType}`);
      } catch (error) {
        console.error(`Webhook ${webhook.name} failed for event ${eventType}:`, error);
        // Implement retry logic here if needed
      }
    }
  }

  /**
   * Generate webhook signature
   * @param payload
   * @param secret
   */
  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  /**
   * Check health of all integrated services
   */
  async checkServiceHealth(): Promise<ServiceHealth[]> {
    const services = Object.keys(this.config.services);
    const healthChecks: ServiceHealth[] = [];

    for (const service of services) {
      try {
        const startTime = Date.now();
        const config = this.config.services[service as keyof typeof this.config.services];

        // Make a simple health check request
        const response = await fetch(config.endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.services.auth.apiKey}`
          },
          signal: AbortSignal.timeout(5000)
        });

        const responseTime = Date.now() - startTime;
        const status = response.ok ? 'healthy' : 'unhealthy';

        const health: ServiceHealth = {
          service,
          status,
          lastCheck: new Date(),
          responseTime,
          error: response.ok ? undefined : `HTTP ${response.status}`
        };

        healthChecks.push(health);
        this.serviceHealth.set(service, health);
      } catch (error) {
        const health: ServiceHealth = {
          service,
          status: 'unhealthy',
          lastCheck: new Date(),
          responseTime: 5000,
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        healthChecks.push(health);
        this.serviceHealth.set(service, health);
      }
    }

    return healthChecks;
  }

  /**
   * Get current service health status
   */
  getServiceHealth(): Map<string, ServiceHealth> {
    return new Map(this.serviceHealth);
  }

  /**
   * Create comprehensive workspace state
   * @param userId
   * @param sessionId
   */
  async createWorkspaceState(userId: string, sessionId: string): Promise<{
    terminal: any;
    browser: any;
    aiConversations: any;
    files: any;
    metadata: any;
  }> {
    const [terminal, browser, aiConversations] = await Promise.all([
      this.getTerminalState(userId, sessionId),
      this.getBrowserState(userId, sessionId),
      this.getAIConversations(userId, sessionId)
    ]);

    return {
      terminal,
      browser,
      aiConversations,
      files: await this.getOpenFiles(userId, sessionId),
      metadata: {
        capturedAt: new Date().toISOString(),
        userId,
        sessionId,
        version: '1.0'
      }
    };
  }

  /**
   * Get open files in workspace
   * @param userId
   * @param sessionId
   */
  private async getOpenFiles(userId: string, sessionId: string): Promise<any[]> {
    // This would integrate with an IDE or file editor service
    // For now, return empty array
    return [];
  }

  /**
   * Process integration events
   */
  private async processEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = this.eventQueue.splice(0); // Take all events

    for (const event of events) {
      try {
        // Update session service based on event
        if (event.type === 'terminal_command') {
          await this.syncService.publishEvent({
            type: 'session_updated',
            sessionId: event.sessionId!,
            userId: event.userId,
            data: { terminalUpdate: event.data }
          });
        }

        // Trigger webhooks
        await this.triggerWebhook(event.type, event.data);

        event.processed = true;
      } catch (error) {
        event.processed = false;
        event.error = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to process event ${event.id}:`, error);
      }
    }
  }

  /**
   * Initialize webhooks from config
   */
  private initializeWebhooks(): void {
    for (const webhook of this.config.webhooks) {
      this.webhooks.set(webhook.id, webhook);
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    setInterval(async () => {
      await this.checkServiceHealth();
    }, 60000); // Check every minute
  }

  /**
   * Start event processing loop
   */
  private startEventProcessing(): void {
    setInterval(async () => {
      await this.processEvents();
    }, 1000); // Process every second
  }

  /**
   * Add new webhook
   * @param webhook
   */
  addWebhook(webhook: WebhookConfig): void {
    this.webhooks.set(webhook.id, webhook);
  }

  /**
   * Remove webhook
   * @param webhookId
   */
  removeWebhook(webhookId: string): boolean {
    return this.webhooks.delete(webhookId);
  }

  /**
   * Get all webhooks
   */
  getWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Update integration configuration
   * @param newConfig
   */
  updateConfig(newConfig: Partial<IntegrationConfig>): void {
    Object.assign(this.config, newConfig);

    // Reinitialize webhooks if config changed
    if (newConfig.webhooks) {
      this.webhooks.clear();
      this.initializeWebhooks();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.syncService.shutdown();
    await this.prisma.$disconnect();
  }
}