// Main session service for workspace persistence and recovery
// Handles session creation, updates, checkpointing, and cleanup

import type {
  CheckpointResponse,
  CreateCheckpointRequest,
  CreateSessionRequest,
  SessionConfig,
  SessionListResponse,
  SessionResponse,
  UpdateSessionRequest,
  WorkspaceState
} from '@cc-wrapper/shared-types';

import prisma from '../lib/prisma.js';
import { createSerializer,SessionStateSerializer } from '../lib/state-serializer.js';

// Default session configuration
const DEFAULT_SESSION_CONFIG: SessionConfig = {
  autoSaveInterval: 30, // 30 seconds
  retentionDays: 30, // 30 days for auto-saved sessions
  checkpointRetention: 90, // 90 days for checkpoints
  maxSessionSize: 50 * 1024 * 1024, // 50MB
  compressionEnabled: true,
  encryptionEnabled: true
};

/**
 * Session service class
 */
export class SessionService {
  private serializer: SessionStateSerializer;

  /**
   *
   * @param config
   */
  constructor(config?: Partial<SessionConfig>) {
    this.serializer = createSerializer(config);
  }

  /**
   * Create a new workspace session
   * @param request
   * @param encryptionKey
   */
  async createSession(
    request: CreateSessionRequest,
    encryptionKey?: string
  ): Promise<SessionResponse> {
    try {
      // Serialize workspace state
      const serializedState = await this.serializer.serializeState(
        request.workspaceState,
        encryptionKey
      );

      // Set expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + DEFAULT_SESSION_CONFIG.retentionDays);

      // Create session and metadata in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create workspace session
        const session = await tx.workspaceSession.create({
          data: {
            userId: request.userId,
            workspaceId: request.workspaceId,
            name: request.name,
            workspaceState: serializedState.data as any, // JSONB type
            stateChecksum: serializedState.checksum,
            encryptedKey: encryptionKey ? 'encrypted' : null, // We don't store the actual key
            compression: serializedState.compressed ? 'gzip' : 'none',
            version: 1,
            isActive: true,
            lastSavedAt: new Date(),
            expiresAt
          }
        });

        // Create metadata record
        await tx.sessionMetadata.create({
          data: {
            sessionId: session.id,
            userId: request.userId,
            workspaceId: request.workspaceId,
            sessionName: request.name,
            lastSavedAt: session.lastSavedAt,
            checkpointCount: 0,
            totalSize: serializedState.size,
            isActive: true,
            createdAt: session.createdAt
          }
        });

        // Create or update user session config
        await tx.sessionConfig.upsert({
          where: { userId: request.userId },
          update: {},
          create: {
            userId: request.userId,
            autoSaveInterval: DEFAULT_SESSION_CONFIG.autoSaveInterval,
            retentionDays: DEFAULT_SESSION_CONFIG.retentionDays,
            checkpointRetention: DEFAULT_SESSION_CONFIG.checkpointRetention,
            maxSessionSize: DEFAULT_SESSION_CONFIG.maxSessionSize,
            compressionEnabled: DEFAULT_SESSION_CONFIG.compressionEnabled,
            encryptionEnabled: DEFAULT_SESSION_CONFIG.encryptionEnabled
          }
        });

        return session;
      });

      // Deactivate other sessions for this user
      await prisma.workspaceSession.updateMany({
        where: {
          userId: request.userId,
          id: { not: result.id },
          isActive: true
        },
        data: { isActive: false }
      });

      return this.mapToSessionResponse(result, serializedState.size, 0);
    } catch (error) {
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update existing session with new workspace state
   * @param sessionId
   * @param request
   * @param encryptionKey
   */
  async updateSession(
    sessionId: string,
    request: UpdateSessionRequest,
    encryptionKey?: string
  ): Promise<SessionResponse> {
    try {
      // Get existing session
      const existingSession = await prisma.workspaceSession.findUnique({
        where: { id: sessionId },
        include: {
          checkpoints: true
        }
      });

      if (!existingSession) {
        throw new Error('Session not found');
      }

      // Serialize incremental state
      const serializedState = await this.serializer.serializeIncrementalState(
        request.workspaceState,
        encryptionKey
      );

      // Update session
      const updatedSession = await prisma.workspaceSession.update({
        where: { id: sessionId },
        data: {
          workspaceState: serializedState.data as any, // JSONB type
          stateChecksum: serializedState.checksum,
          compression: serializedState.compressed ? 'gzip' : 'none',
          lastSavedAt: new Date()
        }
      });

      // Update metadata
      await prisma.sessionMetadata.update({
        where: { sessionId },
        data: {
          lastSavedAt: updatedSession.lastSavedAt,
          totalSize: serializedState.size,
          checkpointCount: existingSession.checkpoints.length
        }
      });

      return this.mapToSessionResponse(
        updatedSession,
        serializedState.size,
        existingSession.checkpoints.length
      );
    } catch (error) {
      throw new Error(`Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get session by ID
   * @param sessionId
   * @param encryptionKey
   */
  async getSession(
    sessionId: string,
    encryptionKey?: string
  ): Promise<{ session: SessionResponse; workspaceState: WorkspaceState }> {
    try {
      const session = await prisma.workspaceSession.findUnique({
        where: { id: sessionId },
        include: {
          checkpoints: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // Deserialize workspace state
      const workspaceState = await this.serializer.deserializeState(
        session.workspaceState as any,
        session.stateChecksum,
        encryptionKey
      );

      return {
        session: this.mapToSessionResponse(session, 0, session.checkpoints.length),
        workspaceState
      };
    } catch (error) {
      throw new Error(`Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List sessions for a user
   * @param userId
   * @param options
   * @param options.workspaceId
   * @param options.isActive
   * @param options.page
   * @param options.pageSize
   */
  async listSessions(
    userId: string,
    options: {
      workspaceId?: string;
      isActive?: boolean;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<SessionListResponse> {
    try {
      const { workspaceId, isActive, page = 1, pageSize = 20 } = options;
      const offset = (page - 1) * pageSize;

      const whereClause: any = { userId };
      if (workspaceId) {
whereClause.workspaceId = workspaceId;
}
      if (isActive !== undefined) {
whereClause.isActive = isActive;
}

      const [sessions, total] = await Promise.all([
        prisma.workspaceSession.findMany({
          where: whereClause,
          include: {
            checkpoints: {
              select: { id: true }
            }
          },
          orderBy: { lastSavedAt: 'desc' },
          skip: offset,
          take: pageSize
        }),
        prisma.workspaceSession.count({ where: whereClause })
      ]);

      const sessionResponses = sessions.map(session =>
        this.mapToSessionResponse(session, 0, session.checkpoints.length)
      );

      return {
        sessions: sessionResponses,
        total,
        page,
        pageSize
      };
    } catch (error) {
      throw new Error(`Failed to list sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a manual checkpoint
   * @param request
   * @param encryptionKey
   */
  async createCheckpoint(
    request: CreateCheckpointRequest,
    encryptionKey?: string
  ): Promise<CheckpointResponse> {
    try {
      // Get session to extract current state
      const session = await prisma.workspaceSession.findUnique({
        where: { id: request.sessionId }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // Deserialize current state to create checkpoint
      const workspaceState = await this.serializer.deserializeState(
        session.workspaceState as any,
        session.stateChecksum,
        encryptionKey
      );

      // Serialize state for checkpoint (always full state for checkpoints)
      const serializedState = await this.serializer.serializeState(workspaceState, encryptionKey);

      // Create checkpoint
      const checkpoint = await prisma.sessionCheckpoint.create({
        data: {
          sessionId: request.sessionId,
          name: request.name,
          description: request.description,
          workspaceState: serializedState.data as any, // JSONB type
          stateChecksum: serializedState.checksum,
          compressedSize: serializedState.size,
          uncompressedSize: Buffer.byteLength(JSON.stringify(workspaceState), 'utf8')
        }
      });

      // Update metadata checkpoint count
      await prisma.sessionMetadata.update({
        where: { sessionId: request.sessionId },
        data: {
          checkpointCount: {
            increment: 1
          }
        }
      });

      return {
        id: checkpoint.id,
        sessionId: checkpoint.sessionId,
        name: checkpoint.name,
        description: checkpoint.description,
        compressedSize: checkpoint.compressedSize,
        uncompressedSize: checkpoint.uncompressedSize,
        createdAt: checkpoint.createdAt
      };
    } catch (error) {
      throw new Error(`Failed to create checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get session checkpoints
   * @param sessionId
   */
  async getCheckpoints(sessionId: string): Promise<CheckpointResponse[]> {
    try {
      const checkpoints = await prisma.sessionCheckpoint.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' }
      });

      return checkpoints.map(checkpoint => ({
        id: checkpoint.id,
        sessionId: checkpoint.sessionId,
        name: checkpoint.name,
        description: checkpoint.description,
        compressedSize: checkpoint.compressedSize,
        uncompressedSize: checkpoint.uncompressedSize,
        createdAt: checkpoint.createdAt
      }));
    } catch (error) {
      throw new Error(`Failed to get checkpoints: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete session and all associated data
   * @param sessionId
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await prisma.workspaceSession.delete({
        where: { id: sessionId }
      });

      // Cascading deletes will handle:
      // - session_checkpoints
      // - session_metadata
    } catch (error) {
      throw new Error(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.workspaceSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      return result.count;
    } catch (error) {
      throw new Error(`Failed to cleanup expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map Prisma session to response format
   * @param session
   * @param totalSize
   * @param checkpointCount
   */
  private mapToSessionResponse(
    session: any,
    totalSize: number,
    checkpointCount: number
  ): SessionResponse {
    return {
      id: session.id,
      userId: session.userId,
      workspaceId: session.workspaceId,
      name: session.name,
      isActive: session.isActive,
      lastSavedAt: session.lastSavedAt,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      checkpointCount,
      totalSize
    };
  }
}

/**
 * Default session service instance
 */
export const sessionService = new SessionService();

/**
 * Create a new session service instance with custom configuration
 * @param config
 */
export function createSessionService(config?: Partial<SessionConfig>): SessionService {
  return new SessionService(config);
}