// Session cleanup and maintenance service
// Handles retention policies, expired session cleanup, and storage optimization

import prisma from '../lib/prisma.js';
import type { SessionConfig } from '../types/session.js';

// Default retention periods (in days)
const DEFAULT_RETENTION_PERIODS = {
  autoSavedSessions: 30, // 30 days for automatic sessions
  checkpoints: 90, // 90 days for manual checkpoints
  inactiveSessions: 7 // 7 days for sessions that haven't been accessed
};

// Cleanup batch size for large datasets
const CLEANUP_BATCH_SIZE = 1000;

/**
 * Session cleanup service class
 */
export class SessionCleanupService {
  private retentionPeriods: typeof DEFAULT_RETENTION_PERIODS;

  /**
   *
   * @param retentionPeriods
   */
  constructor(retentionPeriods?: Partial<typeof DEFAULT_RETENTION_PERIODS>) {
    this.retentionPeriods = {
      ...DEFAULT_RETENTION_PERIODS,
      ...retentionPeriods
    };
  }

  /**
   * Clean up expired sessions based on retention policies
   */
  async cleanupExpiredSessions(): Promise<{
    autoSavedDeleted: number;
    checkpointsDeleted: number;
    inactiveDeleted: number;
    totalSessionsDeleted: number;
    spaceFreed: number;
  }> {
    try {
      const results = {
        autoSavedDeleted: 0,
        checkpointsDeleted: 0,
        inactiveDeleted: 0,
        totalSessionsDeleted: 0,
        spaceFreed: 0
      };

      // Clean up expired auto-saved sessions
      const autoSavedResult = await this.cleanupExpiredAutoSavedSessions();
      results.autoSavedDeleted = autoSavedResult.deleted;
      results.spaceFreed += autoSavedResult.spaceFreed;

      // Clean up old checkpoints
      const checkpointsResult = await this.cleanupOldCheckpoints();
      results.checkpointsDeleted = checkpointsResult.deleted;
      results.spaceFreed += checkpointsResult.spaceFreed;

      // Clean up inactive sessions
      const inactiveResult = await this.cleanupInactiveSessions();
      results.inactiveDeleted = inactiveResult.deleted;
      results.spaceFreed += inactiveResult.spaceFreed;

      // Update totals
      results.totalSessionsDeleted = results.autoSavedDeleted + results.inactiveDeleted;

      return results;
    } catch (error) {
      throw new Error(`Session cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired auto-saved sessions
   */
  private async cleanupExpiredAutoSavedSessions(): Promise<{ deleted: number; spaceFreed: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPeriods.autoSavedSessions);

    // Get sessions that will be deleted for space calculation
    const sessionsToDelete = await prisma.workspaceSession.findMany({
      where: {
        expiresAt: {
          lt: cutoffDate
        },
        isActive: false // Only inactive sessions
      },
      select: {
        id: true,
        totalSize: true
      }
    });

    const spaceToFree = sessionsToDelete.reduce((total, session) => total + (session.totalSize || 0), 0);

    // Delete sessions in batches
    let deleted = 0;
    for (let i = 0; i < sessionsToDelete.length; i += CLEANUP_BATCH_SIZE) {
      const batch = sessionsToDelete.slice(i, i + CLEANUP_BATCH_SIZE);
      const batchIds = batch.map(session => session.id);

      const result = await prisma.workspaceSession.deleteMany({
        where: {
          id: { in: batchIds }
        }
      });

      deleted += result.count;
    }

    return { deleted, spaceFreed: spaceToFree };
  }

  /**
   * Clean up old checkpoints beyond retention period
   */
  private async cleanupOldCheckpoints(): Promise<{ deleted: number; spaceFreed: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPeriods.checkpoints);

    // Get checkpoints that will be deleted for space calculation
    const checkpointsToDelete = await prisma.sessionCheckpoint.findMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      },
      select: {
        id: true,
        compressedSize: true
      }
    });

    const spaceToFree = checkpointsToDelete.reduce((total, checkpoint) => total + (checkpoint.compressedSize || 0), 0);

    // Delete checkpoints in batches
    let deleted = 0;
    for (let i = 0; i < checkpointsToDelete.length; i += CLEANUP_BATCH_SIZE) {
      const batch = checkpointsToDelete.slice(i, i + CLEANUP_BATCH_SIZE);
      const batchIds = batch.map(checkpoint => checkpoint.id);

      const result = await prisma.sessionCheckpoint.deleteMany({
        where: {
          id: { in: batchIds }
        }
      });

      deleted += result.count;
    }

    // Update checkpoint counts for affected sessions
    await this.updateCheckpointCounts();

    return { deleted, spaceFreed: spaceToFree };
  }

  /**
   * Clean up inactive sessions (not accessed recently)
   */
  private async cleanupInactiveSessions(): Promise<{ deleted: number; spaceFreed: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPeriods.inactiveSessions);

    // Get inactive sessions
    const inactiveSessions = await prisma.sessionMetadata.findMany({
      where: {
        lastSavedAt: {
          lt: cutoffDate
        },
        isActive: false
      },
      include: {
        session: {
          select: {
            totalSize: true
          }
        }
      }
    });

    const spaceToFree = inactiveSessions.reduce((total, metadata) =>
      total + (metadata.session?.totalSize || 0), 0
    );

    // Delete inactive sessions in batches
    let deleted = 0;
    for (let i = 0; i < inactiveSessions.length; i += CLEANUP_BATCH_SIZE) {
      const batch = inactiveSessions.slice(i, i + CLEANUP_BATCH_SIZE);
      const batchIds = batch.map(metadata => metadata.sessionId);

      const result = await prisma.workspaceSession.deleteMany({
        where: {
          id: { in: batchIds }
        }
      });

      deleted += result.count;
    }

    return { deleted, spaceFreed: spaceToFree };
  }

  /**
   * Update checkpoint counts after cleanup
   */
  private async updateCheckpointCounts(): Promise<void> {
    // Get all sessions and their current checkpoint counts
    const sessions = await prisma.workspaceSession.findMany({
      select: { id: true }
    });

    for (const session of sessions) {
      const checkpointCount = await prisma.sessionCheckpoint.count({
        where: { sessionId: session.id }
      });

      await prisma.sessionMetadata.update({
        where: { sessionId: session.id },
        data: { checkpointCount }
      });
    }
  }

  /**
   * Get cleanup statistics and recommendations
   */
  async getCleanupStatistics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    oldCheckpoints: number;
    estimatedSpaceToFree: number;
    recommendations: string[];
  }> {
    const now = new Date();
    const autoSavedCutoff = new Date(now);
    autoSavedCutoff.setDate(autoSavedCutoff.getDate() - this.retentionPeriods.autoSavedSessions);

    const checkpointCutoff = new Date(now);
    checkpointCutoff.setDate(checkpointCutoff.getDate() - this.retentionPeriods.checkpoints);

    const inactiveCutoff = new Date(now);
    inactiveCutoff.setDate(inactiveCutoff.getDate() - this.retentionPeriods.inactiveSessions);

    const [
      totalSessions,
      activeSessions,
      expiredSessions,
      oldCheckpoints
    ] = await Promise.all([
      prisma.workspaceSession.count(),
      prisma.workspaceSession.count({ where: { isActive: true } }),
      prisma.workspaceSession.count({
        where: {
          OR: [
            { expiresAt: { lt: autoSavedCutoff } },
            {
              lastSavedAt: { lt: inactiveCutoff },
              isActive: false
            }
          ]
        }
      }),
      prisma.sessionCheckpoint.count({
        where: { createdAt: { lt: checkpointCutoff } }
      })
    ]);

    // Estimate space to free (rough estimation)
    const avgSessionSize = 1024 * 1024; // 1MB average
    const avgCheckpointSize = 512 * 1024; // 512KB average
    const estimatedSpaceToFree = (expiredSessions * avgSessionSize) + (oldCheckpoints * avgCheckpointSize);

    // Generate recommendations
    const recommendations: string[] = [];

    if (expiredSessions > 100) {
      recommendations.push(`Consider reducing auto-save retention from ${this.retentionPeriods.autoSavedSessions} days to reduce storage costs`);
    }

    if (oldCheckpoints > 500) {
      recommendations.push(`Consider reducing checkpoint retention from ${this.retentionPeriods.checkpoints} days to optimize storage`);
    }

    if (activeSessions > totalSessions * 0.8) {
      recommendations.push('Many sessions are marked as active. Consider reviewing session lifecycle management');
    }

    return {
      totalSessions,
      activeSessions,
      expiredSessions,
      oldCheckpoints,
      estimatedSpaceToFree,
      recommendations
    };
  }

  /**
   * Update user session configuration
   * @param userId
   * @param config
   */
  async updateUserSessionConfig(
    userId: string,
    config: Partial<SessionConfig>
  ): Promise<void> {
    try {
      await prisma.sessionConfig.update({
        where: { userId },
        data: {
          autoSaveInterval: config.autoSaveInterval,
          retentionDays: config.retentionDays,
          checkpointRetention: config.checkpointRetention,
          maxSessionSize: config.maxSessionSize,
          compressionEnabled: config.compressionEnabled,
          encryptionEnabled: config.encryptionEnabled
        }
      });
    } catch (error) {
      throw new Error(`Failed to update session config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user session configuration
   * @param userId
   */
  async getUserSessionConfig(userId: string): Promise<SessionConfig> {
    try {
      const config = await prisma.sessionConfig.findUnique({
        where: { userId }
      });

      if (!config) {
        throw new Error('Session configuration not found for user');
      }

      return {
        autoSaveInterval: config.autoSaveInterval,
        retentionDays: config.retentionDays,
        checkpointRetention: config.checkpointRetention,
        maxSessionSize: config.maxSessionSize,
        compressionEnabled: config.compressionEnabled,
        encryptionEnabled: config.encryptionEnabled
      };
    } catch (error) {
      throw new Error(`Failed to get session config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Force cleanup for a specific user (admin function)
   * @param userId
   */
  async forceCleanupUserSessions(userId: string): Promise<{
    sessionsDeleted: number;
    checkpointsDeleted: number;
    spaceFreed: number;
  }> {
    try {
      // Get all sessions and checkpoints for the user
      const [userSessions, userCheckpoints] = await Promise.all([
        prisma.workspaceSession.findMany({
          where: { userId },
          select: { id: true, totalSize: true }
        }),
        prisma.sessionCheckpoint.findMany({
          where: {
            session: {
              userId
            }
          },
          select: { id: true, compressedSize: true }
        })
      ]);

      const sessionIds = userSessions.map(s => s.id);
      const checkpointIds = userCheckpoints.map(c => c.id);

      // Calculate space to free
      const sessionSpaceToFree = userSessions.reduce((total, session) => total + (session.totalSize || 0), 0);
      const checkpointSpaceToFree = userCheckpoints.reduce((total, checkpoint) => total + (checkpoint.compressedSize || 0), 0);
      const totalSpaceFreed = sessionSpaceToFree + checkpointSpaceToFree;

      // Delete checkpoints first (foreign key constraint)
      const checkpointsDeleted = await prisma.sessionCheckpoint.deleteMany({
        where: {
          sessionId: { in: sessionIds }
        }
      });

      // Delete sessions
      const sessionsDeleted = await prisma.workspaceSession.deleteMany({
        where: {
          id: { in: sessionIds }
        }
      });

      return {
        sessionsDeleted: sessionsDeleted.count,
        checkpointsDeleted: checkpointsDeleted.count,
        spaceFreed: totalSpaceFreed
      };
    } catch (error) {
      throw new Error(`Failed to cleanup user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current retention periods
   */
  getRetentionPeriods(): typeof this.retentionPeriods {
    return { ...this.retentionPeriods };
  }
}

/**
 * Default cleanup service instance
 */
export const sessionCleanupService = new SessionCleanupService();

/**
 * Create a new cleanup service instance with custom retention periods
 * @param retentionPeriods
 */
export function createSessionCleanupService(
  retentionPeriods?: Partial<typeof DEFAULT_RETENTION_PERIODS>
): SessionCleanupService {
  return new SessionCleanupService(retentionPeriods);
}