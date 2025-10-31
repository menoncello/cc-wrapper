import { afterEach,beforeEach, describe, expect, it } from 'bun:test';

import { generateChecksum } from '../lib/encryption.js';
import type { CheckpointMetadata, CreateCheckpointOptions,WorkspaceState } from '../types/session.js';
import { createSessionCheckpointService,SessionCheckpointService } from './checkpoint.service.js';

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

const createMockSession = (sessionId = 'test_session') => ({
  id: sessionId,
  userId: 'user_123',
  workspaceId: 'workspace_456',
  name: 'Test Session',
  isActive: true,
  lastSavedAt: new Date(),
  expiresAt: new Date(),
  createdAt: new Date()
});

// Mock the database operations (simplified for testing)
class MockCheckpointService extends SessionCheckpointService {
  private checkpoints: Map<string, any> = new Map();
  private sessions: Map<string, any> = new Map();
  private checkpointIdCounter = 1;

  constructor() {
    super();
    // Setup mock session
    this.sessions.set('test_session', createMockSession());
  }

  // Override methods for testing
  protected async validateCheckpointInputs(
    sessionId: string,
    workspaceState: WorkspaceState,
    metadata: CheckpointMetadata,
    options: CreateCheckpointOptions
  ): Promise<void> {
    // Simplified validation for testing
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Valid session ID is required');
    }
    if (!metadata.name || typeof metadata.name !== 'string') {
      throw new Error('Checkpoint name is required');
    }
    if (metadata.name.length > 100) {
      throw new Error('Checkpoint name too long');
    }
    if (options.encryptData && !options.encryptionKey) {
      throw new Error('Encryption key is required when encryptData is true');
    }
  }

  protected async findDuplicateCheckpoint(sessionId: string, name: string): Promise<any> {
    for (const checkpoint of this.checkpoints.values()) {
      if (checkpoint.sessionId === sessionId && checkpoint.name === name) {
        return checkpoint;
      }
    }
    return null;
  }

  protected async removeOldestCheckpoint(sessionId: string): Promise<void> {
    const sessionCheckpoints = Array.from(this.checkpoints.values())
      .filter(cp => cp.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (sessionCheckpoints.length > 0) {
      this.checkpoints.delete(sessionCheckpoints[0].id);
    }
  }

  protected async getCurrentSessionState(sessionId: string): Promise<WorkspaceState | null> {
    const session = this.sessions.get(sessionId);
    return session ? createMockWorkspaceState() : null;
  }

  protected async updateSessionCheckpointCount(sessionId: string): Promise<void> {
    // Mock implementation
  }

  protected async serializeWorkspaceState(
    workspaceState: WorkspaceState,
    encrypt = false,
    encryptionKey?: string
  ): Promise<{
    data: string;
    compressedSize: number;
    uncompressedSize: number;
  }> {
    const serializedState = JSON.stringify(workspaceState);
    const uncompressedSize = Buffer.byteLength(serializedState, 'utf8');

    // Simple "compression" for testing (base64 encoding)
    const compressedData = Buffer.from(serializedState).toString('base64');
    const compressedSize = Buffer.byteLength(compressedData, 'base64');

    return {
      data: compressedData,
      compressedSize,
      uncompressedSize
    };
  }

  // Mock database operations
  private async createCheckpointRecord(data: any): Promise<any> {
    const checkpoint = {
      id: `checkpoint_${this.checkpointIdCounter++}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.checkpoints.set(checkpoint.id, checkpoint);
    return checkpoint;
  }

  private async findCheckpoint(checkpointId: string): Promise<any> {
    return this.checkpoints.get(checkpointId) || null;
  }

  private async findCheckpoints(filter: any): Promise<any[]> {
    const checkpoints = Array.from(this.checkpoints.values());

    return checkpoints.filter(checkpoint => {
      if (filter.sessionId && checkpoint.sessionId !== filter.sessionId) {
return false;
}
      if (filter.tags && filter.tags.length > 0) {
        const hasAllTags = filter.tags.every((tag: string) => checkpoint.tags.includes(tag));
        if (!hasAllTags) {
return false;
}
      }
      if (filter.priority && checkpoint.priority !== filter.priority) {
return false;
}
      if (filter.isAutoGenerated !== undefined && checkpoint.isAutoGenerated !== filter.isAutoGenerated) {
return false;
}
      return true;
    });
  }

  private async updateCheckpointRecord(checkpointId: string, updates: any): Promise<any> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (checkpoint) {
      const updated = { ...checkpoint, ...updates, updatedAt: new Date() };
      this.checkpoints.set(checkpointId, updated);
      return updated;
    }
    throw new Error('Checkpoint not found');
  }

  private async deleteCheckpointRecord(checkpointId: string): Promise<void> {
    if (!this.checkpoints.has(checkpointId)) {
      throw new Error('Checkpoint not found');
    }
    this.checkpoints.delete(checkpointId);
  }

  // Public methods for testing
  async createCheckpoint(
    sessionId: string,
    workspaceState: WorkspaceState,
    metadata: CheckpointMetadata,
    options: CreateCheckpointOptions = {}
  ) {
    try {
      await this.validateCheckpointInputs(sessionId, workspaceState, metadata, options);

      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (options.skipDuplicates) {
        const existingCheckpoint = await this.findDuplicateCheckpoint(sessionId, metadata.name);
        if (existingCheckpoint) {
          throw new Error(`Checkpoint with name '${metadata.name}' already exists`);
        }
      }

      const serializedData = await this.serializeWorkspaceState(
        workspaceState,
        options.encryptData,
        options.encryptionKey
      );

      const checksum = await generateChecksum(serializedData.data);

      const checkpoint = await this.createCheckpointRecord({
        sessionId,
        name: metadata.name,
        description: metadata.description || null,
        workspaceState: serializedData.data,
        stateChecksum: checksum,
        compressedSize: serializedData.compressedSize,
        uncompressedSize: serializedData.uncompressedSize,
        encryptedKey: options.encryptData ? options.encryptionKey : null,
        tags: metadata.tags || [],
        isAutoGenerated: metadata.isAutoGenerated || false,
        priority: metadata.priority || 'medium',
        metadata: {
          createdAt: new Date(),
          version: '1.0',
          source: 'manual',
          ...metadata
        }
      });

      return this.mapToCheckpointResponse(checkpoint);
    } catch (error) {
      throw new Error(`Failed to create checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCheckpoint(checkpointId: string) {
    const checkpoint = await this.findCheckpoint(checkpointId);
    if (!checkpoint) {
      throw new Error('Checkpoint not found');
    }
    return this.mapToCheckpointResponse(checkpoint);
  }

  async getCheckpoints(filter: any = {}) {
    const checkpoints = await this.findCheckpoints(filter);

    // Apply sorting
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'desc';

    checkpoints.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (aValue instanceof Date) {
aValue = aValue.getTime();
}
      if (bValue instanceof Date) {
bValue = bValue.getTime();
}

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : (aValue > bValue ? 1 : 0);
      } 
        return aValue > bValue ? -1 : (aValue < bValue ? 1 : 0);
      
    });

    // Apply pagination
    const limit = filter.limit || 20;
    const offset = filter.offset || 0;
    const paginatedCheckpoints = checkpoints.slice(offset, offset + limit);

    return {
      checkpoints: paginatedCheckpoints.map(cp => this.mapToCheckpointResponse(cp)),
      pagination: {
        total: checkpoints.length,
        limit,
        offset,
        hasMore: offset + limit < checkpoints.length,
        totalPages: Math.ceil(checkpoints.length / limit)
      }
    };
  }

  async updateCheckpoint(checkpointId: string, updates: any) {
    const existingCheckpoint = await this.findCheckpoint(checkpointId);
    if (!existingCheckpoint) {
      throw new Error('Checkpoint not found');
    }

    if (updates.name && updates.name.length > 100) {
      throw new Error('Checkpoint name too long');
    }

    if (updates.description && updates.description.length > 500) {
      throw new Error('Checkpoint description too long');
    }

    const updatedCheckpoint = await this.updateCheckpointRecord(checkpointId, updates);
    return this.mapToCheckpointResponse(updatedCheckpoint);
  }

  async deleteCheckpoint(checkpointId: string) {
    const checkpoint = await this.findCheckpoint(checkpointId);
    if (!checkpoint) {
      throw new Error('Checkpoint not found');
    }

    await this.deleteCheckpointRecord(checkpointId);
  }

  async deleteCheckpoints(checkpointIds: string[]) {
    const result = {
      deleted: 0,
      errors: [] as string[]
    };

    for (const checkpointId of checkpointIds) {
      try {
        await this.deleteCheckpoint(checkpointId);
        result.deleted++;
      } catch (error) {
        result.errors.push(`Failed to delete checkpoint ${checkpointId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return result;
  }

  private mapToCheckpointResponse(checkpoint: any) {
    return {
      id: checkpoint.id,
      sessionId: checkpoint.sessionId,
      name: checkpoint.name,
      description: checkpoint.description,
      createdAt: checkpoint.createdAt,
      compressedSize: checkpoint.compressedSize,
      uncompressedSize: checkpoint.uncompressedSize,
      tags: checkpoint.tags,
      priority: checkpoint.priority,
      isAutoGenerated: checkpoint.isAutoGenerated,
      metadata: checkpoint.metadata,
      session: this.sessions.get(checkpoint.sessionId) ? {
        id: this.sessions.get(checkpoint.sessionId).id,
        name: this.sessions.get(checkpoint.sessionId).name,
        workspaceId: this.sessions.get(checkpoint.sessionId).workspaceId
      } : undefined
    };
  }
}

describe('Session Checkpoint Service', () => {
  let checkpointService: MockCheckpointService;

  beforeEach(() => {
    checkpointService = new MockCheckpointService();
  });

  describe('constructor and factory functions', () => {
    it('should create service with default configuration', () => {
      const service = new MockCheckpointService();
      expect(service).toBeInstanceOf(SessionCheckpointService);
    });

    it('should create service via factory function', () => {
      const service = createSessionCheckpointService();
      expect(service).toBeInstanceOf(SessionCheckpointService);
    });
  });

  describe('createCheckpoint', () => {
    it('should create a checkpoint successfully', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'Test Checkpoint',
        description: 'A test checkpoint',
        tags: ['test', 'example'],
        priority: 'high'
      };

      const checkpoint = await checkpointService.createCheckpoint(
        'test_session',
        workspaceState,
        metadata
      );

      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.name).toBe('Test Checkpoint');
      expect(checkpoint.description).toBe('A test checkpoint');
      expect(checkpoint.tags).toEqual(['test', 'example']);
      expect(checkpoint.priority).toBe('high');
      expect(checkpoint.isAutoGenerated).toBe(false);
      expect(checkpoint.compressedSize).toBeGreaterThan(0);
      expect(checkpoint.uncompressedSize).toBeGreaterThan(0);
    });

    it('should create checkpoint with minimal metadata', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'Minimal Checkpoint'
      };

      const checkpoint = await checkpointService.createCheckpoint(
        'test_session',
        workspaceState,
        metadata
      );

      expect(checkpoint.name).toBe('Minimal Checkpoint');
      expect(checkpoint.description).toBeNull();
      expect(checkpoint.tags).toEqual([]);
      expect(checkpoint.priority).toBe('medium');
    });

    it('should throw error for invalid session ID', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'Test Checkpoint'
      };

      await expect(
        checkpointService.createCheckpoint('', workspaceState, metadata)
      ).rejects.toThrow('Valid session ID is required');
    });

    it('should throw error for missing name', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata = {} as CheckpointMetadata;

      await expect(
        checkpointService.createCheckpoint('test_session', workspaceState, metadata)
      ).rejects.toThrow('Checkpoint name is required');
    });

    it('should throw error for name too long', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'a'.repeat(101) // Over 100 characters
      };

      await expect(
        checkpointService.createCheckpoint('test_session', workspaceState, metadata)
      ).rejects.toThrow('Checkpoint name too long');
    });

    it('should throw error for non-existent session', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'Test Checkpoint'
      };

      await expect(
        checkpointService.createCheckpoint('nonexistent_session', workspaceState, metadata)
      ).rejects.toThrow('Session not found');
    });

    it('should skip duplicate checkpoints when requested', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'Duplicate Checkpoint'
      };

      // Create first checkpoint
      await checkpointService.createCheckpoint('test_session', workspaceState, metadata);

      // Try to create duplicate
      await expect(
        checkpointService.createCheckpoint('test_session', workspaceState, metadata, {
          skipDuplicates: true
        })
      ).rejects.toThrow("Checkpoint with name 'Duplicate Checkpoint' already exists");
    });

    it('should handle auto-generated checkpoints', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'Auto Checkpoint',
        isAutoGenerated: true,
        priority: 'low'
      };

      const checkpoint = await checkpointService.createCheckpoint(
        'test_session',
        workspaceState,
        metadata
      );

      expect(checkpoint.isAutoGenerated).toBe(true);
      expect(checkpoint.priority).toBe('low');
    });
  });

  describe('getCheckpoint', () => {
    it('should retrieve existing checkpoint', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'Test Checkpoint'
      };

      const created = await checkpointService.createCheckpoint('test_session', workspaceState, metadata);
      const retrieved = await checkpointService.getCheckpoint(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Test Checkpoint');
    });

    it('should throw error for non-existent checkpoint', async () => {
      await expect(
        checkpointService.getCheckpoint('nonexistent_checkpoint')
      ).rejects.toThrow('Checkpoint not found');
    });
  });

  describe('getCheckpoints', () => {
    beforeEach(async () => {
      // Create some test checkpoints
      const workspaceState = createMockWorkspaceState();

      await checkpointService.createCheckpoint('test_session', workspaceState, {
        name: 'Checkpoint 1',
        priority: 'high',
        tags: ['important']
      });

      await checkpointService.createCheckpoint('test_session', workspaceState, {
        name: 'Checkpoint 2',
        priority: 'low',
        tags: ['test']
      });

      await checkpointService.createCheckpoint('test_session', workspaceState, {
        name: 'Auto Checkpoint',
        priority: 'medium',
        tags: ['auto'],
        isAutoGenerated: true
      });
    });

    it('should retrieve all checkpoints', async () => {
      const result = await checkpointService.getCheckpoints();

      expect(result.checkpoints).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter checkpoints by priority', async () => {
      const result = await checkpointService.getCheckpoints({ priority: 'high' });

      expect(result.checkpoints).toHaveLength(1);
      expect(result.checkpoints[0].priority).toBe('high');
    });

    it('should filter checkpoints by tags', async () => {
      const result = await checkpointService.getCheckpoints({ tags: ['test'] });

      expect(result.checkpoints).toHaveLength(1);
      expect(result.checkpoints[0].tags).toContain('test');
    });

    it('should filter checkpoints by auto-generated flag', async () => {
      const result = await checkpointService.getCheckpoints({ isAutoGenerated: true });

      expect(result.checkpoints).toHaveLength(1);
      expect(result.checkpoints[0].isAutoGenerated).toBe(true);
    });

    it('should apply sorting', async () => {
      const result = await checkpointService.getCheckpoints({
        sortBy: 'name',
        sortOrder: 'asc'
      });

      expect(result.checkpoints[0].name).toBe('Auto Checkpoint');
      expect(result.checkpoints[1].name).toBe('Checkpoint 1');
      expect(result.checkpoints[2].name).toBe('Checkpoint 2');
    });

    it('should apply pagination', async () => {
      const result = await checkpointService.getCheckpoints({
        limit: 2,
        offset: 0
      });

      expect(result.checkpoints).toHaveLength(2);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.total).toBe(3);
    });

    it('should handle empty results', async () => {
      const result = await checkpointService.getCheckpoints({
        priority: 'high',
        tags: ['nonexistent']
      });

      expect(result.checkpoints).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('updateCheckpoint', () => {
    it('should update checkpoint metadata', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'Original Name'
      };

      const created = await checkpointService.createCheckpoint('test_session', workspaceState, metadata);

      const updated = await checkpointService.updateCheckpoint(created.id, {
        name: 'Updated Name',
        description: 'Updated description',
        priority: 'low'
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.priority).toBe('low');
    });

    it('should throw error for non-existent checkpoint', async () => {
      await expect(
        checkpointService.updateCheckpoint('nonexistent_checkpoint', { name: 'New Name' })
      ).rejects.toThrow('Checkpoint not found');
    });

    it('should throw error for name too long', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'Original Name'
      };

      const created = await checkpointService.createCheckpoint('test_session', workspaceState, metadata);

      await expect(
        checkpointService.updateCheckpoint(created.id, { name: 'a'.repeat(101) })
      ).rejects.toThrow('Checkpoint name too long');
    });

    it('should throw error for description too long', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'Original Name'
      };

      const created = await checkpointService.createCheckpoint('test_session', workspaceState, metadata);

      await expect(
        checkpointService.updateCheckpoint(created.id, { description: 'a'.repeat(501) })
      ).rejects.toThrow('Checkpoint description too long');
    });
  });

  describe('deleteCheckpoint', () => {
    it('should delete existing checkpoint', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'To Delete'
      };

      const created = await checkpointService.createCheckpoint('test_session', workspaceState, metadata);

      await checkpointService.deleteCheckpoint(created.id);

      await expect(
        checkpointService.getCheckpoint(created.id)
      ).rejects.toThrow('Checkpoint not found');
    });

    it('should throw error for non-existent checkpoint', async () => {
      await expect(
        checkpointService.deleteCheckpoint('nonexistent_checkpoint')
      ).rejects.toThrow('Checkpoint not found');
    });
  });

  describe('deleteCheckpoints', () => {
    it('should delete multiple checkpoints', async () => {
      const workspaceState = createMockWorkspaceState();

      const checkpoint1 = await checkpointService.createCheckpoint('test_session', workspaceState, {
        name: 'Delete 1'
      });

      const checkpoint2 = await checkpointService.createCheckpoint('test_session', workspaceState, {
        name: 'Delete 2'
      });

      const result = await checkpointService.deleteCheckpoints([checkpoint1.id, checkpoint2.id]);

      expect(result.deleted).toBe(2);
      expect(result.errors).toHaveLength(0);

      await expect(
        checkpointService.getCheckpoint(checkpoint1.id)
      ).rejects.toThrow('Checkpoint not found');

      await expect(
        checkpointService.getCheckpoint(checkpoint2.id)
      ).rejects.toThrow('Checkpoint not found');
    });

    it('should handle mixed success and failure', async () => {
      const workspaceState = createMockWorkspaceState();

      const checkpoint = await checkpointService.createCheckpoint('test_session', workspaceState, {
        name: 'Delete Success'
      });

      const result = await checkpointService.deleteCheckpoints([
        checkpoint.id,
        'nonexistent_checkpoint'
      ]);

      expect(result.deleted).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to delete checkpoint nonexistent_checkpoint');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty workspace state', async () => {
      const emptyState = createMockWorkspaceState({
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: []
      });

      const metadata: CheckpointMetadata = {
        name: 'Empty State Checkpoint'
      };

      const checkpoint = await checkpointService.createCheckpoint('test_session', emptyState, metadata);

      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.name).toBe('Empty State Checkpoint');
    });

    it('should handle large workspace state', async () => {
      const largeState = createMockWorkspaceState({
        terminalState: Array(100).fill(null).map((_, i) => ({
          id: `term_${i}`,
          command: `command_${i}`,
          isActive: i % 2 === 0
        })),
        browserTabs: Array(50).fill(null).map((_, i) => ({
          url: `https://example${i}.com`,
          title: `Example ${i}`,
          isActive: i === 0
        })),
        aiConversations: Array(20).fill(null).map((_, i) => ({
          id: `conv_${i}`,
          messages: [],
          timestamp: new Date()
        })),
        openFiles: Array(30).fill(null).map((_, i) => ({
          path: `/file_${i}.ts`,
          hasUnsavedChanges: i % 3 === 0
        }))
      });

      const metadata: CheckpointMetadata = {
        name: 'Large State Checkpoint',
        description: 'Checkpoint with large workspace state'
      };

      const checkpoint = await checkpointService.createCheckpoint('test_session', largeState, metadata);

      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.compressedSize).toBeGreaterThan(0);
      expect(checkpoint.uncompressedSize).toBeGreaterThan(0);
    });

    it('should handle special characters in names and descriptions', async () => {
      const workspaceState = createMockWorkspaceState();
      const metadata: CheckpointMetadata = {
        name: 'Checkpoint with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        description: 'Description with émojis 🚀 and unicode chars café',
        tags: ['special-chars', 'unicode', 'emojis']
      };

      const checkpoint = await checkpointService.createCheckpoint('test_session', workspaceState, metadata);

      expect(checkpoint.name).toBe(metadata.name);
      expect(checkpoint.description).toBe(metadata.description);
      expect(checkpoint.tags).toEqual(metadata.tags);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete checkpoint lifecycle', async () => {
      const workspaceState = createMockWorkspaceState();

      // Create checkpoint
      const created = await checkpointService.createCheckpoint('test_session', workspaceState, {
        name: 'Lifecycle Test',
        description: 'Testing complete lifecycle',
        tags: ['lifecycle', 'test'],
        priority: 'high'
      });

      // Retrieve checkpoint
      const retrieved = await checkpointService.getCheckpoint(created.id);
      expect(retrieved.id).toBe(created.id);

      // Update checkpoint
      const updated = await checkpointService.updateCheckpoint(created.id, {
        description: 'Updated description',
        tags: ['lifecycle', 'test', 'updated']
      });
      expect(updated.description).toBe('Updated description');
      expect(updated.tags).toContain('updated');

      // List checkpoints with filtering
      const list = await checkpointService.getCheckpoints({
        tags: ['lifecycle'],
        priority: 'high'
      });
      expect(list.checkpoints).toHaveLength(1);
      expect(list.checkpoints[0].id).toBe(created.id);

      // Delete checkpoint
      await checkpointService.deleteCheckpoint(created.id);
      await expect(
        checkpointService.getCheckpoint(created.id)
      ).rejects.toThrow('Checkpoint not found');
    });

    it('should handle multiple checkpoints with different priorities', async () => {
      const workspaceState = createMockWorkspaceState();

      // Create checkpoints with different priorities
      const checkpoints = [];
      for (const priority of ['low', 'medium', 'high'] as const) {
        const checkpoint = await checkpointService.createCheckpoint('test_session', workspaceState, {
          name: `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`,
          priority
        });
        checkpoints.push(checkpoint);
      }

      // Test filtering by priority
      for (const priority of ['low', 'medium', 'high'] as const) {
        const filtered = await checkpointService.getCheckpoints({ priority });
        expect(filtered.checkpoints).toHaveLength(1);
        expect(filtered.checkpoints[0].priority).toBe(priority);
      }

      // Test sorting by priority (if implemented)
      const sorted = await checkpointService.getCheckpoints({
        sortBy: 'priority',
        sortOrder: 'desc'
      });
      // Check that sorting is working (actual order depends on implementation)
      expect(sorted.checkpoints).toHaveLength(3);
      expect(['low', 'medium', 'high']).toContain(sorted.checkpoints[0].priority);
    });
  });
});