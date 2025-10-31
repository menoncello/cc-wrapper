// Session recovery API routes
// REST API endpoints for session restoration and corruption recovery

import { Elysia, t } from 'elysia';

import { sessionRecoveryService } from '../services/recovery.service.js';
import { sessionService } from '../services/session.service.js';
import type { SessionRecoveryOptions, WorkspaceState } from '../types/session.js';

// Request/Response schemas for validation
const restoreSessionSchema = t.Object({
  encryptionKey: t.Optional(t.String()),
  preferLatestCheckpoint: t.Optional(t.Boolean()),
  maxDataLossThreshold: t.Optional(t.Integer({ minimum: 0, maximum: 100 })),
  fallbackToPartial: t.Optional(t.Boolean()),
  preserveMetadata: t.Optional(t.Boolean()),
  fallbackToCheckpoint: t.Optional(t.String()),
  skipCorruptedData: t.Optional(t.Boolean())
});

const validateSessionSchema = t.Object({
  sessionData: t.String(),
  expectedChecksum: t.String(),
  encryptionKey: t.Optional(t.String())
});

const mergeConflictsSchema = t.Object({
  sessionStates: t.Array(t.Object({
    workspaceState: t.Object({
      terminalState: t.Array(t.Any()),
      browserTabs: t.Array(t.Any()),
      aiConversations: t.Array(t.Any()),
      openFiles: t.Array(t.Any()),
      workspaceConfig: t.Optional(t.Object({})),
      metadata: t.Optional(t.Object({}))
    }),
    lastSavedAt: t.String(), // ISO date string
    source: t.String() // 'primary', 'checkpoint', 'recovered'
  })),
  strategy: t.Optional(t.Enum(['latest', 'most-complete', 'manual']))
});

const corruptionAnalysisSchema = t.Object({
  sessionId: t.String(),
  includeCheckpoints: t.Optional(t.Boolean())
});

const repairSessionSchema = t.Object({
  sessionId: t.String(),
  encryptionKey: t.Optional(t.String()),
  repairStrategy: t.Optional(t.Enum(['conservative', 'aggressive', 'minimal']))
});

/**
 * Session recovery routes plugin
 */
export const recoveryRoutes = new Elysia({ prefix: '/recovery' })
  .group('/v1', (app) =>
    app
      // Restore session with comprehensive error recovery
      .post('/restore/:sessionId', async ({ params, body, set }) => {
        try {
          const options: SessionRecoveryOptions = {
            preserveMetadata: body.preserveMetadata ?? true,
            fallbackToCheckpoint: body.fallbackToCheckpoint,
            skipCorruptedData: body.skipCorruptedData ?? true,
            preferLatestCheckpoint: body.preferLatestCheckpoint ?? false,
            maxDataLossThreshold: body.maxDataLossThreshold ?? 10,
            fallbackToPartial: body.fallbackToPartial ?? true
          };

          const result = await sessionRecoveryService.restoreSession(
            params.sessionId,
            body.encryptionKey,
            options
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
              message: `Session restored successfully using ${result.recoveryMethod} method`
            };
          } 
            set.status = 400;
            return {
              success: false,
              error: 'Session recovery failed',
              details: {
                errors: result.errors,
                warnings: result.warnings,
                attemptedMethod: result.recoveryMethod
              },
              code: 'SESSION_RECOVERY_FAILED'
            };
          
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'RECOVERY_SERVICE_ERROR'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        body: restoreSessionSchema,
        detail: 'Restore a session with automatic error recovery and fallback mechanisms'
      })

      // Analyze session corruption
      .post('/analyze/:sessionId', async ({ params, body, set }) => {
        try {
          const analysis = await sessionRecoveryService.validateSessionData(
            body.sessionData,
            body.expectedChecksum,
            body.encryptionKey
          );

          // Get additional corruption analysis
          const hasCheckpoints = await sessionRecoveryService.hasRecoverableCheckpoints(params.sessionId);
          const availableCheckpoints = hasCheckpoints
            ? await sessionRecoveryService.getAvailableCheckpoints(params.sessionId)
            : [];

          return {
            success: true,
            data: {
              validation: analysis,
              hasRecoverableCheckpoints: hasCheckpoints,
              availableCheckpointsCount: availableCheckpoints.length,
              availableCheckpoints: availableCheckpoints.slice(0, 5), // Return first 5
              recommendations: generateRecoveryRecommendations(analysis, hasCheckpoints)
            },
            message: 'Session corruption analysis completed'
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'CORRUPTION_ANALYSIS_FAILED'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        body: validateSessionSchema,
        detail: 'Analyze session data for corruption and recovery options'
      })

      // Get available checkpoints for recovery
      .get('/checkpoints/:sessionId', async ({ params, set }) => {
        try {
          const checkpoints = await sessionRecoveryService.getAvailableCheckpoints(params.sessionId);
          const hasCheckpoints = await sessionRecoveryService.hasRecoverableCheckpoints(params.sessionId);

          return {
            success: true,
            data: {
              checkpoints,
              hasRecoverableCheckpoints: hasCheckpoints,
              count: checkpoints.length
            },
            message: 'Available checkpoints retrieved successfully'
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'CHECKPOINTS_RETRIEVAL_FAILED'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        detail: 'Get available checkpoints for session recovery'
      })

      // Resolve merge conflicts between session versions
      .post('/merge-conflicts', async ({ body, set }) => {
        try {
          const result = await sessionRecoveryService.resolveMergeConflicts(
            body.sessionStates.map(state => ({
              ...state,
              lastSavedAt: new Date(state.lastSavedAt)
            })),
            body.strategy || 'latest'
          );

          return {
            success: true,
            data: {
              resolvedState: result.resolvedState,
              conflicts: result.conflicts,
              conflictCount: result.conflicts.length,
              warnings: result.warnings
            },
            message: `Merge conflicts resolved using ${body.strategy || 'latest'} strategy`
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'MERGE_CONFLICT_RESOLUTION_FAILED'
          };
        }
      }, {
        body: mergeConflictsSchema,
        detail: 'Resolve merge conflicts between multiple session versions'
      })

      // Attempt to repair corrupted session
      .post('/repair/:sessionId', async ({ params, body, set }) => {
        try {
          // First try to get the session to analyze corruption
          const session = await sessionService.getSession(params.sessionId, body.encryptionKey);

          if (!session) {
            set.status = 404;
            return {
              success: false,
              error: 'Session not found',
              code: 'SESSION_NOT_FOUND'
            };
          }

          // Analyze corruption
          const analysis = await sessionRecoveryService.validateSessionData(
            JSON.stringify(session.workspaceState),
            session.session.stateChecksum || '',
            body.encryptionKey
          );

          if (!analysis.isValid && !analysis.canRecover) {
            set.status = 400;
            return {
              success: false,
              error: 'Session is critically corrupted and cannot be repaired',
              data: { analysis },
              code: 'SESSION_BEYOND_REPAIR'
            };
          }

          // Attempt restoration with repair options
          const repairOptions: SessionRecoveryOptions = {
            preserveMetadata: true,
            skipCorruptedData: true,
            fallbackToPartial: body.repairStrategy !== 'conservative',
            preferLatestCheckpoint: body.repairStrategy === 'aggressive'
          };

          const result = await sessionRecoveryService.restoreSession(
            params.sessionId,
            body.encryptionKey,
            repairOptions
          );

          if (result.success) {
            return {
              success: true,
              data: {
                session: result.session,
                workspaceState: result.workspaceState,
                recoveryMethod: result.recoveryMethod,
                repairStrategy: body.repairStrategy || 'conservative',
                analysis
              },
              warnings: result.warnings,
              message: `Session repaired successfully using ${result.recoveryMethod} recovery`
            };
          } 
            set.status = 400;
            return {
              success: false,
              error: 'Session repair failed',
              data: {
                errors: result.errors,
                warnings: result.warnings,
                analysis
              },
              code: 'SESSION_REPAIR_FAILED'
            };
          
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'REPAIR_SERVICE_ERROR'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        body: repairSessionSchema,
        detail: 'Attempt to repair a corrupted session using various strategies'
      })

      // Get recovery statistics
      .get('/stats', async ({ set }) => {
        try {
          const stats = await sessionRecoveryService.getRecoveryStatistics();

          return {
            success: true,
            data: {
              ...stats,
              healthScore: calculateRecoveryHealthScore(stats),
              recommendations: generateSystemRecommendations(stats)
            },
            message: 'Recovery statistics retrieved successfully'
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'RECOVERY_STATS_FAILED'
          };
        }
      }, {
        detail: 'Get system-wide recovery statistics and health metrics'
      })

      // Validate session integrity without restoration
      .post('/validate/:sessionId', async ({ params, body, set }) => {
        try {
          const session = await sessionService.getSession(params.sessionId, body.encryptionKey);

          if (!session) {
            set.status = 404;
            return {
              success: false,
              error: 'Session not found',
              code: 'SESSION_NOT_FOUND'
            };
          }

          const validation = await sessionRecoveryService.validateSessionData(
            JSON.stringify(session.workspaceState),
            session.session.stateChecksum || '',
            body.encryptionKey
          );

          // Additional integrity checks
          const integrityChecks = await performIntegrityChecks(session.workspaceState);

          return {
            success: true,
            data: {
              validation,
              integrity: integrityChecks,
              sessionInfo: {
                id: session.session.id,
                name: session.session.name,
                lastSavedAt: session.session.lastSavedAt,
                checkpointCount: session.session.checkpointCount,
                totalSize: session.session.totalSize
              }
            },
            message: 'Session validation completed'
          };
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SESSION_VALIDATION_FAILED'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        body: t.Object({
          encryptionKey: t.Optional(t.String())
        }),
        detail: 'Validate session integrity without performing restoration'
      })

      // Emergency recovery (last resort)
      .post('/emergency/:sessionId', async ({ params, body, set }) => {
        try {
          // Emergency recovery tries all possible methods
          const emergencyOptions: SessionRecoveryOptions = {
            preserveMetadata: false, // Don't preserve potentially corrupted metadata
            skipCorruptedData: true,
            fallbackToPartial: true,
            preferLatestCheckpoint: true,
            maxDataLossThreshold: 50, // Allow up to 50% data loss in emergency
            fallbackToPartial: true
          };

          const result = await sessionRecoveryService.restoreSession(
            params.sessionId,
            body.encryptionKey,
            emergencyOptions
          );

          if (result.success) {
            return {
              success: true,
              data: {
                session: result.session,
                workspaceState: result.workspaceState,
                recoveryMethod: result.recoveryMethod,
                warnings: result.warnings,
                emergencyMode: true
              },
              warnings: [
                'Emergency recovery mode was used',
                'Some data may have been lost',
                ...result.warnings
              ],
              message: `Emergency recovery completed using ${result.recoveryMethod} method`
            };
          } 
            set.status = 422;
            return {
              success: false,
              error: 'Emergency recovery failed - session is beyond recovery',
              data: {
                errors: result.errors,
                lastResort: true
              },
              code: 'EMERGENCY_RECOVERY_FAILED'
            };
          
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'EMERGENCY_RECOVERY_ERROR'
          };
        }
      }, {
        params: t.Object({
          sessionId: t.String()
        }),
        body: t.Object({
          encryptionKey: t.Optional(t.String())
        }),
        detail: 'Emergency recovery attempt (last resort for critically corrupted sessions)'
      })
  )

  // Health check endpoint
  .get('/health', async () => {
    try {
      const stats = await sessionRecoveryService.getRecoveryStatistics();
      return {
        success: true,
        status: 'healthy',
        service: 'recovery-service',
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
        service: 'recovery-service',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

/**
 * Generate recovery recommendations based on validation results
 * @param analysis
 * @param hasCheckpoints
 */
function generateRecoveryRecommendations(
  analysis: any,
  hasCheckpoints: boolean
): string[] {
  const recommendations: string[] = [];

  if (analysis.isValid) {
    recommendations.push('Session data is valid - no recovery needed');
    return recommendations;
  }

  if (analysis.canRecover) {
    recommendations.push('Session can be recovered using automatic repair');

    if (hasCheckpoints) {
      recommendations.push('Consider restoring from the latest checkpoint for faster recovery');
    }

    if (analysis.checksumMatch) {
      recommendations.push('Checksum is valid - structure repair may be sufficient');
    } else {
      recommendations.push('Checksum mismatch detected - data corruption may be present');
    }
  } else {
    recommendations.push('Session appears to be critically corrupted');

    if (hasCheckpoints) {
      recommendations.push('Recovery only possible from checkpoints');
    } else {
      recommendations.push('No recovery options available - session may be lost');
    }
  }

  return recommendations;
}

/**
 * Calculate recovery health score
 * @param stats
 */
function calculateRecoveryHealthScore(stats: any): number {
  if (stats.totalSessions === 0) {
return 100;
}

  const corruptionRate = stats.corruptedSessions / stats.totalSessions;
  const recoverableRate = stats.recoverableSessions / Math.max(stats.corruptedSessions, 1);

  // Health score: 100 - (corruptionRate * 50) + (recoverableRate * 30)
  const healthScore = Math.max(0, Math.min(100,
    100 - (corruptionRate * 50) + (recoverableRate * 30)
  ));

  return Math.round(healthScore);
}

/**
 * Generate system-wide recommendations
 * @param stats
 */
function generateSystemRecommendations(stats: any): string[] {
  const recommendations: string[] = [];

  if (stats.totalSessions === 0) {
    recommendations.push('No sessions found - system is idle');
    return recommendations;
  }

  const corruptionRate = stats.corruptedSessions / stats.totalSessions;

  if (corruptionRate > 0.1) { // More than 10% corruption
    recommendations.push('High corruption rate detected - investigate storage integrity');
  }

  if (stats.availableCheckpoints < stats.corruptedSessions) {
    recommendations.push('Consider enabling automatic checkpointing for better recovery options');
  }

  if (stats.recoverableSessions < stats.corruptedSessions * 0.8) {
    recommendations.push('Many sessions may be unrecoverable - review backup strategy');
  }

  if (corruptionRate < 0.02) { // Less than 2% corruption
    recommendations.push('System health is good - current recovery strategy is effective');
  }

  return recommendations;
}

/**
 * Perform additional integrity checks on workspace state
 * @param workspaceState
 */
async function performIntegrityChecks(workspaceState: WorkspaceState): Promise<{
  structureValid: boolean;
  dataIntegrity: string[];
  warnings: string[];
}> {
  const warnings: string[] = [];
  const dataIntegrity: string[] = [];

  // Check basic structure
  const structureValid = (
    Array.isArray(workspaceState.terminalState) &&
    Array.isArray(workspaceState.browserTabs) &&
    Array.isArray(workspaceState.aiConversations) &&
    Array.isArray(workspaceState.openFiles)
  );

  if (!structureValid) {
    dataIntegrity.push('Basic workspace structure is invalid');
  }

  // Check for empty arrays (might indicate data loss)
  if (workspaceState.terminalState.length === 0) {
    warnings.push('No terminal state found - may indicate data loss');
  }

  if (workspaceState.browserTabs.length === 0) {
    warnings.push('No browser tabs found - may indicate data loss');
  }

  // Check for data consistency
  if (workspaceState.metadata && workspaceState.metadata.updatedAt) {
    const updateTime = new Date(workspaceState.metadata.updatedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 30) {
      warnings.push('Session data is more than 30 days old');
    }
  }

  return {
    structureValid,
    dataIntegrity,
    warnings
  };
}

export default recoveryRoutes;