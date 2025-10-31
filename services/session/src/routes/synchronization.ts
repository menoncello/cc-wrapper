/**
 * Real-time Synchronization API Routes
 * Handles WebSocket-like synchronization for session updates
 */

import { Elysia, t } from 'elysia';

import { SessionSynchronizationService } from '../services/synchronization.service';

const syncService = new SessionSynchronizationService();

export const synchronizationRoutes = new Elysia({ prefix: '/sync' })
  .post(
    '/subscribe',
    async ({ body, set }) => {
      try {
        const subscription = await syncService.createSubscription(body);

        // Set up Server-Sent Events
        set.headers = {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        };

        // Create event stream
        return new ReadableStream({
          start(controller) {
            const sendEvent = (data: any) => {
              const event = `data: ${JSON.stringify(data)}\n\n`;
              controller.enqueue(new TextEncoder().encode(event));
            };

            // Send initial connection event
            sendEvent({
              type: 'connected',
              subscriptionId: subscription.id,
              timestamp: new Date().toISOString()
            });

            // Listen for events
            const onEventDelivered = (payload: any) => {
              if (payload.subscriptionId === subscription.id) {
                sendEvent({
                  type: 'event',
                  data: payload.event,
                  timestamp: new Date().toISOString()
                });
              }
            };

            const onConflictDetected = (conflict: any) => {
              sendEvent({
                type: 'conflict',
                data: conflict,
                timestamp: new Date().toISOString()
              });
            };

            const onConflictResolved = (conflict: any) => {
              sendEvent({
                type: 'conflict_resolved',
                data: conflict,
                timestamp: new Date().toISOString()
              });
            };

            // Register event listeners
            syncService.on('event_delivered', onEventDelivered);
            syncService.on('conflict_detected', onConflictDetected);
            syncService.on('conflict_resolved', onConflictResolved);

            // Cleanup on disconnect
            const cleanup = () => {
              syncService.off('event_delivered', onEventDelivered);
              syncService.off('conflict_detected', onConflictDetected);
              syncService.off('conflict_resolved', onConflictResolved);
              syncService.removeSubscription(subscription.id);
            };

            // Handle connection close
            request.signal.addEventListener('abort', cleanup);

            // Send periodic heartbeat
            const heartbeat = setInterval(() => {
              sendEvent({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              });
            }, 30000);

            cleanup(() => clearInterval(heartbeat));
          }
        });
      } catch (error) {
        console.error('Failed to create subscription:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create subscription'
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        sessionId: t.Optional(t.String()),
        workspaceId: t.Optional(t.String()),
        eventTypes: t.Optional(t.Array(t.String()))
      })
    }
  )
  .delete(
    '/subscribe/:subscriptionId',
    async ({ params, query }) => {
      try {
        const success = await syncService.removeSubscription(params.subscriptionId);
        return {
          success,
          message: success ? 'Subscription removed' : 'Subscription not found'
        };
      } catch (error) {
        console.error('Failed to remove subscription:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to remove subscription'
        };
      }
    },
    {
      params: t.Object({
        subscriptionId: t.String()
      }),
      query: t.Object({
        userId: t.String()
      })
    }
  )
  .post(
    '/events',
    async ({ body }) => {
      try {
        const event = await syncService.publishEvent(body);
        return {
          success: true,
          data: event
        };
      } catch (error) {
        console.error('Failed to publish event:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to publish event'
        };
      }
    },
    {
      body: t.Object({
        type: t.Union([
          t.Literal('session_created'),
          t.Literal('session_updated'),
          t.Literal('session_deleted'),
          t.Literal('checkpoint_created'),
          t.Literal('checkpoint_deleted')
        ]),
        sessionId: t.String(),
        userId: t.String(),
        workspaceId: t.Optional(t.String()),
        data: t.Any()
      })
    }
  )
  .get(
    '/subscriptions',
    () => {
      try {
        const subscriptions = syncService.getActiveSubscriptions();
        return {
          success: true,
          data: subscriptions
        };
      } catch (error) {
        console.error('Failed to get subscriptions:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get subscriptions'
        };
      }
    }
  )
  .get(
    '/subscriptions/:userId',
    async ({ params }) => {
      try {
        const userSubscriptions = syncService.getActiveSubscriptions()
          .filter(sub => sub.userId === params.userId);

        return {
          success: true,
          data: userSubscriptions
        };
      } catch (error) {
        console.error('Failed to get user subscriptions:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get user subscriptions'
        };
      }
    },
    {
      params: t.Object({
        userId: t.String()
      })
    }
  )
  .get(
    '/conflicts',
    () => {
      try {
        const conflicts = syncService.getUnresolvedConflicts();
        return {
          success: true,
          data: conflicts
        };
      } catch (error) {
        console.error('Failed to get conflicts:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get conflicts'
        };
      }
    }
  )
  .get(
    '/conflicts/:sessionId',
    async ({ params }) => {
      try {
        const sessionConflicts = syncService.getUnresolvedConflicts()
          .filter(conflict => conflict.sessionId === params.sessionId);

        return {
          success: true,
          data: sessionConflicts
        };
      } catch (error) {
        console.error('Failed to get session conflicts:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get session conflicts'
        };
      }
    },
    {
      params: t.Object({
        sessionId: t.String()
      })
    }
  )
  .post(
    '/conflicts/:conflictId/resolve',
    async ({ params, body }) => {
      try {
        const success = await syncService.resolveConflict(
          params.conflictId,
          body.resolution
        );
        return {
          success,
          message: success ? 'Conflict resolved' : 'Failed to resolve conflict'
        };
      } catch (error) {
        console.error('Failed to resolve conflict:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to resolve conflict'
        };
      }
    },
    {
      params: t.Object({
        conflictId: t.String()
      }),
      body: t.Object({
        resolution: t.Union([
          t.Literal('local_wins'),
          t.Literal('remote_wins'),
          t.Literal('merge')
        ])
      })
    }
  )
  .get(
    '/metrics',
    () => {
      try {
        const metrics = syncService.getMetrics();
        return {
          success: true,
          data: metrics
        };
      } catch (error) {
        console.error('Failed to get metrics:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get metrics'
        };
      }
    }
  )
  .post(
    '/cleanup',
    async ({ body }) => {
      try {
        const cleanedCount = await syncService.cleanupInactiveSubscriptions(
          body.maxInactiveMinutes || 30
        );
        return {
          success: true,
          data: {
            cleanedSubscriptions: cleanedCount
          }
        };
      } catch (error) {
        console.error('Failed to cleanup subscriptions:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to cleanup subscriptions'
        };
      }
    },
    {
      body: t.Object({
        maxInactiveMinutes: t.Optional(t.Integer())
      })
    }
  );

// Add request signal for SSE cleanup
declare global {
  interface Request {
    signal: AbortSignal;
  }
}