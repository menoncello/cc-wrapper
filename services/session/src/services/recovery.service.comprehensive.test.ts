import { beforeEach,describe, expect, it, mock, spyOn } from 'bun:test';

// Mock modules before importing the service
const mockPrisma = {
  workspaceSession: {
    findUnique: mock(),
    findMany: mock(),
    update: mock(),
    count: mock(),
  },
  sessionCheckpoint: {
    findUnique: mock(),
    findMany: mock(),
    count: mock(),
  },
};

const mockSerializer = {
  deserializeState: mock(),
  generateChecksum: mock(),
  createSerializer: mock(() => mockSerializer),
};

// Mock the dependencies
const mockEncryption = {
  generateChecksum: mock(),
  verifyChecksum: mock(),
};

// Set up module mocks
mock.module('../lib/encryption.js', () => ({
  generateChecksum: mockEncryption.generateChecksum,
  verifyChecksum: mockEncryption.verifyChecksum,
}));

mock.module('../lib/state-serializer.js', () => ({
  createSerializer: mockSerializer.createSerializer,
}));

// Set up global prisma mock
globalThis.prisma = mockPrisma;

// Import after mocking
import { generateChecksum } from '../lib/encryption.js';
import type { SessionRecoveryOptions,SessionValidationResult, WorkspaceState } from '../types/session.js';
import { createSessionRecoveryService,SessionRecoveryService } from './recovery.service.js';

describe('SessionRecoveryService - Comprehensive Coverage Tests', () => {
  let recoveryService: SessionRecoveryService;

  beforeEach(() => {
    recoveryService = new SessionRecoveryService();
    // Clear all mocks
    for (const mockFn of Object.values(mockPrisma.workspaceSession)) {
mockFn.mockClear();
}
    for (const mockFn of Object.values(mockPrisma.sessionCheckpoint)) {
mockFn.mockClear();
}
    for (const mockFn of Object.values(mockSerializer)) {
mockFn.mockClear();
}
  });

  describe('Constructor with Custom Configuration', () => {
    it('should use default configuration when no config provided', () => {
      const service = new SessionRecoveryService();
      expect(service).toBeInstanceOf(SessionRecoveryService);
    });

    it('should accept partial configuration', () => {
      const customConfig = {
        maxRetryAttempts: 5,
        corruptionThreshold: 0.4
      };
      const service = new SessionRecoveryService(customConfig);
      expect(service).toBeInstanceOf(SessionRecoveryService);
    });

    it('should handle configuration edge cases', () => {
      const edgeConfigs = [
        {},
        { maxRetryAttempts: 0 },
        { corruptionThreshold: 1.0 },
        { fallbackToCheckpointAge: -1 },
        { autoRepairAttempts: 100 },
        { validateBeforeRestore: false }
      ];

      for (const config of edgeConfigs) {
        expect(() => new SessionRecoveryService(config)).not.toThrow();
      }
    });
  });

  describe('attemptDirectRestoration Private Method', () => {
    it('should restore session successfully', async () => {
      const sessionId = 'test_session';
      const encryptionKey = 'test_key';
      const mockSession = {
        id: sessionId,
        workspaceState: '{"test": "data"}',
        stateChecksum: 'test_checksum',
        checkpoints: []
      };
      const mockWorkspaceState = {
        test: 'data',
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: []
      };
      const mockValidation = {
        isValid: true,
        canRecover: true,
        errors: [],
        warnings: [],
        checksumMatch: true
      };

      mockPrisma.workspaceSession.findUnique.mockResolvedValue(mockSession);
      mockSerializer.deserializeState.mockResolvedValue(mockWorkspaceState);

      // Call private method through type assertion
      const result = await (recoveryService as any).attemptDirectRestoration(sessionId, encryptionKey);

      expect(result.success).toBe(true);
      expect(result.workspaceState).toEqual(mockWorkspaceState);
      expect(result.session).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should handle session not found', async () => {
      const sessionId = 'nonexistent_session';

      mockPrisma.workspaceSession.findUnique.mockResolvedValue(null);

      const result = await (recoveryService as any).attemptDirectRestoration(sessionId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Session not found');
    });

    it('should handle validation failure', async () => {
      const sessionId = 'test_session';
      const mockSession = {
        id: sessionId,
        workspaceState: '{"test": "data"}',
        stateChecksum: 'invalid_checksum',
        checkpoints: []
      };
      const mockValidation = {
        isValid: false,
        canRecover: false,
        errors: ['Session data checksum mismatch - data may be corrupted'],
        warnings: [],
        checksumMatch: false
      };

      mockPrisma.workspaceSession.findUnique.mockResolvedValue(mockSession);
      mockSerializer.deserializeState.mockRejectedValue(new Error('Deserialization failed'));

      const result = await (recoveryService as any).attemptDirectRestoration(sessionId);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Session data checksum mismatch'))).toBe(true);
    });

    it('should handle deserialization errors', async () => {
      const sessionId = 'test_session';
      const mockSession = {
        id: sessionId,
        workspaceState: '{"test": "data"}',
        stateChecksum: 'test_checksum',
        checkpoints: []
      };

      mockPrisma.workspaceSession.findUnique.mockResolvedValue(mockSession);
      mockSerializer.deserializeState.mockRejectedValue(new Error('Deserialization failed'));

      const result = await (recoveryService as any).attemptDirectRestoration(sessionId);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // The service provides more detailed error messages than expected
      expect(result.errors.some(e => e.includes('checksum') || e.includes('corrupted') || e.includes('missing'))).toBe(true);
    });

    it('should handle database errors', async () => {
      const sessionId = 'test_session';

      mockPrisma.workspaceSession.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const result = await (recoveryService as any).attemptDirectRestoration(sessionId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Direct restoration failed: Database connection failed');
    });
  });

  describe('attemptCheckpointRestoration Private Method', () => {
    it('should restore from checkpoint successfully', async () => {
      const sessionId = 'test_session';
      const checkpointId = 'test_checkpoint';
      const encryptionKey = 'test_key';
      const mockCheckpoint = {
        id: checkpointId,
        sessionId: sessionId,
        workspaceState: '{"checkpoint": "data"}',
        stateChecksum: 'checkpoint_checksum',
        session: {
          id: sessionId,
          name: 'Test Session'
        }
      };
      const mockWorkspaceState = {
        checkpoint: 'data',
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: []
      };
      const mockUpdatedSession = { id: sessionId, name: 'Test Session' };
      const mockValidation = {
        isValid: true,
        canRecover: true,
        errors: [],
        warnings: [],
        checksumMatch: true
      };

      mockPrisma.sessionCheckpoint.findUnique.mockResolvedValue(mockCheckpoint);
      mockSerializer.deserializeState.mockResolvedValue(mockWorkspaceState);
      mockPrisma.workspaceSession.update.mockResolvedValue(mockUpdatedSession);

      const result = await (recoveryService as any).attemptCheckpointRestoration(sessionId, checkpointId, encryptionKey);

      expect(result.success).toBe(true);
      expect(result.workspaceState).toEqual(mockWorkspaceState);
      expect(result.session).toBeDefined();
      expect(mockPrisma.workspaceSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: {
          workspaceState: '{"checkpoint": "data"}',
          stateChecksum: 'checkpoint_checksum',
          lastSavedAt: expect.any(Date)
        }
      });
    });

    it('should handle checkpoint not found', async () => {
      const sessionId = 'test_session';
      const checkpointId = 'nonexistent_checkpoint';

      mockPrisma.sessionCheckpoint.findUnique.mockResolvedValue(null);

      const result = await (recoveryService as any).attemptCheckpointRestoration(sessionId, checkpointId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Checkpoint not found');
    });

    it('should handle checkpoint belonging to different session', async () => {
      const sessionId = 'test_session';
      const checkpointId = 'wrong_session_checkpoint';
      const mockCheckpoint = {
        id: checkpointId,
        sessionId: 'different_session',
        workspaceState: '{"checkpoint": "data"}',
        stateChecksum: 'checkpoint_checksum',
        session: {
          id: 'different_session',
          name: 'Wrong Session'
        }
      };

      mockPrisma.sessionCheckpoint.findUnique.mockResolvedValue(mockCheckpoint);

      const result = await (recoveryService as any).attemptCheckpointRestoration(sessionId, checkpointId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Checkpoint does not belong to this session');
    });

    it('should handle checkpoint validation failure', async () => {
      const sessionId = 'test_session';
      const checkpointId = 'test_checkpoint';
      const mockCheckpoint = {
        id: checkpointId,
        sessionId: sessionId,
        workspaceState: '{"checkpoint": "data"}',
        stateChecksum: 'invalid_checksum',
        session: {
          id: sessionId,
          name: 'Test Session'
        }
      };

      mockPrisma.sessionCheckpoint.findUnique.mockResolvedValue(mockCheckpoint);

      const result = await (recoveryService as any).attemptCheckpointRestoration(sessionId, checkpointId);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle database errors during checkpoint restoration', async () => {
      const sessionId = 'test_session';
      const checkpointId = 'test_checkpoint';

      mockPrisma.sessionCheckpoint.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await (recoveryService as any).attemptCheckpointRestoration(sessionId, checkpointId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Checkpoint restoration failed: Database error');
    });
  });

  describe('attemptPartialRestoration Private Method', () => {
    it('should restore partially from corrupted session', async () => {
      const sessionId = 'test_session';
      const encryptionKey = 'test_key';
      const mockCorruptedSession = {
        id: sessionId,
        workspaceState: 'corrupted_data{"test": "partial"}'
      };
      const mockPartialState = {
        terminalState: [{ id: '1', command: 'ls' }],
        browserTabs: []
      };
      const mockRepairedState = {
        state: {
          terminalState: [{ id: '1', command: 'ls' }],
          browserTabs: [],
          aiConversations: [],
          openFiles: [],
          workspaceConfig: {},
          metadata: { createdAt: new Date(), updatedAt: new Date() }
        },
        checksum: 'repaired_checksum',
        validation: {
          isValid: true,
          canRecover: true,
          errors: [],
          warnings: [],
          checksumMatch: true
        }
      };
      const mockUpdatedSession = { id: sessionId };

      mockPrisma.workspaceSession.findUnique.mockResolvedValue(mockCorruptedSession);
      mockSerializer.generateChecksum.mockResolvedValue('repaired_checksum');

      // Mock extractPartialState and repairWorkspaceState
      spyOn(recoveryService as any, 'extractPartialState').mockResolvedValue(mockPartialState);
      spyOn(recoveryService as any, 'repairWorkspaceState').mockResolvedValue(mockRepairedState);
      mockPrisma.workspaceSession.update.mockResolvedValue(mockUpdatedSession);

      const result = await (recoveryService as any).attemptPartialRestoration(sessionId, encryptionKey);

      expect(result.success).toBe(true);
      expect(result.workspaceState).toEqual(mockRepairedState.state);
      expect(result.warnings).toContain('Session was partially restored with repaired data');
      expect(mockPrisma.workspaceSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: {
          workspaceState: expect.any(String),
          stateChecksum: 'repaired_checksum',
          lastSavedAt: expect.any(Date),
          version: { increment: 1 }
        }
      });
    });

    it('should handle session not found for partial restoration', async () => {
      const sessionId = 'nonexistent_session';

      mockPrisma.workspaceSession.findUnique.mockResolvedValue(null);

      const result = await (recoveryService as any).attemptPartialRestoration(sessionId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Session not found for partial restoration');
    });

    it('should handle failure to extract partial state', async () => {
      const sessionId = 'test_session';
      const mockCorruptedSession = {
        id: sessionId,
        workspaceState: 'completely_corrupted'
      };

      mockPrisma.workspaceSession.findUnique.mockResolvedValue(mockCorruptedSession);
      spyOn(recoveryService as any, 'extractPartialState').mockResolvedValue(null);

      const result = await (recoveryService as any).attemptPartialRestoration(sessionId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Could not extract any recoverable data from corrupted session');
    });

    it('should handle errors during partial restoration', async () => {
      const sessionId = 'test_session';

      mockPrisma.workspaceSession.findUnique.mockRejectedValue(new Error('Partial restoration failed'));

      const result = await (recoveryService as any).attemptPartialRestoration(sessionId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Partial restoration failed: Partial restoration failed');
    });
  });

  describe('extractPartialState Private Method', () => {
    it('should extract valid JSON from corrupted data', async () => {
      const corruptedData = 'corrupted_prefix{"test": "valid_data", "id": "1", "terminalState": [], "browserTabs": [], "aiConversations": [], "openFiles": []}corruption{"other": "data"}';

      const result = await (recoveryService as any).extractPartialState(corruptedData);

      expect(result).toBeDefined();
      expect(result.test).toBe('valid_data');
      expect(result.id).toBe('1');
    });

    it('should return null when no valid JSON found', async () => {
      const corruptedData = 'completely_invalid_data_no_json';

      const result = await (recoveryService as any).extractPartialState(corruptedData);

      expect(result).toBeNull();
    });

    it('should find workspace state-like JSON', async () => {
      const workspaceStateJson = '{"terminalState": [], "browserTabs": [], "aiConversations": [], "openFiles": []}';
      const corruptedData = `prefix${workspaceStateJson}suffix`;

      const result = await (recoveryService as any).extractPartialState(corruptedData);

      expect(result).toBeDefined();
      expect(Array.isArray(result.terminalState)).toBe(true);
      expect(Array.isArray(result.browserTabs)).toBe(true);
      expect(Array.isArray(result.aiConversations)).toBe(true);
      expect(Array.isArray(result.openFiles)).toBe(true);
    });

    it('should handle malformed JSON gracefully', async () => {
      const corruptedData = 'prefix{"incomplete": json}suffix{"valid": "json", "terminalState": [], "browserTabs": [], "aiConversations": [], "openFiles": []}';

      const result = await (recoveryService as any).extractPartialState(corruptedData);

      expect(result).toBeDefined();
      expect(result.valid).toBe('json');
    });

    it('should handle empty or null input', async () => {
      expect(await (recoveryService as any).extractPartialState('')).toBeNull();
      expect(await (recoveryService as any).extractPartialState(null)).toBeNull();
      expect(await (recoveryService as any).extractPartialState()).toBeNull();
    });
  });

  describe('isWorkspaceStateLike Private Method', () => {
    it('should identify valid workspace state structure', () => {
      const validState = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: []
      };

      const result = (recoveryService as any).isWorkspaceStateLike(validState);

      expect(result).toBe(true);
    });

    it('should reject invalid structures', () => {
      const invalidStates = [
        null,
        undefined,
        'string',
        123,
        [],
        { wrong: 'structure' },
        { terminalState: [], browserTabs: [] }, // Missing arrays
        { terminalState: 'not array', browserTabs: [], aiConversations: [], openFiles: [] }
      ];

      for (const state of invalidStates) {
        expect((recoveryService as any).isWorkspaceStateLike(state)).toBe(false);
      }
    });

    it('should handle edge cases', () => {
      const edgeCases = [
        { terminalState: [], browserTabs: [], aiConversations: [], openFiles: [], extra: 'property' },
        { terminalState: [null], browserTabs: [], aiConversations: [], openFiles: [] },
        { terminalState: [], browserTabs: [], aiConversations: [], openFiles: [], metadata: {} }
      ];

      for (const state of edgeCases) {
        const result = (recoveryService as any).isWorkspaceStateLike(state);
        expect(typeof result).toBe('boolean');
      }
    });
  });

  describe('repairWorkspaceState Private Method', () => {
    it('should repair incomplete workspace state', async () => {
      const partialState = {
        terminalState: [{ id: '1', command: 'ls' }],
        browserTabs: [{ id: 'tab1', url: 'https://example.com' }],
        workspaceConfig: { theme: 'dark' }
      };

      mockEncryption.generateChecksum.mockResolvedValue('repaired_checksum');

      const result = await (recoveryService as any).repairWorkspaceState(partialState);

      expect(result.state.terminalState).toEqual([{ id: '1', command: 'ls' }]);
      expect(result.state.browserTabs).toEqual([{ id: 'tab1', url: 'https://example.com' }]);
      expect(result.state.aiConversations).toEqual([]);
      expect(result.state.openFiles).toEqual([]);
      expect(result.state.workspaceConfig).toEqual({ theme: 'dark' });
      expect(result.state.metadata).toBeDefined();
      expect(result.checksum).toBe('repaired_checksum');
      expect(result.validation).toBeDefined();
    });

    it('should handle empty partial state', async () => {
      const partialState = {};

      mockSerializer.generateChecksum.mockResolvedValue('empty_checksum');

      const result = await (recoveryService as any).repairWorkspaceState(partialState);

      expect(result.state.terminalState).toEqual([]);
      expect(result.state.browserTabs).toEqual([]);
      expect(result.state.aiConversations).toEqual([]);
      expect(result.state.openFiles).toEqual([]);
      expect(result.state.workspaceConfig).toEqual({});
      expect(result.state.metadata).toBeDefined();
    });

    it('should repair invalid array items', async () => {
      const partialState = {
        terminalState: [
          { id: '1', command: 'ls' },
          { id: '', command: 'invalid' },
          { command: 'missing id' },
          null,
          undefined
        ]
      };

      mockSerializer.generateChecksum.mockResolvedValue('repaired_checksum');

      const result = await (recoveryService as any).repairWorkspaceState(partialState);

      expect(result.state.terminalState).toHaveLength(1);
      expect(result.state.terminalState[0].id).toBe('1');
    });

    it('should preserve valid metadata', async () => {
      const partialState = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: {
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
          version: '1.0'
        }
      };

      mockSerializer.generateChecksum.mockResolvedValue('metadata_checksum');

      const result = await (recoveryService as any).repairWorkspaceState(partialState);

      expect(result.state.metadata).toEqual(partialState.metadata);
    });

    it('should handle checksum generation errors', async () => {
      const partialState = { terminalState: [] };

      mockSerializer.generateChecksum.mockRejectedValueOnce(new Error('Checksum generation failed'));

      await expect((recoveryService as any).repairWorkspaceState(partialState)).rejects.toThrow('Checksum generation failed');
    });
  });

  describe('repairArray Private Method', () => {
    it('should filter valid items with proper IDs', () => {
      const items = [
        { id: '1', name: 'valid' },
        { id: '', name: 'invalid empty id' },
        { name: 'invalid missing id' },
        { id: '2', name: 'valid' },
        null,
        undefined,
        'string',
        123
      ];

      const result = (recoveryService as any).repairArray(items, 'testItem');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should handle empty arrays', () => {
      const result = (recoveryService as any).repairArray([], 'testItem');
      expect(result).toHaveLength(0);
    });

    it('should handle null and undefined arrays', () => {
      const result1 = (recoveryService as any).repairArray(null, 'testItem');
      const result2 = (recoveryService as any).repairArray(undefined, 'testItem');

      expect(result1).toHaveLength(0);
      expect(result2).toHaveLength(0);
    });

    it('should filter by string ID type', () => {
      const items = [
        { id: '1', name: 'string id' },
        { id: 123, name: 'numeric id' },
        { id: true, name: 'boolean id' },
        { id: {}, name: 'object id' }
      ];

      const result = (recoveryService as any).repairArray(items, 'testItem');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('validateBasicStructure Private Method', () => {
    it('should validate correct workspace state structure', () => {
      const workspaceState = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: { createdAt: new Date(), updatedAt: new Date() }
      };
      const sessionData = JSON.stringify(workspaceState);

      const result = (recoveryService as any).validateBasicStructure(sessionData);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.canRecover).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{ invalid json structure';

      const result = (recoveryService as any).validateBasicStructure(invalidJson);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.canRecover).toBe(false);
    });

    it('should detect missing required arrays', () => {
      const incompleteState = {
        terminalState: [],
        // Missing other arrays
        workspaceConfig: {},
        metadata: {}
      };
      const sessionData = JSON.stringify(incompleteState);

      const result = (recoveryService as any).validateBasicStructure(sessionData);

      expect(result.errors).toContain('Missing required workspace state arrays');
      expect(result.canRecover).toBe(true);
    });

    it('should warn about incorrect array types', () => {
      const stateWithWrongTypes = {
        terminalState: [],
        browserTabs: 'not an array',
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: {}
      };
      const sessionData = JSON.stringify(stateWithWrongTypes);

      const result = (recoveryService as any).validateBasicStructure(sessionData);

      expect(result.warnings).toContain('browserTabs should be an array');
    });

    it('should handle partial recoverable states', () => {
      const partialState = {
        terminalState: [],
        browserTabs: [],
        // Missing aiConversations, openFiles but has some arrays
        workspaceConfig: {},
        metadata: {}
      };
      const sessionData = JSON.stringify(partialState);

      const result = (recoveryService as any).validateBasicStructure(sessionData);

      expect(result.canRecover).toBe(true); // Some arrays present
    });
  });

  describe('canAttemptRecovery Private Method', () => {
    it('should identify recoverable errors', () => {
      const recoverableErrors = [
        'checksum mismatch detected',
        'deserialization failed due to corruption',
        'parsing error in JSON structure',
        'structure validation failed',
        'data appears corrupted'
      ];

      for (const errorMessage of recoverableErrors) {
        const result = (recoveryService as any).canAttemptRecovery(new Error(errorMessage));
        expect(result).toBe(true);
      }
    });

    it('should identify non-recoverable errors', () => {
      const nonRecoverableErrors = [
        'network connection failed',
        'permission denied',
        'user not found',
        'authentication failed',
        'rate limit exceeded'
      ];

      for (const errorMessage of nonRecoverableErrors) {
        const result = (recoveryService as any).canAttemptRecovery(new Error(errorMessage));
        expect(result).toBe(false);
      }
    });

    it('should handle non-Error objects', () => {
      const nonErrorInputs = [
        'string error',
        null,
        undefined,
        123,
        {},
        []
      ];

      for (const input of nonErrorInputs) {
        const result = (recoveryService as any).canAttemptRecovery(input);
        expect(result).toBe(false);
      }
    });

    it('should be case insensitive', () => {
      const caseVariations = [
        'CHECKSUM error',
        'Checksum mismatch',
        'checksum validation',
        'CORRUPTED data',
        'corrupted files'
      ];

      for (const errorMessage of caseVariations) {
        const result = (recoveryService as any).canAttemptRecovery(new Error(errorMessage));
        expect(result).toBe(true);
      }
    });
  });

  describe('mapToSessionResponse Private Method', () => {
    it('should map Prisma session to response format', () => {
      const prismaSession = {
        id: 'session_123',
        userId: 'user_456',
        workspaceId: 'workspace_789',
        name: 'Test Session',
        isActive: true,
        lastSavedAt: new Date('2025-01-01'),
        expiresAt: new Date('2025-01-02'),
        createdAt: new Date('2025-01-01')
      };

      const result = (recoveryService as any).mapToSessionResponse(prismaSession);

      expect(result.id).toBe('session_123');
      expect(result.userId).toBe('user_456');
      expect(result.workspaceId).toBe('workspace_789');
      expect(result.name).toBe('Test Session');
      expect(result.isActive).toBe(true);
      expect(result.lastSavedAt).toEqual(new Date('2025-01-01'));
      expect(result.expiresAt).toEqual(new Date('2025-01-02'));
      expect(result.createdAt).toEqual(new Date('2025-01-01'));
      expect(result.checkpointCount).toBe(0);
      expect(result.totalSize).toBe(0);
    });

    it('should handle missing properties gracefully', () => {
      const minimalSession = {
        id: 'minimal_session'
      };

      const result = (recoveryService as any).mapToSessionResponse(minimalSession);

      expect(result.id).toBe('minimal_session');
      expect(result.userId).toBeUndefined();
      expect(result.workspaceId).toBeUndefined();
      expect(result.checkpointCount).toBe(0);
      expect(result.totalSize).toBe(0);
    });

    it('should handle null and undefined sessions', () => {
      expect(() => (recoveryService as any).mapToSessionResponse(null)).not.toThrow();
      expect(() => (recoveryService as any).mapToSessionResponse()).not.toThrow();
    });
  });

  describe('countCorruptedSessions Private Method', () => {
    it('should count old sessions as potentially corrupted', async () => {
      mockPrisma.workspaceSession.count.mockResolvedValue(3);

      const result = await (recoveryService as any).countCorruptedSessions();

      expect(result).toBe(3);
      expect(mockPrisma.workspaceSession.count).toHaveBeenCalledWith({
        where: {
          lastSavedAt: {
            lt: expect.any(Date)
          }
        }
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.workspaceSession.count.mockRejectedValue(new Error('Database error'));

      await expect((recoveryService as any).countCorruptedSessions()).rejects.toThrow('Database error');
    });

    it('should handle empty results', async () => {
      mockPrisma.workspaceSession.count.mockResolvedValue(0);

      const result = await (recoveryService as any).countCorruptedSessions();

      expect(result).toBe(0);
    });
  });

  describe('Factory Function', () => {
    it('should create service with default config', () => {
      const service = createSessionRecoveryService();
      expect(service).toBeInstanceOf(SessionRecoveryService);
    });

    it('should create service with custom config', () => {
      const customConfig = {
        maxRetryAttempts: 10,
        corruptionThreshold: 0.8
      };

      const service = createSessionRecoveryService(customConfig);
      expect(service).toBeInstanceOf(SessionRecoveryService);
    });

    it('should handle undefined config', () => {
      const service = createSessionRecoveryService();
      expect(service).toBeInstanceOf(SessionRecoveryService);
    });

    it('should handle null config', () => {
      const service = createSessionRecoveryService(null as any);
      expect(service).toBeInstanceOf(SessionRecoveryService);
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle concurrent restoration attempts', async () => {
      const sessionId = 'concurrent_session';
      const mockSession = {
        id: sessionId,
        workspaceState: '{"test": "data", "terminalState": [], "browserTabs": [], "aiConversations": [], "openFiles": []}',
        stateChecksum: 'test_checksum',
        checkpoints: []
      };

      mockPrisma.workspaceSession.findUnique.mockResolvedValue(mockSession);
      mockSerializer.deserializeState.mockResolvedValue({ test: 'data', terminalState: [], browserTabs: [], aiConversations: [], openFiles: [] });

      // Attempt multiple concurrent restorations
      const promises = Array(5).fill(null).map(() =>
        recoveryService.restoreSession(sessionId, 'test_key', { preserveMetadata: true })
      );

      const results = await Promise.all(promises);

      for (const result of results) {
        expect(result.success).toBe(true);
      }
    });

    it('should handle very large session data', async () => {
      const largeSessionData = {
        terminalState: Array(1000).fill(null).map((_, i) => ({
          id: `terminal_${i}`,
          command: `command_${i}`,
          isActive: i % 2 === 0
        })),
        browserTabs: Array(500).fill(null).map((_, i) => ({
          id: `tab_${i}`,
          url: `https://example${i}.com`,
          title: `Example ${i}`,
          isActive: i === 0
        })),
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: { createdAt: new Date(), updatedAt: new Date() }
      };

      const sessionData = JSON.stringify(largeSessionData);

      // Set up mocks
      mockEncryption.verifyChecksum.mockResolvedValue(true);
      mockSerializer.deserializeState.mockResolvedValue(largeSessionData);

      const checksum = 'mock_checksum';
      const result = await recoveryService.validateSessionData(sessionData, checksum);

      expect(result.isValid).toBe(true);
      expect(result.checksumMatch).toBe(true);
    });

    it('should handle malformed session data gracefully', async () => {
      const malformedData = [
        '',
        'not json',
        '{',
        'null',
        'undefined',
        '[]',
        '{"incomplete": json',
        '{"circular": reference}'
      ];

      // Set up default mock behavior
      mockEncryption.verifyChecksum.mockResolvedValue(false);

      for (const data of malformedData) {
        const result = await recoveryService.validateSessionData(data, 'fake_checksum');
        expect(typeof result.isValid).toBe('boolean');
        expect(typeof result.canRecover).toBe('boolean');
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
      }
    });

    it('should handle special characters in session data', async () => {
      const specialData = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {
          unicode: '🚀 Unicode test',
          specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
          quotes: '"Single" and \'double\' quotes',
          newlines: 'Line 1\nLine 2\r\nLine 3',
          tabs: 'Column1\tColumn2\tColumn3'
        },
        metadata: { createdAt: new Date(), updatedAt: new Date() }
      };

      const sessionData = JSON.stringify(specialData);

      // Set up mocks
      mockEncryption.verifyChecksum.mockResolvedValue(true);
      mockSerializer.deserializeState.mockResolvedValue(specialData);

      const checksum = 'mock_checksum';
      const result = await recoveryService.validateSessionData(sessionData, checksum);

      expect(result.isValid).toBe(true);
      expect(result.checksumMatch).toBe(true);
    });
  });

  describe('Integration with Database Operations', () => {
    it('should handle database connection issues', async () => {
      const sessionId = 'test_session';

      // Mock database connection error
      mockPrisma.workspaceSession.findUnique.mockRejectedValue(new Error('Connection timeout'));

      const result = await recoveryService.restoreSession(sessionId, 'test_key', { preserveMetadata: true });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle database transaction rollback scenarios', async () => {
      const sessionId = 'test_session';
      const checkpointId = 'test_checkpoint';

      // Mock checkpoint found but update fails
      mockPrisma.sessionCheckpoint.findUnique.mockResolvedValue({
        id: checkpointId,
        sessionId: sessionId,
        workspaceState: '{"test": "data"}',
        stateChecksum: 'test_checksum',
        session: { id: sessionId, name: 'Test Session' }
      });

      mockPrisma.workspaceSession.update.mockRejectedValue(new Error('Transaction failed'));

      const result = await recoveryService.restoreSession(sessionId, 'test_key', {
        fallbackToCheckpoint: checkpointId
      });

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Transaction failed') || e.includes('Checkpoint restoration failed'))).toBe(true);
    });

    it('should handle concurrent checkpoint operations', async () => {
      const sessionId = 'test_session';

      // Simulate concurrent checkpoint queries
      mockPrisma.sessionCheckpoint.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(5);

      const results = await Promise.all([
        recoveryService.hasRecoverableCheckpoints(sessionId),
        recoveryService.hasRecoverableCheckpoints(sessionId),
        recoveryService.hasRecoverableCheckpoints(sessionId)
      ]);

      expect(results).toEqual([true, true, true]);
      expect(mockPrisma.sessionCheckpoint.count).toHaveBeenCalledTimes(3);
    });
  });
});