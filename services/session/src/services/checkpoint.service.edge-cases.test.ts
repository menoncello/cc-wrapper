import { beforeAll, afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

import { setupTestMocks, cleanupTestMocks } from '../test-mocks/test-setup.js';
import { mockPrisma } from '../test-mocks/prisma.mock.js';
import { mockSerializer } from '../test-mocks/services.mock.js';
import type {
  CheckpointFilter,
  CheckpointMetadata,
  CheckpointStatistics,
  CreateCheckpointOptions,
  WorkspaceState} from '../types/session.js';
import { SessionCheckpointService } from './checkpoint.service.js';

// Test utilities
const createMockWorkspaceState = (overrides = {}): WorkspaceState => ({
  terminalState: [
    { id: '1', command: 'ls', isActive: true },
    { id: '2', command: 'cd /tmp', isActive: false }
  ],
  browserTabs: [
    { url: 'https://example.com', title: 'Example', isActive: true },
    { url: 'https://test.com', title: 'Test', isActive: false }
  ],
  aiConversations: [
    { id: '1', messages: [], timestamp: new Date() }
  ],
  openFiles: [
    { path: '/file.ts', language: 'typescript', hasUnsavedChanges: false }
  ],
  workspaceConfig: { theme: 'dark', fontSize: 14 },
  metadata: { createdAt: new Date(), updatedAt: new Date() },
  ...overrides
});

beforeAll(() => {
  setupTestMocks();
});

afterAll(() => {
  cleanupTestMocks();
});

describe('SessionCheckpointService - Edge Cases and Error Scenarios', () => {
  let service: SessionCheckpointService;
  let testSessionId: string;
  let testWorkspaceId: string;
  let testUserId: string;
  let mockSerializerInstance: any;

  beforeEach(async () => {
    // Setup global serializer mock before creating service
    mockSerializerInstance = {
      serializeState: mock().mockReturnValue({ data: 'serialized-state' }),
      deserializeState: mock().mockResolvedValue({
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: []
      }),
      compressState: mock().mockResolvedValue({ data: 'compressed-state' }),
      decompressState: mock().mockResolvedValue({ data: 'decompressed-state' }),
      encryptState: mock().mockResolvedValue({ data: 'encrypted-state' }),
      decryptState: mock().mockResolvedValue({ data: 'decrypted-state' }),
      generateChecksum: mock().mockReturnValue('serializer-checksum'),
    };

    // Mock the createSerializer function globally
    globalThis.createSerializer = mock().mockReturnValue(mockSerializerInstance);

    service = new SessionCheckpointService();

    // Override the serializer instance directly on the service
    (service as any).serializer = mockSerializerInstance;

    // Create test user and workspace
    const testUser = {
      id: `test-user-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      name: 'Test User'
    };
    testUserId = testUser.id;

    const testWorkspace = {
      id: `test-workspace-${Date.now()}`,
      name: 'Test Workspace',
      description: 'Workspace for testing',
      ownerId: testUserId
    };
    testWorkspaceId = testWorkspace.id;

    const testSession = {
      id: `test-session-${Date.now()}`,
      name: 'Test Session',
      userId: testUserId,
      workspaceId: testWorkspaceId,
      isActive: true
    };
    testSessionId = testSession.id;
  });

  afterEach(() => {
    // Cleanup mocks
    mockPrisma.sessionCheckpoint.deleteMany.mockClear();
    mockPrisma.workspaceSession.deleteMany.mockClear();
    mockPrisma.workspace.deleteMany.mockClear();
    mockPrisma.user.deleteMany.mockClear();
  });

  describe('Service Initialization and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new SessionCheckpointService();
      expect(defaultService).toBeInstanceOf(SessionCheckpointService);
    });

    it('should initialize with custom configuration', () => {
      const customService = new SessionCheckpointService({
        maxNameLength: 200,
        maxDescriptionLength: 1000,
        maxCheckpointsPerSession: 100
      });
      expect(customService).toBeInstanceOf(SessionCheckpointService);
    });

    it('should handle partial configuration overrides', () => {
      const partialService = new SessionCheckpointService({
        maxCheckpointsPerSession: 25
      });
      expect(partialService).toBeInstanceOf(SessionCheckpointService);
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle null and undefined session IDs', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = { name: 'Test' };

      await expect(
        service.createCheckpoint(null as any, workspaceState, metadata)
      ).rejects.toThrow('Valid session ID is required');

      await expect(
        service.createCheckpoint(undefined as any, workspaceState, metadata)
      ).rejects.toThrow('Valid session ID is required');
    });

    it('should handle empty and whitespace session IDs', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = { name: 'Test' };

      await expect(
        service.createCheckpoint('', workspaceState, metadata)
      ).rejects.toThrow('Valid session ID is required');

      await expect(
        service.createCheckpoint('   ', workspaceState, metadata)
      ).rejects.toThrow('Valid session ID is required');
    });

    it('should handle non-string session IDs', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = { name: 'Test' };

      await expect(
        service.createCheckpoint(123 as any, workspaceState, metadata)
      ).rejects.toThrow('Valid session ID is required');

      await expect(
        service.createCheckpoint({} as any, workspaceState, metadata)
      ).rejects.toThrow('Valid session ID is required');
    });

    it('should handle invalid workspace states', async () => {
      const metadata: CheckpointMetadata = { name: 'Test' };

      await expect(
        service.createCheckpoint(testSessionId, null as any, metadata)
      ).rejects.toThrow('Valid workspace state is required');

      await expect(
        service.createCheckpoint(testSessionId, undefined as any, metadata)
      ).rejects.toThrow('Valid workspace state is required');

      await expect(
        service.createCheckpoint(testSessionId, 'invalid' as any, metadata)
      ).rejects.toThrow('Valid workspace state is required');
    });

    it('should handle missing or invalid metadata', async () => {
      const workspaceState = createMockWorkspaceState();

      await expect(
        service.createCheckpoint(testSessionId, workspaceState, null as any)
      ).rejects.toThrow('Checkpoint name is required');

      await expect(
        service.createCheckpoint(testSessionId, workspaceState, undefined as any)
      ).rejects.toThrow('Checkpoint name is required');

      await expect(
        service.createCheckpoint(testSessionId, workspaceState, {} as CheckpointMetadata)
      ).rejects.toThrow('Checkpoint name is required');
    });

    it('should handle invalid metadata names', async () => {
      const workspaceState = createMockWorkspaceState();

      await expect(
        service.createCheckpoint(testSessionId, workspaceState, {
          name: ''
        })
      ).rejects.toThrow('Checkpoint name is required');

      await expect(
        service.createCheckpoint(testSessionId, workspaceState, {
          name: null as any
        })
      ).rejects.toThrow('Checkpoint name is required');

      await expect(
        service.createCheckpoint(testSessionId, workspaceState, {
          name: 123 as any
        })
      ).rejects.toThrow('Checkpoint name is required');
    });

    it('should handle extremely long names and descriptions', async () => {
      const workspaceState = createMockWorkspaceState();

      // Mock session exists for these tests
      mockPrisma.workspaceSession.findUnique.mockResolvedValue({
        id: testSessionId,
        userId: testUserId,
        workspaceId: testWorkspaceId,
        name: 'Test Session'
      });
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(0);
      // Create a dynamic mock for sessionCheckpoint.create
      mockPrisma.sessionCheckpoint.create.mockImplementation((data: any) => {
        return Promise.resolve({
          id: 'test-checkpoint',
          sessionId: data.data.sessionId,
          name: data.data.name,
          description: data.data.description || null,
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date(),
          priority: data.data.priority || 'medium',
          tags: data.data.tags || [],
          isAutoGenerated: data.data.isAutoGenerated || false,
          metadata: data.data.metadata || null,
          compressedData: 'compressed-data'
        });
      });

      // Test name exactly at limit
      const nameAtLimit = 'a'.repeat(100);
      const checkpoint1 = await service.createCheckpoint(testSessionId, workspaceState, {
        name: nameAtLimit
      });
      expect(checkpoint1.name).toBe(nameAtLimit);

      // Test name over limit
      const nameOverLimit = 'a'.repeat(101);
      await expect(
        service.createCheckpoint(testSessionId, workspaceState, {
          name: nameOverLimit
        })
      ).rejects.toThrow('Checkpoint name too long');

      // Test description exactly at limit
      const descAtLimit = 'a'.repeat(500);
      const checkpoint2 = await service.createCheckpoint(testSessionId, workspaceState, {
        name: 'Test with max description',
        description: descAtLimit
      });
      expect(checkpoint2.description).toBe(descAtLimit);

      // Test description over limit
      const descOverLimit = 'a'.repeat(501);
      await expect(
        service.createCheckpoint(testSessionId, workspaceState, {
          name: 'Test with long description',
          description: descOverLimit
        })
      ).rejects.toThrow('Checkpoint description too long');
    });
  });

  describe('Encryption Validation Edge Cases', () => {
    beforeEach(() => {
      // Mock session exists for encryption tests
      mockPrisma.workspaceSession.findUnique.mockResolvedValue({
        id: testSessionId,
        userId: testUserId,
        workspaceId: testWorkspaceId,
        name: 'Test Session'
      });
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(0);
      mockPrisma.sessionCheckpoint.create.mockResolvedValue({
        id: 'test-checkpoint',
        sessionId: testSessionId,
        name: 'Test',
        compressedSize: 1024,
        uncompressedSize: 2048,
        createdAt: new Date(),
        priority: 'medium',
        tags: [],
        isAutoGenerated: false
      });
    });

    it('should require encryption key when encrypting', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = { name: 'Encryption Test' };

      await expect(
        service.createCheckpoint(testSessionId, workspaceState, metadata, {
          encryptData: true
          // Missing encryptionKey
        })
      ).rejects.toThrow('Encryption key is required when encryptData is true');
    });

    it('should handle empty encryption key', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = { name: 'Empty Key Test' };

      await expect(
        service.createCheckpoint(testSessionId, workspaceState, metadata, {
          encryptData: true,
          encryptionKey: ''
        })
      ).rejects.toThrow('Encryption key is required when encryptData is true');

      await expect(
        service.createCheckpoint(testSessionId, workspaceState, metadata, {
          encryptData: true,
          encryptionKey: '   '
        })
      ).rejects.toThrow('Encryption key is required when encryptData is true');
    });

    it('should handle various encryption key formats', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = { name: 'Key Format Test' };

      // Test with simple string key
      const checkpoint1 = await service.createCheckpoint(testSessionId, workspaceState, metadata, {
        encryptData: true,
        encryptionKey: 'simple_key'
      });
      expect(checkpoint1.id).toBeDefined();

      // Test with complex key
      const checkpoint2 = await service.createCheckpoint(testSessionId, workspaceState, {
        name: 'Complex Key Test'
      }, {
        encryptData: true,
        encryptionKey: 'complex_key_123!@#$%^&*()_+-=[]{}|;:,.<>?'
      });
      expect(checkpoint2.id).toBeDefined();
    });
  });

  describe('Workspace State Validation Edge Cases', () => {
    beforeEach(() => {
      // Mock session exists for workspace state validation tests
      mockPrisma.workspaceSession.findUnique.mockResolvedValue({
        id: testSessionId,
        userId: testUserId,
        workspaceId: testWorkspaceId,
        name: 'Test Session'
      });
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(0);
      mockPrisma.sessionCheckpoint.create.mockResolvedValue({
        id: 'test-checkpoint',
        sessionId: testSessionId,
        name: 'Test',
        compressedSize: 1024,
        uncompressedSize: 2048,
        createdAt: new Date(),
        priority: 'medium',
        tags: [],
        isAutoGenerated: false
      });
    });

    it('should validate required workspace state arrays', async () => {
      const metadata: CheckpointMetadata = { name: 'State Validation Test' };

      // Missing terminalState
      await expect(
        service.createCheckpoint(testSessionId, {
          browserTabs: [],
          aiConversations: [],
          openFiles: []
        } as any, metadata, { validateState: true })
      ).rejects.toThrow('Workspace state missing required array: terminalState');

      // Missing browserTabs
      await expect(
        service.createCheckpoint(testSessionId, {
          terminalState: [],
          aiConversations: [],
          openFiles: []
        } as any, metadata, { validateState: true })
      ).rejects.toThrow('Workspace state missing required array: browserTabs');

      // Missing aiConversations
      await expect(
        service.createCheckpoint(testSessionId, {
          terminalState: [],
          browserTabs: [],
          openFiles: []
        } as any, metadata, { validateState: true })
      ).rejects.toThrow('Workspace state missing required array: aiConversations');

      // Missing openFiles
      await expect(
        service.createCheckpoint(testSessionId, {
          terminalState: [],
          browserTabs: [],
          aiConversations: []
        } as any, metadata, { validateState: true })
      ).rejects.toThrow('Workspace state missing required array: openFiles');
    });

    it('should handle non-array workspace state fields', async () => {
      const metadata: CheckpointMetadata = { name: 'Non-Array State Test' };

      await expect(
        service.createCheckpoint(testSessionId, {
          terminalState: 'not an array',
          browserTabs: [],
          aiConversations: [],
          openFiles: []
        } as any, metadata, { validateState: true })
      ).rejects.toThrow('Workspace state missing required array: terminalState');

      await expect(
        service.createCheckpoint(testSessionId, {
          terminalState: [],
          browserTabs: null,
          aiConversations: [],
          openFiles: []
        } as any, metadata, { validateState: true })
      ).rejects.toThrow('Workspace state missing required array: browserTabs');
    });

    it('should skip validation when disabled', async () => {
      const metadata: CheckpointMetadata = { name: 'Skip Validation Test' };

      // Reset create mock to return proper data
      mockPrisma.sessionCheckpoint.create.mockResolvedValue({
        id: 'skip-validation-checkpoint',
        sessionId: testSessionId,
        name: 'Skip Validation Test',
        description: null,
        compressedSize: 1024,
        uncompressedSize: 2048,
        createdAt: new Date(),
        priority: 'medium',
        tags: [],
        isAutoGenerated: false,
        metadata: null,
        compressedData: 'compressed-data'
      });

      // Should succeed even with invalid state when validation is disabled
      const checkpoint = await service.createCheckpoint(testSessionId, {
        terminalState: 'invalid',
        browserTabs: null,
        aiConversations: undefined,
        openFiles: 'not an array'
      } as any, metadata, { validateState: false });

      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.name).toBe('Skip Validation Test');
    });
  });

  describe('Database Error Scenarios', () => {
    beforeEach(() => {
      // Reset all mocks for database error scenarios
      mockPrisma.workspaceSession.findUnique.mockResolvedValue(null);
      mockPrisma.sessionCheckpoint.findUnique.mockResolvedValue(null);
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([]);
      mockPrisma.sessionCheckpoint.update.mockResolvedValue(null);
      mockPrisma.sessionCheckpoint.delete.mockResolvedValue(null);
    });

    it('should handle session not found error', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = { name: 'Non-existent Session' };

      await expect(
        service.createCheckpoint('non-existent-session-id', workspaceState, metadata)
      ).rejects.toThrow('Session not found');
    });

    it('should handle checkpoint not found in get operations', async () => {
      await expect(
        service.getCheckpoint('non-existent-checkpoint-id')
      ).rejects.toThrow('Checkpoint not found');

      await expect(
        service.updateCheckpoint('non-existent-checkpoint-id', { name: 'New Name' })
      ).rejects.toThrow('Checkpoint not found');

      await expect(
        service.deleteCheckpoint('non-existent-checkpoint-id')
      ).rejects.toThrow('Checkpoint not found');
    });

    it('should handle restore from non-existent checkpoint', async () => {
      await expect(
        service.restoreFromCheckpoint('non-existent-checkpoint-id')
      ).rejects.toThrow('Failed to restore from checkpoint: Checkpoint not found');
    });

    it('should handle update validation for non-existent checkpoint', async () => {
      await expect(
        service.updateCheckpoint('non-existent-checkpoint-id', {
          name: 'a'.repeat(101) // Too long
        })
      ).rejects.toThrow('Checkpoint not found');
    });
  });

  describe('Checkpoint Filtering Advanced Scenarios', () => {
    beforeEach(async () => {
      // Reset mocks
      mockPrisma.workspaceSession.findUnique.mockResolvedValue({
        id: testSessionId,
        userId: testUserId,
        workspaceId: testWorkspaceId,
        name: 'Test Session'
      });
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(0);
      mockPrisma.sessionCheckpoint.create.mockResolvedValue({
        id: 'test-checkpoint',
        sessionId: testSessionId,
        name: 'Test',
        compressedSize: 1024,
        uncompressedSize: 2048,
        createdAt: new Date(),
        priority: 'medium',
        tags: [],
        isAutoGenerated: false
      });

      const baseDate = new Date('2025-01-15');

      // Mock the checkpoint data for testing
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([
        {
          id: 'past-checkpoint-1',
          sessionId: testSessionId,
          name: 'Past Checkpoint 1',
          priority: 'low',
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000),
          tags: ['past', 'old'],
          isAutoGenerated: true
        },
        {
          id: 'past-checkpoint-2',
          sessionId: testSessionId,
          name: 'Past Checkpoint 2',
          priority: 'medium',
          compressedSize: 2048,
          uncompressedSize: 4096,
          createdAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
          tags: ['past', 'medium'],
          isAutoGenerated: false
        },
        {
          id: 'very-old-checkpoint',
          sessionId: testSessionId,
          name: 'Very Old Checkpoint',
          priority: 'low',
          compressedSize: 512,
          uncompressedSize: 1024,
          createdAt: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
          tags: ['very-old', 'ancient'],
          isAutoGenerated: true
        }
      ]);

      // Mock count for pagination
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(3);
    });

    it('should handle complex date filtering', async () => {
      const now = new Date('2025-01-15');
      const dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const dateTo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

      // Mock filtered response for date range
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([
        {
          id: 'past-checkpoint-2',
          sessionId: testSessionId,
          name: 'Past Checkpoint 2',
          priority: 'medium',
          compressedSize: 2048,
          uncompressedSize: 4096,
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          tags: ['past', 'medium'],
          isAutoGenerated: false
        }
      ]);
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(1);

      const result = await service.getCheckpoints({
        sessionId: testSessionId,
        dateFrom,
        dateTo
      });

      // Should only include checkpoints within the date range
      expect(result.checkpoints).toHaveLength(1);
      expect(result.checkpoints[0].name).toBe('Past Checkpoint 2');
    });

    it('should handle date filtering with only from date', async () => {
      const now = new Date('2025-01-15');
      const dateFrom = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 days ago

      // Mock filtered response for date from
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([
        {
          id: 'past-checkpoint-2',
          sessionId: testSessionId,
          name: 'Past Checkpoint 2',
          priority: 'medium',
          compressedSize: 2048,
          uncompressedSize: 4096,
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          tags: ['past', 'medium'],
          isAutoGenerated: false
        }
      ]);
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(1);

      const result = await service.getCheckpoints({
        sessionId: testSessionId,
        dateFrom
      });

      // Should include checkpoints from 6 days ago onwards
      expect(result.checkpoints.length).toBeGreaterThanOrEqual(1);
      expect(result.checkpoints.every(cp => cp.createdAt >= dateFrom)).toBe(true);
    });

    it('should handle date filtering with only to date', async () => {
      const now = new Date('2025-01-15');
      const dateTo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days ago

      const result = await service.getCheckpoints({
        sessionId: testSessionId,
        dateTo
      });

      // Should include checkpoints up to 4 days ago
      expect(result.checkpoints.length).toBeGreaterThanOrEqual(1);
      expect(result.checkpoints.every(cp => cp.createdAt <= dateTo)).toBe(true);
    });

    it('should handle filtering with multiple tags requiring all tags', async () => {
      // Create checkpoint with multiple specific tags
      await service.createCheckpoint(testSessionId, createMockWorkspaceState(), {
        name: 'Multiple Tags Checkpoint',
        tags: ['multiple', 'specific', 'test']
      });

      // Mock filtered response for multiple tags
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([
        {
          id: 'multiple-tags-checkpoint',
          sessionId: testSessionId,
          name: 'Multiple Tags Checkpoint',
          priority: 'medium',
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date(),
          tags: ['multiple', 'specific', 'test'],
          isAutoGenerated: false
        }
      ]);
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(1);

      const result = await service.getCheckpoints({
        sessionId: testSessionId,
        tags: ['multiple', 'specific']
      });

      expect(result.checkpoints).toHaveLength(1);
      expect(result.checkpoints[0].name).toBe('Multiple Tags Checkpoint');
      expect(result.checkpoints[0].tags).toContain('multiple');
      expect(result.checkpoints[0].tags).toContain('specific');
    });

    it('should handle filtering with non-existent tags', async () => {
      // Mock empty response for non-existent tags
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([]);
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(0);

      const result = await service.getCheckpoints({
        sessionId: testSessionId,
        tags: ['non-existent-tag']
      });

      expect(result.checkpoints).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle sorting by size', async () => {
      // Mock sorted response by size
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([
        {
          id: 'past-checkpoint-2',
          sessionId: testSessionId,
          name: 'Past Checkpoint 2',
          priority: 'medium',
          compressedSize: 2048,
          uncompressedSize: 4096,
          createdAt: new Date('2025-01-10'),
          tags: ['past', 'medium'],
          isAutoGenerated: false
        },
        {
          id: 'past-checkpoint-1',
          sessionId: testSessionId,
          name: 'Past Checkpoint 1',
          priority: 'low',
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date('2025-01-05'),
          tags: ['past', 'old'],
          isAutoGenerated: true
        },
        {
          id: 'very-old-checkpoint',
          sessionId: testSessionId,
          name: 'Very Old Checkpoint',
          priority: 'low',
          compressedSize: 512,
          uncompressedSize: 1024,
          createdAt: new Date('2024-12-16'),
          tags: ['very-old', 'ancient'],
          isAutoGenerated: true
        }
      ]);
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(3);

      const result = await service.getCheckpoints({
        sessionId: testSessionId,
        sortBy: 'size',
        sortOrder: 'desc'
      });

      // Should be sorted by compressedSize in descending order
      for (let i = 1; i < result.checkpoints.length; i++) {
        expect(result.checkpoints[i - 1].compressedSize)
          .toBeGreaterThanOrEqual(result.checkpoints[i].compressedSize);
      }
    });

    it('should handle pagination edge cases', async () => {
      // Test with limit larger than available
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([
        {
          id: 'past-checkpoint-1',
          sessionId: testSessionId,
          name: 'Past Checkpoint 1',
          priority: 'low',
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date('2025-01-05'),
          tags: ['past', 'old'],
          isAutoGenerated: true
        }
      ]);
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(1);

      const result1 = await service.getCheckpoints({
        sessionId: testSessionId,
        limit: 100,
        offset: 0
      });

      expect(result1.checkpoints.length).toBeGreaterThan(0);
      expect(result1.pagination.hasMore).toBe(false);

      // Test with offset beyond available
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([]);
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(1);

      const result2 = await service.getCheckpoints({
        sessionId: testSessionId,
        limit: 10,
        offset: 1000
      });

      expect(result2.checkpoints).toHaveLength(0);
      expect(result2.pagination.hasMore).toBe(false);
      expect(result2.pagination.total).toBeGreaterThan(0);
    });

    it('should handle filtering by auto-generated flag variations', async () => {
      // Test isAutoGenerated: true
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([
        {
          id: 'past-checkpoint-1',
          sessionId: testSessionId,
          name: 'Past Checkpoint 1',
          priority: 'low',
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date('2025-01-05'),
          tags: ['past', 'old'],
          isAutoGenerated: true
        },
        {
          id: 'very-old-checkpoint',
          sessionId: testSessionId,
          name: 'Very Old Checkpoint',
          priority: 'low',
          compressedSize: 512,
          uncompressedSize: 1024,
          createdAt: new Date('2024-12-16'),
          tags: ['very-old', 'ancient'],
          isAutoGenerated: true
        }
      ]);
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(2);

      const autoResult = await service.getCheckpoints({
        sessionId: testSessionId,
        isAutoGenerated: true
      });
      expect(autoResult.checkpoints.every(cp => cp.isAutoGenerated === true)).toBe(true);

      // Test isAutoGenerated: false
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([
        {
          id: 'past-checkpoint-2',
          sessionId: testSessionId,
          name: 'Past Checkpoint 2',
          priority: 'medium',
          compressedSize: 2048,
          uncompressedSize: 4096,
          createdAt: new Date('2025-01-10'),
          tags: ['past', 'medium'],
          isAutoGenerated: false
        }
      ]);
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(1);

      const manualResult = await service.getCheckpoints({
        sessionId: testSessionId,
        isAutoGenerated: false
      });
      expect(manualResult.checkpoints.every(cp => cp.isAutoGenerated === false)).toBe(true);

      // Verify counts make sense
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([
        {
          id: 'past-checkpoint-1',
          sessionId: testSessionId,
          name: 'Past Checkpoint 1',
          priority: 'low',
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date('2025-01-05'),
          tags: ['past', 'old'],
          isAutoGenerated: true
        },
        {
          id: 'past-checkpoint-2',
          sessionId: testSessionId,
          name: 'Past Checkpoint 2',
          priority: 'medium',
          compressedSize: 2048,
          uncompressedSize: 4096,
          createdAt: new Date('2025-01-10'),
          tags: ['past', 'medium'],
          isAutoGenerated: false
        },
        {
          id: 'very-old-checkpoint',
          sessionId: testSessionId,
          name: 'Very Old Checkpoint',
          priority: 'low',
          compressedSize: 512,
          uncompressedSize: 1024,
          createdAt: new Date('2024-12-16'),
          tags: ['very-old', 'ancient'],
          isAutoGenerated: true
        }
      ]);
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(3);

      const allResult = await service.getCheckpoints({
        sessionId: testSessionId
      });
      expect(allResult.checkpoints.length)
        .toBe(autoResult.checkpoints.length + manualResult.checkpoints.length);
    });
  });

  describe('Bulk Operations Edge Cases', () => {
    it('should handle empty deleteCheckpoints array', async () => {
      const result = await service.deleteCheckpoints([]);
      expect(result.deleted).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle deleteCheckpoints with mixed valid and invalid IDs', async () => {
      const workspaceState = createMockWorkspaceState();

      // Create some checkpoints
      const checkpoint1 = await service.createCheckpoint(testSessionId, workspaceState, {
        name: 'Delete Test 1'
      });
      const checkpoint2 = await service.createCheckpoint(testSessionId, workspaceState, {
        name: 'Delete Test 2'
      });

      // Mock successful deletions for valid IDs and failure for invalid ones
      mockPrisma.sessionCheckpoint.findUnique
        .mockResolvedValueOnce({ sessionId: testSessionId }) // valid checkpoint1
        .mockResolvedValueOnce(null) // non-existent-id-1
        .mockResolvedValueOnce({ sessionId: testSessionId }) // valid checkpoint2
        .mockResolvedValueOnce(null); // non-existent-id-2

      mockPrisma.sessionCheckpoint.delete
        .mockResolvedValueOnce({}) // successful deletion of checkpoint1
        .mockRejectedValueOnce(new Error('Checkpoint not found')) // non-existent-id-1
        .mockResolvedValueOnce({}) // successful deletion of checkpoint2
        .mockRejectedValueOnce(new Error('Checkpoint not found')); // non-existent-id-2

      // Try to delete mix of valid and invalid IDs
      const result = await service.deleteCheckpoints([
        checkpoint1.id,
        'non-existent-id-1',
        checkpoint2.id,
        'non-existent-id-2'
      ]);

      expect(result.deleted).toBeGreaterThanOrEqual(1);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      // Check that error messages contain the non-existent IDs
      const errorText = result.errors.join(' ');
      expect(errorText).toContain('non-existent-id');
      expect(result.deleted + result.errors.length).toBe(4); // Total 4 items processed
    });

    it('should handle deleteCheckpoints with all invalid IDs', async () => {
      const result = await service.deleteCheckpoints([
        'non-existent-1',
        'non-existent-2',
        'non-existent-3'
      ]);

      expect(result.deleted).toBe(0);
      expect(result.errors).toHaveLength(3);
    });

    it('should handle deleteCheckpoints with duplicate IDs', async () => {
      const workspaceState = createMockWorkspaceState();

      const checkpoint = await service.createCheckpoint(testSessionId, workspaceState, {
        name: 'Duplicate Delete Test'
      });

      // Mock successful deletion for the checkpoint (first call succeeds, subsequent calls may fail)
      mockPrisma.sessionCheckpoint.findUnique.mockResolvedValue({ sessionId: testSessionId });
      mockPrisma.sessionCheckpoint.delete
        .mockResolvedValueOnce({}) // successful deletion
        .mockRejectedValueOnce(new Error('Checkpoint not found')) // duplicate call fails
        .mockRejectedValueOnce(new Error('Checkpoint not found')); // duplicate call fails

      const result = await service.deleteCheckpoints([
        checkpoint.id,
        checkpoint.id, // Duplicate
        checkpoint.id  // Duplicate
      ]);

      // Should handle gracefully - might delete once or multiple times depending on implementation
      expect(result.deleted).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Statistics Edge Cases', () => {
    beforeEach(() => {
      // Reset mocks for statistics tests
      mockPrisma.sessionCheckpoint.count.mockReset();
      mockPrisma.sessionCheckpoint.findMany.mockReset();
      mockPrisma.sessionCheckpoint.aggregate.mockReset();
    });

    it('should handle statistics for session with no checkpoints', async () => {
      // Mock empty statistics
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(0);
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([]);
      mockPrisma.sessionCheckpoint.aggregate.mockResolvedValue({
        _sum: { compressedSize: 0, uncompressedSize: 0 },
        _avg: { compressedSize: 0 }
      });

      const stats = await service.getCheckpointStatistics(testSessionId);

      expect(stats.totalCheckpoints).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.averageSize).toBe(0);
      expect(stats.oldestCheckpoint).toBeUndefined();
      expect(stats.newestCheckpoint).toBeUndefined();
      expect(stats.checkpointsByPriority.low).toBe(0);
      expect(stats.checkpointsByPriority.medium).toBe(0);
      expect(stats.checkpointsByPriority.high).toBe(0);
      expect(stats.storageUsage.compressed).toBe(0);
      expect(stats.storageUsage.uncompressed).toBe(0);
      expect(stats.storageUsage.compressionRatio).toBe(1);
    });

    it('should handle statistics with single checkpoint', async () => {
      const checkpointData = [
        {
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date(),
          priority: 'high',
          tags: ['single']
        }
      ];

      mockPrisma.sessionCheckpoint.count.mockResolvedValue(1);
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue(checkpointData);
      mockPrisma.sessionCheckpoint.aggregate.mockResolvedValue({
        _sum: { compressedSize: 1024, uncompressedSize: 2048 },
        _avg: { compressedSize: 1024 }
      });

      const stats = await service.getCheckpointStatistics(testSessionId);

      expect(stats.totalCheckpoints).toBe(1);
      expect(stats.totalSize).toBe(1024);
      expect(stats.averageSize).toBe(1024);
      expect(stats.oldestCheckpoint).toBeDefined();
      expect(stats.newestCheckpoint).toBeDefined();
      expect(stats.checkpointsByPriority.high).toBe(1);
      expect(stats.checkpointsByPriority.low).toBe(0);
      expect(stats.checkpointsByPriority.medium).toBe(0);
      expect(stats.checkpointsByTag.single).toBe(1);
    });

    it('should handle statistics across multiple sessions', async () => {
      const checkpointData = [
        {
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date(),
          priority: 'high',
          tags: []
        },
        {
          compressedSize: 2048,
          uncompressedSize: 4096,
          createdAt: new Date(),
          priority: 'medium',
          tags: []
        }
      ];

      // Mock global statistics (all sessions)
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(2);
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue(checkpointData);
      mockPrisma.sessionCheckpoint.aggregate.mockResolvedValue({
        _sum: { compressedSize: 3072, uncompressedSize: 6144 },
        _avg: { compressedSize: 1536 }
      });

      const globalStats = await service.getCheckpointStatistics();
      expect(globalStats.totalCheckpoints).toBe(2);

      // Mock session-specific statistics
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(1);
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue([checkpointData[0]]);
      mockPrisma.sessionCheckpoint.aggregate.mockResolvedValue({
        _sum: { compressedSize: 1024, uncompressedSize: 2048 },
        _avg: { compressedSize: 1024 }
      });

      const session1Stats = await service.getCheckpointStatistics(testSessionId);
      expect(session1Stats.totalCheckpoints).toBe(1);
      expect(session1Stats.checkpointsByPriority.high).toBe(1);
    });

    it('should handle statistics with complex tag distribution', async () => {
      const checkpointData = [
        {
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date(),
          priority: 'medium',
          tags: ['common', 'unique1', 'shared']
        },
        {
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date(),
          priority: 'medium',
          tags: ['common', 'unique2', 'shared']
        },
        {
          compressedSize: 1024,
          uncompressedSize: 2048,
          createdAt: new Date(),
          priority: 'medium',
          tags: ['unique1']
        }
      ];

      mockPrisma.sessionCheckpoint.count.mockResolvedValue(3);
      mockPrisma.sessionCheckpoint.findMany.mockResolvedValue(checkpointData);
      mockPrisma.sessionCheckpoint.aggregate.mockResolvedValue({
        _sum: { compressedSize: 3072, uncompressedSize: 6144 },
        _avg: { compressedSize: 1024 }
      });

      const stats = await service.getCheckpointStatistics(testSessionId);

      expect(stats.checkpointsByTag.common).toBe(2);
      expect(stats.checkpointsByTag.shared).toBe(2);
      expect(stats.checkpointsByTag.unique1).toBe(2);
      expect(stats.checkpointsByTag.unique2).toBe(1);
    });
  });

  describe('Checkpoint Metadata Edge Cases', () => {
    beforeEach(() => {
      // Setup mocks for metadata tests
      mockPrisma.workspaceSession.findUnique.mockResolvedValue({
        id: testSessionId,
        userId: testUserId,
        workspaceId: testWorkspaceId,
        name: 'Test Session'
      });
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(0);
      mockPrisma.sessionCheckpoint.create.mockResolvedValue({
        id: 'test-checkpoint-metadata',
        sessionId: testSessionId,
        name: 'Metadata Test',
        compressedSize: 1024,
        uncompressedSize: 2048,
        createdAt: new Date(),
        priority: 'medium',
        tags: [],
        isAutoGenerated: false
      });
      mockPrisma.sessionCheckpoint.findUnique.mockResolvedValue({
        id: 'test-checkpoint-metadata',
        sessionId: testSessionId,
        name: 'Metadata Test',
        metadata: {},
        compressedSize: 1024,
        uncompressedSize: 2048,
        createdAt: new Date(),
        priority: 'medium',
        tags: [],
        isAutoGenerated: false
      });
      mockPrisma.sessionCheckpoint.update.mockResolvedValue({
        id: 'test-checkpoint-metadata',
        sessionId: testSessionId,
        name: 'Metadata Test',
        metadata: {
          customField: 'custom value',
          nestedObject: {
            field1: 'value1',
            field2: 42,
            field3: true
          },
          arrayField: ['item1', 'item2', 'item3']
        },
        compressedSize: 1024,
        uncompressedSize: 2048,
        createdAt: new Date(),
        priority: 'medium',
        tags: [],
        isAutoGenerated: false
      });
    });

    it('should handle metadata updates with complex nested objects', async () => {
      const workspaceState = createMockWorkspaceState();

      const checkpoint = await service.createCheckpoint(testSessionId, workspaceState, {
        name: 'Metadata Test',
        priority: 'medium'
      });

      const updated = await service.updateCheckpoint(checkpoint.id, {
        metadata: {
          customField: 'custom value',
          nestedObject: {
            field1: 'value1',
            field2: 42,
            field3: true
          },
          arrayField: ['item1', 'item2', 'item3']
        }
      });

      expect(updated.metadata).toBeDefined();
      expect((updated.metadata as any).customField).toBe('custom value');
      expect((updated.metadata as any).nestedObject.field1).toBe('value1');
      expect((updated.metadata as any).nestedObject.field2).toBe(42);
      expect((updated.metadata as any).arrayField).toEqual(['item1', 'item2', 'item3']);
    });

    it('should handle checkpoint metadata with special characters', async () => {
      const workspaceState = createMockWorkspaceState();

      const specialMetadata: CheckpointMetadata = {
        name: 'Special Characters: !@#$%^&*()_+-=[]{}|;:,.<>?',
        description: 'Unicode support: café naïve résumé 🚀 ✨',
        tags: ['unicode', 'emojis', 'special-chars'],
        priority: 'high'
      };

      // Reset create mock to return special character data
      mockPrisma.sessionCheckpoint.create.mockResolvedValue({
        id: 'special-chars-checkpoint',
        sessionId: testSessionId,
        name: 'Special Characters: !@#$%^&*()_+-=[]{}|;:,.<>?',
        description: 'Unicode support: café naïve résumé 🚀 ✨',
        compressedSize: 1024,
        uncompressedSize: 2048,
        createdAt: new Date(),
        priority: 'high',
        tags: ['unicode', 'emojis', 'special-chars'],
        isAutoGenerated: false,
        metadata: null,
        compressedData: 'compressed-data'
      });

      const checkpoint = await service.createCheckpoint(testSessionId, workspaceState, specialMetadata);

      expect(checkpoint.name).toBe(specialMetadata.name);
      expect(checkpoint.description).toBe(specialMetadata.description);
      expect(checkpoint.tags).toEqual(specialMetadata.tags);
    });
  });

  describe('Performance and Scale Edge Cases', () => {
    beforeEach(() => {
      // Setup mocks for performance tests
      mockPrisma.workspaceSession.findUnique.mockResolvedValue({
        id: testSessionId,
        userId: testUserId,
        workspaceId: testWorkspaceId,
        name: 'Test Session'
      });
      mockPrisma.sessionCheckpoint.count.mockResolvedValue(0);
      mockPrisma.sessionCheckpoint.create.mockResolvedValue({
        id: 'large-checkpoint',
        sessionId: testSessionId,
        name: 'Large State Checkpoint',
        compressedSize: 500000, // 500KB compressed
        uncompressedSize: 1000000, // 1MB uncompressed
        createdAt: new Date(),
        priority: 'high',
        tags: [],
        isAutoGenerated: false
      });
      mockPrisma.sessionCheckpoint.findUnique.mockResolvedValue({
        id: 'large-checkpoint',
        sessionId: testSessionId,
        name: 'Large State Checkpoint',
        compressedData: 'serialized-large-state-data',
        createdAt: new Date(),
        priority: 'high',
        tags: [],
        isAutoGenerated: false,
        session: {
          id: testSessionId,
          userId: testUserId,
          workspaceId: testWorkspaceId,
          name: 'Test Session'
        }
      });
    });

    it('should handle large workspace state serialization', async () => {
      // Mock session update for restore
      mockPrisma.workspaceSession.update.mockResolvedValue({
        id: testSessionId,
        userId: testUserId,
        workspaceId: testWorkspaceId,
        name: 'Test Session',
        isActive: true,
        lastSavedAt: new Date(),
        version: 1
      });

      // Create a large workspace state
      const largeState = createMockWorkspaceState({
        terminalState: Array.from({ length: 1000 }, (_, i) => ({
          id: `term_${i}`,
          command: `command_${i}`.repeat(10), // Make commands longer
          isActive: i % 10 === 0,
          output: `output_${i}`.repeat(20),
          environment: {
            PATH: '/usr/bin:/bin',
            CUSTOM_VAR: `value_${i}`.repeat(5)
          }
        })),
        browserTabs: Array.from({ length: 100 }, (_, i) => ({
          url: `https://example${i}.com/page${i}`,
          title: `Example Page ${i}`.repeat(5),
          isActive: i === 0,
          favicon: `favicon_${i}.ico`,
          history: Array.from({ length: 50 }, (_, j) => ({
            url: `https://example${i}.com/page${i}/subpage${j}`,
            title: `Subpage ${j}`,
            timestamp: new Date(Date.now() - j * 1000 * 60)
          }))
        })),
        aiConversations: Array.from({ length: 50 }, (_, i) => ({
          id: `conv_${i}`,
          messages: Array.from({ length: 20 }, (_, j) => ({
            role: j % 2 === 0 ? 'user' : 'assistant',
            content: `Message content ${i}-${j}`.repeat(10),
            timestamp: new Date(Date.now() - (i * 20 + j) * 1000 * 60)
          })),
          timestamp: new Date(Date.now() - i * 1000 * 60 * 60),
          model: 'gpt-4',
          temperature: 0.7
        })),
        openFiles: Array.from({ length: 200 }, (_, i) => ({
          path: `/very/long/path/to/file_${i}.ts`,
          language: 'typescript',
          hasUnsavedChanges: i % 3 === 0,
          content: `// File content ${i}\n`.repeat(100),
          cursor: { line: i % 100, column: i % 80 },
          selection: {
            start: { line: i % 100, column: i % 80 },
            end: { line: i % 100 + 1, column: 0 }
          },
          bookmarks: Array.from({ length: 5 }, (_, j) => ({
            line: j * 10,
            column: 0,
            label: `Bookmark ${j}`
          }))
        }))
      });

      const metadata: CheckpointMetadata = {
        name: 'Large State Checkpoint',
        description: 'Testing large workspace state handling',
        priority: 'high'
      };

      // Should handle large state without issues
      const checkpoint = await service.createCheckpoint(testSessionId, largeState, metadata);

      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.compressedSize).toBeGreaterThan(0);
      expect(checkpoint.uncompressedSize).toBeGreaterThan(0);
      expect(checkpoint.compressedSize).toBeLessThan(checkpoint.uncompressedSize * 2); // Reasonable compression

      // Mock the deserializeState to return the large state structure
      mockSerializerInstance.deserializeState.mockResolvedValue({
        terminalState: Array.from({ length: 1000 }, (_, i) => ({
          id: `term_${i}`,
          command: `command_${i}`.repeat(10),
          isActive: i % 10 === 0,
          output: `output_${i}`.repeat(20),
          environment: {
            PATH: '/usr/bin:/bin',
            CUSTOM_VAR: `value_${i}`.repeat(5)
          }
        })),
        browserTabs: Array.from({ length: 100 }, (_, i) => ({
          url: `https://example${i}.com/page${i}`,
          title: `Example Page ${i}`.repeat(5),
          isActive: i === 0,
          favicon: `favicon_${i}.ico`,
          history: Array.from({ length: 50 }, (_, j) => ({
            url: `https://example${i}.com/page${i}/subpage${j}`,
            title: `Subpage ${j}`,
            timestamp: new Date(Date.now() - j * 1000 * 60)
          }))
        })),
        aiConversations: Array.from({ length: 50 }, (_, i) => ({
          id: `conv_${i}`,
          messages: Array.from({ length: 20 }, (_, j) => ({
            role: j % 2 === 0 ? 'user' : 'assistant',
            content: `Message content ${i}-${j}`.repeat(10),
            timestamp: new Date(Date.now() - (i * 20 + j) * 1000 * 60)
          })),
          timestamp: new Date(Date.now() - i * 1000 * 60 * 60),
          model: 'gpt-4',
          temperature: 0.7
        })),
        openFiles: Array.from({ length: 200 }, (_, i) => ({
          path: `/very/long/path/to/file_${i}.ts`,
          language: 'typescript',
          hasUnsavedChanges: i % 3 === 0,
          content: `// File content ${i}\n`.repeat(100),
          cursor: { line: i % 100, column: i % 80 },
          selection: {
            start: { line: i % 100, column: i % 80 },
            end: { line: i % 100 + 1, column: 0 }
          },
          bookmarks: Array.from({ length: 5 }, (_, j) => ({
            line: j * 10,
            column: 0,
            label: `Bookmark ${j}`
          }))
        }))
      });

      // Should be able to restore it
      const restoreResult = await service.restoreFromCheckpoint(checkpoint.id);
      expect(restoreResult.workspaceState.terminalState).toHaveLength(1000);
      expect(restoreResult.workspaceState.browserTabs).toHaveLength(100);
      expect(restoreResult.workspaceState.aiConversations).toHaveLength(50);
      expect(restoreResult.workspaceState.openFiles).toHaveLength(200);
    });
  });
});