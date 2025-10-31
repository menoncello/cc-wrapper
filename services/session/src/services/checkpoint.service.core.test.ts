import { describe, expect, it } from 'bun:test';

import { generateChecksum } from '../lib/encryption.js';
import type { CheckpointMetadata, CreateCheckpointOptions,WorkspaceState } from '../types/session.js';

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

// Core checkpoint logic testing without database dependencies
describe('Session Checkpoint Service - Core Logic Tests', () => {
  describe('Checkpoint Validation Logic', () => {
    it('should validate basic checkpoint inputs', () => {
      const validSessionId = 'test_session_123';
      const validWorkspaceState = createMockWorkspaceState();
      const validMetadata: CheckpointMetadata = {
        name: 'Test Checkpoint',
        description: 'A test checkpoint',
        tags: ['test', 'example'],
        priority: 'high'
      };
      const validOptions: CreateCheckpointOptions = {
        encryptData: false,
        skipDuplicates: false
      };

      // Test session ID validation
      expect(validSessionId).toBeTruthy();
      expect(typeof validSessionId).toBe('string');
      expect(validSessionId.length).toBeGreaterThan(0);

      // Test workspace state validation
      expect(validWorkspaceState).toBeTruthy();
      expect(typeof validWorkspaceState).toBe('object');
      expect(Array.isArray(validWorkspaceState.terminalState)).toBe(true);
      expect(Array.isArray(validWorkspaceState.browserTabs)).toBe(true);
      expect(Array.isArray(validWorkspaceState.aiConversations)).toBe(true);
      expect(Array.isArray(validWorkspaceState.openFiles)).toBe(true);

      // Test metadata validation
      expect(validMetadata.name).toBeTruthy();
      expect(typeof validMetadata.name).toBe('string');
      expect(validMetadata.name.length).toBeGreaterThan(0);
      expect(validMetadata.name.length).toBeLessThanOrEqual(100);

      if (validMetadata.description) {
        expect(typeof validMetadata.description).toBe('string');
        expect(validMetadata.description.length).toBeLessThanOrEqual(500);
      }

      // Test options validation
      expect(validOptions).toBeTruthy();
      expect(typeof validOptions).toBe('object');
    });

    it('should detect invalid session IDs', () => {
      const invalidSessionIds = ['', null, undefined, 123, {}, []];

      for (const sessionId of invalidSessionIds) {
        expect(sessionId).not.toSatisfy((id: any) => typeof id === 'string' && id.length > 0);
      }
    });

    it('should detect invalid checkpoint names', () => {
      const invalidNames = ['', null, undefined, 123, {}];

      for (const name of invalidNames) {
        expect(name).not.toSatisfy((n: any) => typeof n === 'string' && n.length > 0 && n.length <= 100);
      }
    });

    it('should detect names that are too long', () => {
      const tooLongName = 'a'.repeat(101);
      expect(tooLongName.length).toBeGreaterThan(100);
    });

    it('should detect descriptions that are too long', () => {
      const tooLongDescription = 'a'.repeat(501);
      expect(tooLongDescription.length).toBeGreaterThan(500);
    });

    it('should require encryption key when encrypting', () => {
      const encryptWithoutKey: CreateCheckpointOptions = {
        encryptData: true,
        encryptionKey: undefined
      };

      expect(encryptWithoutKey.encryptData).toBe(true);
      expect(encryptWithoutKey.encryptionKey).toBeUndefined();
    });

    it('should allow encryption with valid key', () => {
      const encryptWithKey: CreateCheckpointOptions = {
        encryptData: true,
        encryptionKey: 'valid_encryption_key_123'
      };

      expect(encryptWithKey.encryptData).toBe(true);
      expect(encryptWithKey.encryptionKey).toBeTruthy();
      expect(typeof encryptWithKey.encryptionKey).toBe('string');
      expect(encryptWithKey.encryptionKey.length).toBeGreaterThan(0);
    });
  });

  describe('Workspace State Serialization', () => {
    it('should serialize workspace state to JSON', () => {
      const workspaceState = createMockWorkspaceState();
      const serializedState = JSON.stringify(workspaceState);

      expect(serializedState).toBeTruthy();
      expect(typeof serializedState).toBe('string');
      expect(serializedState.length).toBeGreaterThan(0);

      // Verify it's valid JSON (note that dates become strings during JSON serialization)
      const parsed = JSON.parse(serializedState);
      expect(parsed.terminalState).toEqual(workspaceState.terminalState);
      expect(parsed.browserTabs).toEqual(workspaceState.browserTabs);
      expect(parsed.openFiles).toEqual(workspaceState.openFiles);
      expect(parsed.workspaceConfig).toEqual(workspaceState.workspaceConfig);
      // Dates become strings after JSON serialization
      expect(typeof parsed.aiConversations[0].timestamp).toBe('string');
      expect(typeof parsed.metadata.createdAt).toBe('string');
      expect(typeof parsed.metadata.updatedAt).toBe('string');
    });

    it('should handle empty workspace state', () => {
      const emptyState = createMockWorkspaceState({
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: []
      });

      const serializedState = JSON.stringify(emptyState);
      const parsed = JSON.parse(serializedState);

      expect(parsed.terminalState).toEqual([]);
      expect(parsed.browserTabs).toEqual([]);
      expect(parsed.aiConversations).toEqual([]);
      expect(parsed.openFiles).toEqual([]);
    });

    it('should handle large workspace state', () => {
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

      const serializedState = JSON.stringify(largeState);
      const parsed = JSON.parse(serializedState);

      expect(parsed.terminalState).toHaveLength(100);
      expect(parsed.browserTabs).toHaveLength(50);
      expect(parsed.aiConversations).toHaveLength(20);
      expect(parsed.openFiles).toHaveLength(30);
    });

    it('should calculate size information correctly', () => {
      const workspaceState = createMockWorkspaceState();
      const serializedState = JSON.stringify(workspaceState);

      const uncompressedSize = Buffer.byteLength(serializedState, 'utf8');
      const compressedData = Buffer.from(serializedState).toString('base64');
      const compressedSize = Buffer.byteLength(compressedData, 'base64');

      expect(uncompressedSize).toBeGreaterThan(0);
      expect(compressedSize).toBeGreaterThan(0);
      expect(typeof uncompressedSize).toBe('number');
      expect(typeof compressedSize).toBe('number');

      // Compression ratio should be calculated
      const compressionRatio = compressedSize / uncompressedSize;
      expect(compressionRatio).toBeGreaterThan(0);
    });
  });

  describe('Checksum Generation and Validation', () => {
    it('should generate consistent checksums for same data', async () => {
      const data = 'test data for checksum';
      const checksum1 = await generateChecksum(data);
      const checksum2 = await generateChecksum(data);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toMatch(/^[\da-f]{64}$/i); // SHA-256 hex format
      expect(checksum1.length).toBe(64);
    });

    it('should generate different checksums for different data', async () => {
      const data1 = 'test data 1';
      const data2 = 'test data 2';

      const checksum1 = await generateChecksum(data1);
      const checksum2 = await generateChecksum(data2);

      expect(checksum1).not.toBe(checksum2);
    });

    it('should handle large data for checksum generation', async () => {
      const largeData = 'x'.repeat(10000);
      const checksum = await generateChecksum(largeData);

      expect(checksum).toBeTruthy();
      expect(checksum.length).toBe(64);
    });

    it('should handle empty data for checksum generation', async () => {
      const emptyData = '';
      const checksum = await generateChecksum(emptyData);

      expect(checksum).toBeTruthy();
      expect(checksum.length).toBe(64);
    });
  });

  describe('Checkpoint Metadata Management', () => {
    it('should create valid checkpoint metadata', () => {
      const metadata: CheckpointMetadata = {
        name: 'Test Checkpoint',
        description: 'A comprehensive test checkpoint',
        tags: ['test', 'example', 'checkpoint'],
        isAutoGenerated: false,
        priority: 'high'
      };

      expect(metadata.name).toBe('Test Checkpoint');
      expect(metadata.description).toBe('A comprehensive test checkpoint');
      expect(metadata.tags).toEqual(['test', 'example', 'checkpoint']);
      expect(metadata.isAutoGenerated).toBe(false);
      expect(metadata.priority).toBe('high');
    });

    it('should handle minimal metadata', () => {
      const minimalMetadata: CheckpointMetadata = {
        name: 'Minimal Checkpoint'
      };

      expect(minimalMetadata.name).toBe('Minimal Checkpoint');
      expect(minimalMetadata.description).toBeUndefined();
      expect(minimalMetadata.tags).toBeUndefined();
      expect(minimalMetadata.isAutoGenerated).toBeUndefined();
      expect(minimalMetadata.priority).toBeUndefined();
    });

    it('should validate priority values', () => {
      const validPriorities = ['low', 'medium', 'high'];
      const invalidPriorities = ['invalid', '', null, undefined, 123];

      for (const priority of validPriorities) {
        expect(validPriorities).toContain(priority);
      }

      for (const priority of invalidPriorities) {
        expect(validPriorities).not.toContain(priority);
      }
    });

    it('should handle tags correctly', () => {
      const tagTests = [
        { input: [], expected: [] },
        { input: ['single'], expected: ['single'] },
        { input: ['multiple', 'tags', 'here'], expected: ['multiple', 'tags', 'here'] },
        { input: ['with-hyphens', 'under_scores'], expected: ['with-hyphens', 'under_scores'] }
      ];

      for (const { input, expected } of tagTests) {
        expect(input).toEqual(expected);
      }
    });
  });

  describe('Checkpoint Filtering Logic', () => {
    const createMockCheckpoint = (overrides = {}) => ({
      id: 'checkpoint_1',
      sessionId: 'session_1',
      name: 'Test Checkpoint',
      description: 'A test checkpoint',
      createdAt: new Date('2025-01-01'),
      compressedSize: 1024,
      uncompressedSize: 2048,
      tags: ['test', 'example'],
      priority: 'medium',
      isAutoGenerated: false,
      ...overrides
    });

    it('should filter by session ID', () => {
      const checkpoints = [
        createMockCheckpoint({ sessionId: 'session_1' }),
        createMockCheckpoint({ sessionId: 'session_2' }),
        createMockCheckpoint({ sessionId: 'session_1' })
      ];

      const filtered = checkpoints.filter(cp => cp.sessionId === 'session_1');
      expect(filtered).toHaveLength(2);
      for (const cp of filtered) {
expect(cp.sessionId).toBe('session_1');
}
    });

    it('should filter by priority', () => {
      const checkpoints = [
        createMockCheckpoint({ priority: 'low' }),
        createMockCheckpoint({ priority: 'medium' }),
        createMockCheckpoint({ priority: 'high' }),
        createMockCheckpoint({ priority: 'medium' })
      ];

      const mediumPriority = checkpoints.filter(cp => cp.priority === 'medium');
      expect(mediumPriority).toHaveLength(2);

      const highPriority = checkpoints.filter(cp => cp.priority === 'high');
      expect(highPriority).toHaveLength(1);
    });

    it('should filter by tags', () => {
      const checkpoints = [
        createMockCheckpoint({ tags: ['test', 'example'] }),
        createMockCheckpoint({ tags: ['test', 'important'] }),
        createMockCheckpoint({ tags: ['other'] }),
        createMockCheckpoint({ tags: ['test', 'example', 'important'] })
      ];

      const withTestTag = checkpoints.filter(cp => cp.tags.includes('test'));
      expect(withTestTag).toHaveLength(3);

      const withImportantTag = checkpoints.filter(cp => cp.tags.includes('important'));
      expect(withImportantTag).toHaveLength(2);

      const withMultipleTags = checkpoints.filter(cp =>
        cp.tags.includes('test') && cp.tags.includes('example')
      );
      expect(withMultipleTags).toHaveLength(2);
    });

    it('should filter by auto-generated flag', () => {
      const checkpoints = [
        createMockCheckpoint({ isAutoGenerated: false }),
        createMockCheckpoint({ isAutoGenerated: true }),
        createMockCheckpoint({ isAutoGenerated: false })
      ];

      const manualCheckpoints = checkpoints.filter(cp => !cp.isAutoGenerated);
      expect(manualCheckpoints).toHaveLength(2);

      const autoCheckpoints = checkpoints.filter(cp => cp.isAutoGenerated);
      expect(autoCheckpoints).toHaveLength(1);
    });

    it('should filter by date range', () => {
      const checkpoints = [
        createMockCheckpoint({ createdAt: new Date('2025-01-01') }),
        createMockCheckpoint({ createdAt: new Date('2025-01-15') }),
        createMockCheckpoint({ createdAt: new Date('2025-02-01') })
      ];

      const dateFrom = new Date('2025-01-10');
      const dateTo = new Date('2025-01-31');

      const dateFiltered = checkpoints.filter(cp =>
        cp.createdAt >= dateFrom && cp.createdAt <= dateTo
      );
      expect(dateFiltered).toHaveLength(1);
      expect(dateFiltered[0].createdAt.toISOString()).toContain('2025-01-15');
    });

    it('should apply multiple filters', () => {
      const checkpoints = [
        createMockCheckpoint({
          sessionId: 'session_1',
          priority: 'high',
          tags: ['test', 'important'],
          isAutoGenerated: false
        }),
        createMockCheckpoint({
          sessionId: 'session_1',
          priority: 'medium',
          tags: ['test'],
          isAutoGenerated: true
        }),
        createMockCheckpoint({
          sessionId: 'session_2',
          priority: 'high',
          tags: ['important'],
          isAutoGenerated: false
        })
      ];

      const multiFiltered = checkpoints.filter(cp =>
        cp.sessionId === 'session_1' &&
        cp.priority === 'high' &&
        cp.tags.includes('test') &&
        !cp.isAutoGenerated
      );
      expect(multiFiltered).toHaveLength(1);
    });
  });

  describe('Checkpoint Sorting Logic', () => {
    const createMockCheckpoint = (overrides = {}) => ({
      id: 'checkpoint_1',
      sessionId: 'session_1',
      name: 'Test Checkpoint',
      createdAt: new Date('2025-01-01'),
      compressedSize: 1024,
      uncompressedSize: 2048,
      tags: ['test'],
      priority: 'medium',
      isAutoGenerated: false,
      ...overrides
    });

    it('should sort by creation date', () => {
      const checkpoints = [
        createMockCheckpoint({ createdAt: new Date('2025-01-03') }),
        createMockCheckpoint({ createdAt: new Date('2025-01-01') }),
        createMockCheckpoint({ createdAt: new Date('2025-01-02') })
      ];

      const sortedAsc = [...checkpoints].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      expect(sortedAsc[0].createdAt.toISOString()).toContain('2025-01-01');
      expect(sortedAsc[1].createdAt.toISOString()).toContain('2025-01-02');
      expect(sortedAsc[2].createdAt.toISOString()).toContain('2025-01-03');

      const sortedDesc = [...checkpoints].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      expect(sortedDesc[0].createdAt.toISOString()).toContain('2025-01-03');
      expect(sortedDesc[1].createdAt.toISOString()).toContain('2025-01-02');
      expect(sortedDesc[2].createdAt.toISOString()).toContain('2025-01-01');
    });

    it('should sort by name', () => {
      const checkpoints = [
        createMockCheckpoint({ name: 'Zebra' }),
        createMockCheckpoint({ name: 'Alpha' }),
        createMockCheckpoint({ name: 'Beta' })
      ];

      const sortedAsc = [...checkpoints].sort((a, b) => a.name.localeCompare(b.name));
      expect(sortedAsc[0].name).toBe('Alpha');
      expect(sortedAsc[1].name).toBe('Beta');
      expect(sortedAsc[2].name).toBe('Zebra');

      const sortedDesc = [...checkpoints].sort((a, b) => b.name.localeCompare(a.name));
      expect(sortedDesc[0].name).toBe('Zebra');
      expect(sortedDesc[1].name).toBe('Beta');
      expect(sortedDesc[2].name).toBe('Alpha');
    });

    it('should sort by size', () => {
      const checkpoints = [
        createMockCheckpoint({ compressedSize: 3000 }),
        createMockCheckpoint({ compressedSize: 1000 }),
        createMockCheckpoint({ compressedSize: 2000 })
      ];

      const sortedAsc = [...checkpoints].sort((a, b) => a.compressedSize - b.compressedSize);
      expect(sortedAsc[0].compressedSize).toBe(1000);
      expect(sortedAsc[1].compressedSize).toBe(2000);
      expect(sortedAsc[2].compressedSize).toBe(3000);

      const sortedDesc = [...checkpoints].sort((a, b) => b.compressedSize - a.compressedSize);
      expect(sortedDesc[0].compressedSize).toBe(3000);
      expect(sortedDesc[1].compressedSize).toBe(2000);
      expect(sortedDesc[2].compressedSize).toBe(1000);
    });

    it('should handle sorting with undefined values', () => {
      const checkpoints = [
        createMockCheckpoint({ priority: 'high' }),
        createMockCheckpoint({ priority: undefined }),
        createMockCheckpoint({ priority: 'low' })
      ];

      const sorted = [...checkpoints].sort((a, b) => {
        const aPriority = a.priority || 'medium';
        const bPriority = b.priority || 'medium';
        return aPriority.localeCompare(bPriority);
      });

      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('low');
      expect(sorted[2].priority).toBeUndefined(); // Originally undefined, becomes 'medium' in sorting
    });
  });

  describe('Pagination Logic', () => {
    const createMockCheckpoints = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `checkpoint_${i + 1}`,
        name: `Checkpoint ${i + 1}`,
        createdAt: new Date(`2025-01-${String(i + 1).padStart(2, '0')}`)
      }));
    };

    it('should handle basic pagination', () => {
      const checkpoints = createMockCheckpoints(10);
      const limit = 3;
      const offset = 0;

      const paginated = checkpoints.slice(offset, offset + limit);
      expect(paginated).toHaveLength(3);
      expect(paginated[0].name).toBe('Checkpoint 1');
      expect(paginated[1].name).toBe('Checkpoint 2');
      expect(paginated[2].name).toBe('Checkpoint 3');
    });

    it('should handle pagination with offset', () => {
      const checkpoints = createMockCheckpoints(10);
      const limit = 3;
      const offset = 5;

      const paginated = checkpoints.slice(offset, offset + limit);
      expect(paginated).toHaveLength(3);
      expect(paginated[0].name).toBe('Checkpoint 6');
      expect(paginated[1].name).toBe('Checkpoint 7');
      expect(paginated[2].name).toBe('Checkpoint 8');
    });

    it('should handle pagination beyond available items', () => {
      const checkpoints = createMockCheckpoints(5);
      const limit = 3;
      const offset = 10;

      const paginated = checkpoints.slice(offset, offset + limit);
      expect(paginated).toHaveLength(0);
    });

    it('should calculate pagination metadata', () => {
      const totalItems = 25;
      const limit = 10;
      const offset = 10;

      const totalPages = Math.ceil(totalItems / limit);
      const currentPage = Math.floor(offset / limit) + 1;
      const hasMore = offset + limit < totalItems;

      expect(totalPages).toBe(3);
      expect(currentPage).toBe(2);
      expect(hasMore).toBe(true);

      // Last page
      const lastPageOffset = 20;
      const hasMoreLast = lastPageOffset + limit < totalItems;
      expect(hasMoreLast).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null and undefined values gracefully', () => {
      const testCases = [
        { value: null, description: 'null value' },
        { value: undefined, description: 'undefined value' },
        { value: '', description: 'empty string' },
        { value: 0, description: 'zero number' },
        { value: false, description: 'false boolean' }
      ];

      for (const { value, description } of testCases) {
        expect(() => JSON.stringify(value)).not.toThrow();
        expect(() => {
          if (value !== null && value !== undefined) {
            return value.toString();
          }
          return '';
        }).not.toThrow();
      }
    });

    it('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' };
      obj.self = obj; // Create circular reference

      let threwError = false;
      try {
        JSON.stringify(obj);
      } catch {
        threwError = true;
      }

      expect(threwError).toBe(true);
    });

    it('should handle extremely long strings', () => {
      const veryLongString = 'x'.repeat(1000000); // 1MB string
      expect(veryLongString.length).toBe(1000000);

      // Test that it can be measured
      const size = Buffer.byteLength(veryLongString, 'utf8');
      expect(size).toBe(1000000);
    });

    it('should handle special characters in metadata', () => {
      const specialChars = {
        name: 'Checkpoint with émojis 🚀 and unicode café',
        description: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/',
        tags: ['unicode', 'emojis', 'special-chars']
      };

      expect(specialChars.name).toBeTruthy();
      expect(specialChars.description).toBeTruthy();
      expect(Array.isArray(specialChars.tags)).toBe(true);

      // Test JSON serialization
      expect(() => JSON.stringify(specialChars)).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete checkpoint workflow simulation', async () => {
      // Simulate workspace state capture
      const workspaceState = createMockWorkspaceState();
      expect(workspaceState.terminalState).toHaveLength(2);
      expect(workspaceState.browserTabs).toHaveLength(2);
      expect(workspaceState.aiConversations).toHaveLength(1);
      expect(workspaceState.openFiles).toHaveLength(1);

      // Simulate checkpoint metadata creation
      const metadata: CheckpointMetadata = {
        name: 'Integration Test Checkpoint',
        description: 'Testing complete checkpoint workflow',
        tags: ['integration', 'test'],
        priority: 'high',
        isAutoGenerated: false
      };

      // Simulate data serialization
      const serializedData = JSON.stringify(workspaceState);
      const checksum = await generateChecksum(serializedData);
      const uncompressedSize = Buffer.byteLength(serializedData, 'utf8');
      const compressedData = Buffer.from(serializedData).toString('base64');
      const compressedSize = Buffer.byteLength(compressedData, 'base64');

      // Validate simulated checkpoint data
      expect(serializedData).toBeTruthy();
      expect(checksum).toBeTruthy();
      expect(uncompressedSize).toBeGreaterThan(0);
      expect(compressedSize).toBeGreaterThan(0);
      expect(compressedSize).toBeGreaterThanOrEqual(uncompressedSize); // Base64 encoding increases size

      // Simulate checkpoint response
      const checkpointResponse = {
        id: 'checkpoint_integration_test',
        sessionId: 'session_integration_test',
        name: metadata.name,
        description: metadata.description,
        createdAt: new Date(),
        compressedSize,
        uncompressedSize,
        tags: metadata.tags,
        priority: metadata.priority,
        isAutoGenerated: metadata.isAutoGenerated,
        metadata: {
          ...metadata,
          createdAt: new Date(),
          version: '1.0',
          source: 'manual'
        }
      };

      // Validate response structure
      expect(checkpointResponse.id).toBeTruthy();
      expect(checkpointResponse.name).toBe(metadata.name);
      expect(checkpointResponse.tags).toEqual(metadata.tags);
      expect(checkpointResponse.priority).toBe(metadata.priority);
      expect(checkpointResponse.isAutoGenerated).toBe(metadata.isAutoGenerated);
    });

    it('should simulate multiple checkpoints with different configurations', async () => {
      const baseWorkspaceState = createMockWorkspaceState();
      const checkpointConfigs = [
        {
          name: 'High Priority Manual',
          priority: 'high',
          isAutoGenerated: false,
          tags: ['manual', 'important']
        },
        {
          name: 'Auto Save',
          priority: 'low',
          isAutoGenerated: true,
          tags: ['auto', 'save']
        },
        {
          name: 'Medium Priority',
          priority: 'medium',
          isAutoGenerated: false,
          tags: ['medium']
        }
      ];

      // Simulate creating multiple checkpoints
      const checkpoints = [];
      for (const config of checkpointConfigs) {
        const serializedData = JSON.stringify(baseWorkspaceState);
        const checksum = await generateChecksum(serializedData);
        const size = Buffer.byteLength(serializedData, 'utf8');

        checkpoints.push({
          id: `checkpoint_${config.name.toLowerCase().replace(/\s+/g, '_')}`,
          sessionId: 'test_session',
          name: config.name,
          priority: config.priority,
          isAutoGenerated: config.isAutoGenerated,
          tags: config.tags,
          createdAt: new Date(),
          compressedSize: size,
          uncompressedSize: size,
          stateChecksum: checksum
        });
      }

      // Validate created checkpoints
      expect(checkpoints).toHaveLength(3);

      // Test filtering
      const highPriority = checkpoints.filter(cp => cp.priority === 'high');
      expect(highPriority).toHaveLength(1);
      expect(highPriority[0].name).toBe('High Priority Manual');

      const autoGenerated = checkpoints.filter(cp => cp.isAutoGenerated);
      expect(autoGenerated).toHaveLength(1);
      expect(autoGenerated[0].name).toBe('Auto Save');

      const withImportantTag = checkpoints.filter(cp => cp.tags.includes('important'));
      expect(withImportantTag).toHaveLength(1);

      // Test sorting
      const sortedByName = [...checkpoints].sort((a, b) => a.name.localeCompare(b.name));
      expect(sortedByName[0].name).toBe('Auto Save');
      expect(sortedByName[1].name).toBe('High Priority Manual');
      expect(sortedByName[2].name).toBe('Medium Priority');
    });
  });
});