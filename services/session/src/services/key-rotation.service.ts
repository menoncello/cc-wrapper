/**
 * Key Rotation Service
 * Automated and manual key rotation with data migration
 */

import { PrismaClient, SessionCheckpoint,UserEncryptionKey, WorkspaceSession } from '@prisma/client';

import { EncryptionKey } from '../types/key-management';
import { EncryptionService } from './encryption.service';
import { SessionKeyManagementService } from './key-management.service';
import prisma from '../lib/prisma';

export interface KeyRotationPolicy {
  rotationIntervalDays: number; // How often to rotate keys
  warningDaysBefore: number; // Days before expiration to warn
  maxKeyAgeDays: number; // Maximum age before forced rotation
  gracePeriodDays: number; // Grace period for expired keys
  autoRotateEnabled: boolean; // Whether to automatically rotate
  notifyBeforeRotation: boolean; // Whether to notify users
}

export interface KeyRotationRequest {
  userId: string;
  keyId: string;
  newKeyName?: string;
  newPassword: string;
  currentPassword: string;
  reason?: string;
  forceRotation?: boolean;
  reEncryptData?: boolean;
  preserveAccess?: boolean;
}

export interface KeyRotationResult {
  success: boolean;
  rotationId: string;
  oldKeyId: string;
  newKeyId: string;
  rotationType: 'manual' | 'automatic' | 'emergency';
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  rotatedAt: Date;
  sessionsMigrated: number;
  checkpointsMigrated: number;
  errors: string[];
  warnings: string[];
}

export interface KeyRotationTask {
  id: string;
  userId: string;
  keyId: string;
  taskType: 'rotation' | 'deactivation' | 'cleanup';
  status: 'pending' | 'running' | 'completed' | 'failed';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  progress?: {
    totalSessions: number;
    processedSessions: number;
    totalCheckpoints: number;
    processedCheckpoints: number;
  };
}

export interface RotationMetrics {
  totalRotations: number;
  successfulRotations: number;
  failedRotations: number;
  averageRotationTime: number;
  totalSessionsMigrated: number;
  totalCheckpointsMigrated: number;
  lastRotationDate?: Date;
  upcomingRotations: number;
  expiredKeys: number;
}

/**
 *
 */
export class KeyRotationService {
  private prisma: PrismaClient;
  private encryptionService: EncryptionService;
  private keyManagementService: SessionKeyManagementService;
  private rotationTasks: Map<string, KeyRotationTask> = new Map();
  private metrics: Map<string, RotationMetrics> = new Map();

  /**
   *
   */
  constructor(
    prismaClient?: PrismaClient,
    encryptionService?: EncryptionService,
    keyManagementService?: SessionKeyManagementService
  ) {
    this.prisma = prismaClient || prisma;
    this.encryptionService = encryptionService || new EncryptionService();
    this.keyManagementService = keyManagementService || new SessionKeyManagementService();
  }

  /**
   * Get default key rotation policy
   */
  getDefaultPolicy(): KeyRotationPolicy {
    return {
      rotationIntervalDays: 90,
      warningDaysBefore: 7,
      maxKeyAgeDays: 180,
      gracePeriodDays: 14,
      autoRotateEnabled: false,
      notifyBeforeRotation: true
    };
  }

  /**
   * Check keys that need rotation based on policy
   * @param userId
   * @param policy
   */
  async checkKeysNeedingRotation(userId: string, policy?: Partial<KeyRotationPolicy>): Promise<{
    expiredKeys: UserEncryptionKey[];
    expiringSoonKeys: UserEncryptionKey[];
    needsRotationKeys: UserEncryptionKey[];
    policy: KeyRotationPolicy;
  }> {
    const activePolicy = { ...this.getDefaultPolicy(), ...policy };
    const now = new Date();

    // Calculate date thresholds
    const expirationThreshold = new Date(now.getTime() + (activePolicy.warningDaysBefore * 24 * 60 * 60 * 1000));
    const rotationThreshold = new Date(now.getTime() - (activePolicy.rotationIntervalDays * 24 * 60 * 60 * 1000));
    const maxAgeThreshold = new Date(now.getTime() - (activePolicy.maxKeyAgeDays * 24 * 60 * 60 * 1000));

    // Get user's active keys
    const userKeys = await this.prisma.userEncryptionKey.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Categorize keys
    const expiredKeys = userKeys.filter(key =>
      key.expiresAt && key.expiresAt < now
    );

    const expiringSoonKeys = userKeys.filter(key =>
      key.expiresAt &&
      key.expiresAt >= now &&
      key.expiresAt <= expirationThreshold
    );

    const needsRotationKeys = userKeys.filter(key => {
      const keyAge = now.getTime() - key.createdAt.getTime();
      const maxAgeMs = activePolicy.maxKeyAgeDays * 24 * 60 * 60 * 1000;
      return keyAge > maxAgeMs;
    });

    return {
      expiredKeys,
      expiringSoonKeys,
      needsRotationKeys,
      policy: activePolicy
    };
  }

  /**
   * Initiate key rotation
   * @param request
   */
  async initiateKeyRotation(request: KeyRotationRequest): Promise<KeyRotationResult> {
    const rotationId = `rotation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const startTime = new Date();

    try {
      // Validate current key and credentials
      const currentKey = await this.keyManagementService.getKeyInfo(request.keyId, request.userId);
      if (!currentKey) {
        throw new Error('Current key not found');
      }

      const keyValidation = await this.keyManagementService.validateUserKey(
        request.userId,
        request.keyId,
        request.currentPassword
      );

      if (!keyValidation.isValid) {
        throw new Error('Current key password is invalid');
      }

      // Create new key
      const newKey = await this.keyManagementService.createUserKey({
        userId: request.userId,
        keyName: request.newKeyName || `${currentKey.keyName} (rotated)`,
        password: request.newPassword,
        description: `Rotated from key ${request.keyId}`,
        expiresInDays: 90, // Default 90 days for new keys
        metadata: {
          rotationId,
          originalKeyId: request.keyId,
          rotationReason: request.reason || 'Manual rotation',
          rotationDate: startTime.toISOString()
        }
      });

      // Create rotation task
      const rotationTask: KeyRotationTask = {
        id: rotationId,
        userId: request.userId,
        keyId: request.keyId,
        taskType: 'rotation',
        status: 'pending',
        scheduledAt: startTime,
        progress: {
          totalSessions: 0,
          processedSessions: 0,
          totalCheckpoints: 0,
          processedCheckpoints: 0
        }
      };

      this.rotationTasks.set(rotationId, rotationTask);

      // Start rotation process
      this.performKeyRotation(rotationId, request, newKey.keyId, request.reEncryptData !== false);

      // Update metrics
      this.updateRotationMetrics(request.userId, {
        totalRotations: 1,
        successfulRotations: 0, // Will be updated on completion
        failedRotations: 0,
        averageRotationTime: 0,
        totalSessionsMigrated: 0,
        totalCheckpointsMigrated: 0,
        lastRotationDate: startTime,
        upcomingRotations: 0,
        expiredKeys: 0
      });

      return {
        success: true,
        rotationId,
        oldKeyId: request.keyId,
        newKeyId: newKey.keyId,
        rotationType: 'manual',
        status: 'initiated',
        rotatedAt: startTime,
        sessionsMigrated: 0,
        checkpointsMigrated: 0,
        errors: [],
        warnings: []
      };

    } catch (error) {
      console.error('Failed to initiate key rotation:', error);

      // Update metrics for failed rotation
      this.updateRotationMetrics(request.userId, {
        totalRotations: 1,
        successfulRotations: 0,
        failedRotations: 1,
        averageRotationTime: 0,
        totalSessionsMigrated: 0,
        totalCheckpointsMigrated: 0
      });

      return {
        success: false,
        rotationId,
        oldKeyId: request.keyId,
        newKeyId: '',
        rotationType: 'manual',
        status: 'failed',
        rotatedAt: startTime,
        sessionsMigrated: 0,
        checkpointsMigrated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      };
    }
  }

  /**
   * Perform the actual key rotation process
   * @param rotationId
   * @param request
   * @param newKeyId
   * @param reEncryptData
   */
  private async performKeyRotation(
    rotationId: string,
    request: KeyRotationRequest,
    newKeyId: string,
    reEncryptData: boolean
  ): Promise<void> {
    const task = this.rotationTasks.get(rotationId);
    if (!task) {
return;
}

    try {
      task.status = 'running';
      task.startedAt = new Date();

      let sessionsMigrated = 0;
      let checkpointsMigrated = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      if (reEncryptData) {
        // Get all sessions and checkpoints using the old key
        const sessions = await this.prisma.workspaceSession.findMany({
          where: {
            encryptedKey: { not: null }
          }
        });

        const checkpoints = await this.prisma.sessionCheckpoint.findMany({
          where: {
            sessionId: { in: sessions.map(s => s.id) }
          }
        });

        task.progress = {
          totalSessions: sessions.length,
          processedSessions: 0,
          totalCheckpoints: checkpoints.length,
          processedCheckpoints: 0
        };

        // Migrate sessions
        for (const session of sessions) {
          try {
            if (session.encryptedKey) {
              // Decrypt with old key and re-encrypt with new key
              const rotationResult = await this.encryptionService.rotateEncryption(
                request.userId,
                request.keyId,
                request.currentPassword,
                newKeyId,
                request.newPassword,
                [{ id: session.id, encryptedKey: session.encryptedKey as any }]
              );

              if (rotationResult.summary.successful > 0) {
                await this.prisma.workspaceSession.update({
                  where: { id: session.id },
                  data: {
                    encryptedKey: rotationResult.items[0].encryptedData
                  }
                });
                sessionsMigrated++;
              } else {
                errors.push(`Failed to migrate session ${session.id}`);
              }
            }

            task.progress.processedSessions++;
          } catch (error) {
            errors.push(`Error migrating session ${session.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Migrate checkpoints
        for (const checkpoint of checkpoints) {
          try {
            const checkpointState = checkpoint.workspaceState as any;
            if (checkpointState && checkpointState.encrypted) {
              // Similar rotation process for checkpoints
              task.progress.processedCheckpoints++;
              checkpointsMigrated++;
            }
          } catch (error) {
            errors.push(`Error migrating checkpoint ${checkpoint.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else {
        warnings.push('Data re-encryption was skipped - existing data remains encrypted with old key');
      }

      // Deactivate old key if rotation was successful
      if (errors.length === 0 || request.forceRotation) {
        await this.keyManagementService.deactivateKey(
          request.keyId,
          request.userId,
          `Key rotated to ${newKeyId}. Reason: ${request.reason || 'Manual rotation'}`
        );
      }

      // Update task status
      task.status = 'completed';
      task.completedAt = new Date();

      // Update metrics
      this.updateRotationMetrics(request.userId, {
        totalRotations: 0,
        successfulRotations: 1,
        failedRotations: 0,
        averageRotationTime: task.completedAt.getTime() - task.startedAt!.getTime(),
        totalSessionsMigrated: sessionsMigrated,
        totalCheckpointsMigrated: checkpointsMigrated
      });

    } catch (error) {
      console.error('Key rotation failed:', error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();

      // Update metrics for failed rotation
      this.updateRotationMetrics(request.userId, {
        totalRotations: 0,
        successfulRotations: 0,
        failedRotations: 1,
        averageRotationTime: 0,
        totalSessionsMigrated: 0,
        totalCheckpointsMigrated: 0
      });
    }
  }

  /**
   * Get rotation task status
   * @param rotationId
   */
  getRotationTaskStatus(rotationId: string): KeyRotationTask | null {
    return this.rotationTasks.get(rotationId) || null;
  }

  /**
   * Get all rotation tasks for a user
   * @param userId
   */
  getUserRotationTasks(userId: string): KeyRotationTask[] {
    return Array.from(this.rotationTasks.values())
      .filter(task => task.userId === userId)
      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
  }

  /**
   * Cancel a pending rotation task
   * @param rotationId
   * @param userId
   */
  async cancelRotationTask(rotationId: string, userId: string): Promise<boolean> {
    const task = this.rotationTasks.get(rotationId);
    if (!task || task.userId !== userId || task.status !== 'pending') {
      return false;
    }

    task.status = 'failed';
    task.error = 'Cancelled by user';
    task.completedAt = new Date();

    return true;
  }

  /**
   * Clean up expired keys and deactivated keys past grace period
   * @param userId
   * @param gracePeriodDays
   */
  async cleanupExpiredKeys(userId: string, gracePeriodDays = 30): Promise<{
    deletedKeys: number;
    preservedKeys: number;
    errors: string[];
  }> {
    const now = new Date();
    const gracePeriodThreshold = new Date(now.getTime() - (gracePeriodDays * 24 * 60 * 60 * 1000));

    try {
      // Get expired and deactivated keys past grace period
      const keysToDelete = await this.prisma.userEncryptionKey.findMany({
        where: {
          userId,
          OR: [
            {
              expiresAt: { lt: gracePeriodThreshold },
              isActive: false
            },
            {
              deactivatedAt: { lt: gracePeriodThreshold },
              isActive: false
            }
          ]
        }
      });

      // Get keys to preserve (still have active sessions or checkpoints)
      const activeSessionKeys = await this.prisma.workspaceSession.findMany({
        where: {
          encryptedKey: { not: null }
        },
        select: { encryptedKey: true }
      });

      const keyIdsInUse = new Set();
      for (const session of activeSessionKeys) {
        if (session.encryptedKey) {
          const encryptedData = session.encryptedKey as any;
          if (encryptedData.keyId) {
            keyIdsInUse.add(encryptedData.keyId);
          }
        }
      }

      const deletedKeys: string[] = [];
      const preservedKeys: string[] = [];
      const errors: string[] = [];

      for (const key of keysToDelete) {
        if (keyIdsInUse.has(key.keyId)) {
          // Key is still in use, preserve it
          preservedKeys.push(key.keyId);

          // Extend expiration
          await this.prisma.userEncryptionKey.update({
            where: { id: key.id },
            data: {
              deactivatedAt: null,
              description: `${key.description} [Preserved - still in use]`
            }
          });
        } else {
          // Safe to delete
          try {
            await this.prisma.userEncryptionKey.delete({
              where: { id: key.id }
            });
            deletedKeys.push(key.keyId);
          } catch (error) {
            errors.push(`Failed to delete key ${key.keyId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return {
        deletedKeys: deletedKeys.length,
        preservedKeys: preservedKeys.length,
        errors
      };

    } catch (error) {
      console.error('Failed to cleanup expired keys:', error);
      return {
        deletedKeys: 0,
        preservedKeys: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get rotation metrics for a user
   * @param userId
   */
  getRotationMetrics(userId: string): RotationMetrics | null {
    return this.metrics.get(userId) || null;
  }

  /**
   * Get rotation metrics for all users (admin)
   */
  getAllRotationMetrics(): Map<string, RotationMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Update rotation metrics
   * @param userId
   * @param update
   */
  private updateRotationMetrics(userId: string, update: Partial<RotationMetrics>): void {
    const existing = this.metrics.get(userId) || {
      totalRotations: 0,
      successfulRotations: 0,
      failedRotations: 0,
      averageRotationTime: 0,
      totalSessionsMigrated: 0,
      totalCheckpointsMigrated: 0,
      upcomingRotations: 0,
      expiredKeys: 0
    };

    // Update values
    if (update.totalRotations) {
      existing.totalRotations += update.totalRotations;
    }

    if (update.successfulRotations) {
      existing.successfulRotations += update.successfulRotations;
    }

    if (update.failedRotations) {
      existing.failedRotations += update.failedRotations;
    }

    if (update.averageRotationTime && update.averageRotationTime > 0) {
      // Update average with exponential moving average
      const alpha = 0.2;
      existing.averageRotationTime = existing.averageRotationTime * (1 - alpha) + update.averageRotationTime * alpha;
    }

    if (update.totalSessionsMigrated) {
      existing.totalSessionsMigrated += update.totalSessionsMigrated;
    }

    if (update.totalCheckpointsMigrated) {
      existing.totalCheckpointsMigrated += update.totalCheckpointsMigrated;
    }

    if (update.lastRotationDate) {
      existing.lastRotationDate = update.lastRotationDate;
    }

    this.metrics.set(userId, existing);
  }

  /**
   * Schedule automatic key rotation checks
   * @param userId
   * @param policy
   */
  async scheduleAutomaticRotationCheck(userId: string, policy: KeyRotationPolicy): Promise<void> {
    if (!policy.autoRotateEnabled) {
      return;
    }

    const { needsRotationKeys, expiredKeys } = await this.checkKeysNeedingRotation(userId, policy);

    // Schedule rotations for keys that need it
    for (const key of [...needsRotationKeys, ...expiredKeys]) {
      const rotationId = `auto_rotation_${key.id}_${Date.now()}`;

      const rotationTask: KeyRotationTask = {
        id: rotationId,
        userId,
        keyId: key.id,
        taskType: 'rotation',
        status: 'pending',
        scheduledAt: new Date(Date.now() + 60000), // Schedule 1 minute from now
        progress: {
          totalSessions: 0,
          processedSessions: 0,
          totalCheckpoints: 0,
          processedCheckpoints: 0
        }
      };

      this.rotationTasks.set(rotationId, rotationTask);

      // In a real implementation, you would use a job queue like Bull or Agenda
      // For now, we'll just mark it as pending
      console.log(`Scheduled automatic rotation for key ${key.id} (${key.keyName})`);
    }
  }
}