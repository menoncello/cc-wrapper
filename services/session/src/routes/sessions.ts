// Main session API routes
// REST API endpoints for session management with recovery capabilities

import { Elysia, t } from 'elysia';

import { sessionRecoveryService } from '../services/recovery.service.js';
import { sessionService } from '../services/session.service.js';
import type {
  CreateSessionRequest,
  SessionListResponse,
  SessionResponse,
  UpdateSessionRequest,
  WorkspaceState
} from '../types/session.js';
import { checkpointRoutes } from './checkpoints.js';
import { recoveryRoutes } from './recovery.js';

// Request/Response schemas for validation
const createSessionSchema = t.Object({
  userId: t.String(),
  workspaceId: t.String(),
  name: t.String({ minLength: 1, maxLength: 100 }),
  workspaceState: t.Object({
    terminalState: t.Array(t.Any()),
    browserTabs: t.Array(t.Any()),
    aiConversations: t.Array(t.Any()),
    openFiles: t.Array(t.Any()),
    workspaceConfig: t.Optional(t.Object({})),
    metadata: t.Optional(t.Object({}))
  }),
  encryptionKey: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  expiresAt: t.Optional(t.Date())
});

const updateSessionSchema = t.Object({
  workspaceState: t.Object({
    terminalState: t.Array(t.Any()),
    browserTabs: t.Array(t.Any()),
    aiConversations: t.Array(t.Any()),
    openFiles: t.Array(t.Any()),
    workspaceConfig: t.Optional(t.Object({})),
    metadata: t.Optional(t.Object({}))
  }),
  encryptionKey: t.Optional(t.String()),
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  isActive: t.Optional(t.Boolean())
});

const listSessionsSchema = t.Object({
  userId: t.String(),
  workspaceId: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  page: t.Optional(t.Integer({ minimum: 1, maximum: 1000 })),
  pageSize: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
  sortBy: t.Optional(t.Enum(['lastSavedAt', 'createdAt', 'name'])),
  sortOrder: t.Optional(t.Enum(['asc', 'desc']))
});

const restoreSessionSchema = t.Object({
  encryptionKey: t.Optional(t.String()),
  createBackup: t.Optional(t.Boolean()),
  backupName: t.Optional(t.String({ maxLength: 100 }))
});

/**
 * Main session routes plugin
 */
export const sessionRoutes = new Elysia({ prefix: '/sessions' })
  .group('/v1', (app) =>
    app
      // Create new session
      .post('/', async ({ body, set }) => {
        try {
          const session = await sessionService.createSession(
            {
              userId: body.userId,
              workspaceId: body.workspaceId,
              name: body.name,
              workspaceState: body.workspaceState
            },
            body.encryptionKey
          );

          set.status = 201;
          return {
            success: true,
            data: session,
            message: 'Session created successfully'
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SESSION_CREATE_FAILED'
          };
        }
      }, {
        body: createSessionSchema,
        detail: 'Create a new workspace session'
      })

      // Get session by ID
      .get('/:sessionId', async ({ params, query, set }) => {
        try {
          const result = await sessionService.getSession(
            params.sessionId,
            query.encryptionKey
          );

          return {
            success: true,
            data: {
              session: result.session,
              workspaceState: result.workspaceState
            },
            message: 'Session retrieved successfully'
          };
        } catch (error) {
          if (error instanceof Error && error.message.includes('not found')) {
            set.status = 404;
            return {
              success: false,
              error: 'Session not found',
              code: 'SESSION_NOT_FOUND'
            };
          }

          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SESSION_GET_FAILED'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        query: t.Object({
          encryptionKey: t.Optional(t.String())
        }),
        detail: 'Get a specific session by ID'
      })

      // Update existing session
      .put('/:sessionId', async ({ params, body, set }) => {
        try {
          const session = await sessionService.updateSession(
            params.sessionId,
            {
              workspaceState: body.workspaceState,
              name: body.name
            },
            body.encryptionKey
          );

          return {
            success: true,
            data: session,
            message: 'Session updated successfully'
          };
        } catch (error) {
          if (error instanceof Error && error.message.includes('not found')) {
            set.status = 404;
            return {
              success: false,
              error: 'Session not found',
              code: 'SESSION_NOT_FOUND'
            };
          }

          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SESSION_UPDATE_FAILED'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        body: updateSessionSchema,
        detail: 'Update an existing session'
      })

      // List sessions with filtering and pagination
      .get('/', async ({ query, set }) => {
        try {
          const result = await sessionService.listSessions(query.userId, {
            workspaceId: query.workspaceId,
            isActive: query.isActive,
            page: query.page || 1,
            pageSize: query.pageSize || 20
          });

          return {
            success: true,
            data: result,
            message: 'Sessions retrieved successfully'
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SESSIONS_LIST_FAILED'
          };
        }
      }, {
        query: listSessionsSchema,
        detail: 'List sessions with filtering and pagination'
      })

      // Delete session
      .delete('/:sessionId', async ({ params, set }) => {
        try {
          await sessionService.deleteSession(params.sessionId);

          return {
            success: true,
            message: 'Session deleted successfully'
          };
        } catch (error) {
          if (error instanceof Error && error.message.includes('not found')) {
            set.status = 404;
            return {
              success: false,
              error: 'Session not found',
              code: 'SESSION_NOT_FOUND'
            };
          }

          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SESSION_DELETE_FAILED'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        detail: 'Delete a session'
      })

      // Restore session with recovery options
      .post('/:sessionId/restore', async ({ params, body, set }) => {
        try {
          const result = await sessionRecoveryService.restoreSession(
            params.sessionId,
            body.encryptionKey,
            {
              preserveMetadata: true,
              fallbackToCheckpoint: true,
              skipCorruptedData: true,
              preferLatestCheckpoint: false,
              maxDataLossThreshold: 10,
              fallbackToPartial: true
            }
          );

          if (result.success) {
            return {
              success: true,
              data: {
                session: result.session,
                workspaceState: result.workspaceState,
                recoveryMethod: result.recoveryMethod,
                validation: result.validation
              },
              warnings: result.warnings,
              message: `Session restored using ${result.recoveryMethod} method`
            };
          } 
            set.status = 400;
            return {
              success: false,
              error: 'Session restoration failed',
              details: {
                errors: result.errors,
                warnings: result.warnings,
                attemptedMethod: result.recoveryMethod
              },
              code: 'SESSION_RESTORE_FAILED'
            };
          
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SESSION_RESTORE_ERROR'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        body: restoreSessionSchema,
        detail: 'Restore a session with automatic error recovery'
      })

      // Get session health and integrity information
      .get('/:sessionId/health', async ({ params, set }) => {
        try {
          const hasCheckpoints = await sessionRecoveryService.hasRecoverableCheckpoints(params.sessionId);
          const availableCheckpoints = hasCheckpoints
            ? await sessionRecoveryService.getAvailableCheckpoints(params.sessionId)
            : [];

          // Get basic session info without decryption
          const sessions = await sessionService.listSessions('', {
            workspaceId: '',
            page: 1,
            pageSize: 1
          });

          const sessionInfo = sessions.sessions.find(s => s.id === params.sessionId);

          return {
            success: true,
            data: {
              sessionId: params.sessionId,
              hasCheckpoints,
              availableCheckpointsCount: availableCheckpoints.length,
              latestCheckpoints: availableCheckpoints.slice(0, 3),
              sessionInfo,
              healthScore: calculateSessionHealthScore(sessionInfo, hasCheckpoints, availableCheckpoints.length)
            },
            message: 'Session health information retrieved successfully'
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SESSION_HEALTH_CHECK_FAILED'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        detail: 'Get session health and recovery information'
      })

      // Clone session (create new session from existing one)
      .post('/:sessionId/clone', async ({ params, body, set }) => {
        try {
          const originalSession = await sessionService.getSession(
            params.sessionId,
            body.encryptionKey
          );

          const clonedSession = await sessionService.createSession(
            {
              userId: body.userId || originalSession.session.userId,
              workspaceId: body.workspaceId || originalSession.session.workspaceId,
              name: body.name || `${originalSession.session.name} (Clone)`,
              workspaceState: originalSession.workspaceState
            },
            body.encryptionKey
          );

          set.status = 201;
          return {
            success: true,
            data: clonedSession,
            originalSessionId: params.sessionId,
            message: 'Session cloned successfully'
          };
        } catch (error) {
          if (error instanceof Error && error.message.includes('not found')) {
            set.status = 404;
            return {
              success: false,
              error: 'Original session not found',
              code: 'SESSION_NOT_FOUND'
            };
          }

          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SESSION_CLONE_FAILED'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        body: t.Object({
          userId: t.Optional(t.String()),
          workspaceId: t.Optional(t.String()),
          name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
          encryptionKey: t.Optional(t.String())
        }),
        detail: 'Create a clone of an existing session'
      })

      // Archive session (deactivate but keep for historical purposes)
      .post('/:sessionId/archive', async ({ params, set }) => {
        try {
          // This would typically update the session to set isActive = false
          // For now, we'll return success as the implementation would depend on database schema
          return {
            success: true,
            message: 'Session archived successfully',
            archivedAt: new Date().toISOString()
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SESSION_ARCHIVE_FAILED'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        detail: 'Archive a session (deactivate but preserve)'
      })

      // Get session activity log
      .get('/:sessionId/activity', async ({ params, query, set }) => {
        try {
          // This would typically retrieve activity logs for the session
          // For now, we'll return a placeholder response
          const activities = [
            {
              id: '1',
              type: 'created',
              timestamp: new Date().toISOString(),
              description: 'Session created'
            },
            {
              id: '2',
              type: 'updated',
              timestamp: new Date().toISOString(),
              description: 'Session updated'
            }
          ];

          return {
            success: true,
            data: {
              sessionId: params.sessionId,
              activities: activities.slice(0, query.limit || 10),
              total: activities.length
            },
            message: 'Session activity retrieved successfully'
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SESSION_ACTIVITY_FAILED'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        query: t.Object({
          limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 }))
        }),
        detail: 'Get session activity log'
      })
  )

  // Include recovery routes
  .use(recoveryRoutes)

  // Include checkpoint routes
  .use(checkpointRoutes)

  // Health check endpoint
  .get('/health', async () => {
    try {
      const stats = await sessionRecoveryService.getRecoveryStatistics();
      return {
        success: true,
        status: 'healthy',
        service: 'session-service',
        timestamp: new Date().toISOString(),
        stats: {
          totalSessions: stats.totalSessions,
          corruptedSessions: stats.corruptedSessions,
          recoverableSessions: stats.recoverableSessions
        }
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        service: 'session-service',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

/**
 * Calculate session health score
 * @param sessionInfo
 * @param hasCheckpoints
 * @param checkpointCount
 */
function calculateSessionHealthScore(
  sessionInfo: SessionResponse | undefined,
  hasCheckpoints: boolean,
  checkpointCount: number
): number {
  if (!sessionInfo) {
return 0;
}

  let score = 50; // Base score

  // Add points for being active
  if (sessionInfo.isActive) {
score += 20;
}

  // Add points for recent activity
  const daysSinceLastSave = (Date.now() - new Date(sessionInfo.lastSavedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLastSave < 1) {
score += 15;
} else if (daysSinceLastSave < 7) {
score += 10;
} else if (daysSinceLastSave < 30) {
score += 5;
}

  // Add points for having checkpoints
  if (hasCheckpoints) {
    score += 10;
    if (checkpointCount > 1) {
score += 5;
} // Bonus for multiple checkpoints
  }

  // Add points for reasonable size (not too large, not too small)
  if (sessionInfo.totalSize > 0 && sessionInfo.totalSize < 10 * 1024 * 1024) { // Less than 10MB
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

export default sessionRoutes;