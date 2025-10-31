/**
 * Real-time Session Synchronization Service
 * Handles real-time updates and conflict resolution for collaborative sessions
 */

import { SessionCheckpoint,WorkspaceSession } from '@prisma/client';
import { EventEmitter } from 'events';
import prisma from '../lib/prisma.js';

export interface SyncEvent {
  id: string;
  type: 'session_created' | 'session_updated' | 'session_deleted' | 'checkpoint_created' | 'checkpoint_deleted';
  sessionId: string;
  userId: string;
  workspaceId?: string;
  data: any;
  timestamp: Date;
  version: number;
}

export interface SyncSubscription {
  id: string;
  userId: string;
  sessionId?: string;
  workspaceId?: string;
  eventTypes: string[];
  createdAt: Date;
  lastActivity: Date;
}

export interface SyncConflict {
  id: string;
  sessionId: string;
  conflictType: 'concurrent_update' | 'data_corruption' | 'version_mismatch';
  localVersion: number;
  remoteVersion: number;
  localData: any;
  remoteData: any;
  timestamp: Date;
  resolved: boolean;
  resolution?: 'local_wins' | 'remote_wins' | 'merge';
}

export interface SyncMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  activeSubscriptions: number;
  conflictsDetected: number;
  conflictsResolved: number;
  averageLatency: number;
  lastSyncTime: Date;
}

/**
 *
 */
export class SessionSynchronizationService extends EventEmitter {
  private prisma: typeof prisma;
  private subscriptions: Map<string, SyncSubscription> = new Map();
  private eventQueue: SyncEvent[] = [];
  private conflicts: Map<string, SyncConflict> = new Map();
  private metrics: SyncMetrics;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   *
   */
  constructor() {
    super();
    this.prisma = prisma;
    this.metrics = {
      totalEvents: 0,
      eventsPerSecond: 0,
      activeSubscriptions: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      averageLatency: 0,
      lastSyncTime: new Date()
    };
    this.startEventProcessing();
  }

  /**
   * Create a new sync subscription
   * @param request
   * @param request.userId
   * @param request.sessionId
   * @param request.workspaceId
   * @param request.eventTypes
   */
  async createSubscription(request: {
    userId: string;
    sessionId?: string;
    workspaceId?: string;
    eventTypes?: string[];
  }): Promise<SyncSubscription> {
    const subscription: SyncSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: request.userId,
      sessionId: request.sessionId,
      workspaceId: request.workspaceId,
      eventTypes: request.eventTypes || ['session_updated', 'checkpoint_created'],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.subscriptions.set(subscription.id, subscription);
    this.updateMetrics();

    this.emit('subscription_created', subscription);

    return subscription;
  }

  /**
   * Remove a sync subscription
   * @param subscriptionId
   */
  async removeSubscription(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    this.subscriptions.delete(subscriptionId);
    this.updateMetrics();

    this.emit('subscription_removed', { subscriptionId, userId: subscription.userId });

    return true;
  }

  /**
   * Publish a sync event
   * @param event
   */
  async publishEvent(event: Omit<SyncEvent, 'id' | 'timestamp' | 'version'>): Promise<SyncEvent> {
    const syncEvent: SyncEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      version: await this.getNextVersion(event.sessionId),
      ...event
    };

    this.eventQueue.push(syncEvent);
    this.metrics.totalEvents++;
    this.metrics.lastSyncTime = new Date();

    return syncEvent;
  }

  /**
   * Get next version number for a session
   * @param sessionId
   */
  private async getNextVersion(sessionId: string): Promise<number> {
    try {
      const session = await this.prisma.workspaceSession.findUnique({
        where: { id: sessionId },
        select: { version: true }
      });
      return (session?.version || 0) + 1;
    } catch (error) {
      console.error('Failed to get next version:', error);
      return 1;
    }
  }

  /**
   * Process queued events
   */
  private async processEvents(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      const events = this.eventQueue.splice(0); // Take all events
      const eventGroups = this.groupEventsBySubscription(events);

      for (const [subscriptionId, subscriptionEvents] of eventGroups) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
          continue;
        }

        try {
          await this.deliverEvents(subscription, subscriptionEvents);
          subscription.lastActivity = new Date();
        } catch (error) {
          console.error(`Failed to deliver events to subscription ${subscriptionId}:`, error);
        }
      }

      this.updateMetrics();
      const processingTime = Date.now() - startTime;
      this.metrics.averageLatency = (this.metrics.averageLatency + processingTime) / 2;

    } catch (error) {
      console.error('Event processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Group events by subscription
   * @param events
   */
  private groupEventsBySubscription(events: SyncEvent[]): Map<string, SyncEvent[]> {
    const groups = new Map<string, SyncEvent[]>();

    for (const event of events) {
      for (const [subscriptionId, subscription] of this.subscriptions) {
        if (this.shouldDeliverEvent(event, subscription)) {
          if (!groups.has(subscriptionId)) {
            groups.set(subscriptionId, []);
          }
          groups.get(subscriptionId)!.push(event);
        }
      }
    }

    return groups;
  }

  /**
   * Check if event should be delivered to subscription
   * @param event
   * @param subscription
   */
  private shouldDeliverEvent(event: SyncEvent, subscription: SyncSubscription): boolean {
    // Check event type filter
    if (!subscription.eventTypes.includes(event.type)) {
      return false;
    }

    // Check session filter
    if (subscription.sessionId && event.sessionId !== subscription.sessionId) {
      return false;
    }

    // Check workspace filter
    if (subscription.workspaceId && event.workspaceId !== subscription.workspaceId) {
      return false;
    }

    // Don't send events back to the creator
    if (event.userId === subscription.userId) {
      return false;
    }

    return true;
  }

  /**
   * Deliver events to a subscription
   * @param subscription
   * @param events
   */
  private async deliverEvents(subscription: SyncSubscription, events: SyncEvent[]): Promise<void> {
    for (const event of events) {
      // Check for conflicts
      if (event.type === 'session_updated') {
        await this.checkForConflicts(event);
      }

      this.emit('event_delivered', {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        event
      });
    }
  }

  /**
   * Check for sync conflicts
   * @param event
   */
  private async checkForConflicts(event: SyncEvent): Promise<void> {
    try {
      // Get current session state
      const currentSession = await this.prisma.workspaceSession.findUnique({
        where: { id: event.sessionId },
        select: { version: true, workspaceState: true }
      });

      if (!currentSession) {
        return;
      }

      // Check if there's a version mismatch
      if (event.version < currentSession.version) {
        const conflict: SyncConflict = {
          id: `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          sessionId: event.sessionId,
          conflictType: 'version_mismatch',
          localVersion: event.version,
          remoteVersion: currentSession.version,
          localData: event.data,
          remoteData: currentSession.workspaceState,
          timestamp: new Date(),
          resolved: false
        };

        this.conflicts.set(conflict.id, conflict);
        this.metrics.conflictsDetected++;

        this.emit('conflict_detected', conflict);
      }
    } catch (error) {
      console.error('Conflict check failed:', error);
    }
  }

  /**
   * Resolve a sync conflict
   * @param conflictId
   * @param resolution
   */
  async resolveConflict(conflictId: string, resolution: 'local_wins' | 'remote_wins' | 'merge'): Promise<boolean> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      return false;
    }

    try {
      let resolvedData: any;

      switch (resolution) {
        case 'local_wins':
          resolvedData = conflict.localData;
          break;
        case 'remote_wins':
          resolvedData = conflict.remoteData;
          break;
        case 'merge':
          resolvedData = await this.mergeData(conflict.localData, conflict.remoteData);
          break;
      }

      // Update session with resolved data
      await this.prisma.workspaceSession.update({
        where: { id: conflict.sessionId },
        data: {
          workspaceState: resolvedData,
          version: Math.max(conflict.localVersion, conflict.remoteVersion)
        }
      });

      conflict.resolved = true;
      conflict.resolution = resolution;
      this.metrics.conflictsResolved++;

      // Publish resolution event
      await this.publishEvent({
        type: 'session_updated',
        sessionId: conflict.sessionId,
        userId: 'system',
        data: { conflictResolved: true, conflictId, resolution }
      });

      this.emit('conflict_resolved', conflict);

      return true;
    } catch (error) {
      console.error('Conflict resolution failed:', error);
      return false;
    }
  }

  /**
   * Merge conflicting data
   * @param localData
   * @param remoteData
   */
  private async mergeData(localData: any, remoteData: any): Promise<any> {
    try {
      // Simple merge strategy - combine non-conflicting fields
      const merged = { ...remoteData };

      if (typeof localData === 'object' && typeof remoteData === 'object') {
        for (const [key, value] of Object.entries(localData)) {
          if (!(key in remoteData)) {
            merged[key] = value;
          } else if (typeof value === 'object' && typeof remoteData[key] === 'object') {
            merged[key] = await this.mergeData(value, remoteData[key]);
          }
        }
      }

      return merged;
    } catch (error) {
      console.error('Data merge failed:', error);
      return remoteData; // Fallback to remote data
    }
  }

  /**
   * Get sync metrics
   */
  getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): SyncSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get unresolved conflicts
   */
  getUnresolvedConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values()).filter(conflict => !conflict.resolved);
  }

  /**
   * Clean up inactive subscriptions
   * @param maxInactiveMinutes
   */
  async cleanupInactiveSubscriptions(maxInactiveMinutes = 30): Promise<number> {
    const cutoffTime = new Date(Date.now() - maxInactiveMinutes * 60 * 1000);
    let cleanedCount = 0;

    for (const [subscriptionId, subscription] of this.subscriptions) {
      if (subscription.lastActivity < cutoffTime) {
        this.subscriptions.delete(subscriptionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.updateMetrics();
    }

    return cleanedCount;
  }

  /**
   * Start event processing loop
   */
  private startEventProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processEvents().catch(error => {
        console.error('Event processing loop error:', error);
      });
    }, 100); // Process every 100ms
  }

  /**
   * Stop event processing loop
   */
  stopEventProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Update sync metrics
   */
  private updateMetrics(): void {
    this.metrics.activeSubscriptions = this.subscriptions.size;

    // Calculate events per second
    const now = Date.now();
    const timeDiff = (now - this.metrics.lastSyncTime.getTime()) / 1000;
    if (timeDiff > 0) {
      this.metrics.eventsPerSecond = this.metrics.totalEvents / timeDiff;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.stopEventProcessing();

    // Process remaining events
    while (this.eventQueue.length > 0) {
      await this.processEvents();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Clean up subscriptions
    this.subscriptions.clear();
    this.conflicts.clear();

    // Note: Not disconnecting shared prisma client as it may be used by other services
  }
}