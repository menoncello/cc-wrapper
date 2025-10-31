import { afterEach,beforeEach, describe, expect, it } from 'bun:test';

import { generateChecksum, verifyChecksum } from '../lib/encryption.js';
import type { SessionValidationResult,WorkspaceState } from '../types/session.js';
import { createSessionRecoveryService,SessionRecoveryService } from './recovery.service.js';

describe('Session Recovery Service - Core Functionality', () => {
  let recoveryService: SessionRecoveryService;

  beforeEach(() => {
    recoveryService = new SessionRecoveryService();
  });

  describe('constructor and factory functions', () => {
    it('should create service with default configuration', () => {
      const service = new SessionRecoveryService();
      expect(service).toBeInstanceOf(SessionRecoveryService);
    });

    it('should create service with custom configuration', () => {
      const customConfig = {
        maxRetryAttempts: 5,
        corruptionThreshold: 0.5,
        fallbackToCheckpointAge: 60,
        autoRepairAttempts: 4,
        validateBeforeRestore: false
      };

      const service = new SessionRecoveryService(customConfig);
      expect(service).toBeInstanceOf(SessionRecoveryService);
    });

    it('should create service via factory function', () => {
      const service = createSessionRecoveryService();
      expect(service).toBeInstanceOf(SessionRecoveryService);
    });
  });

  describe('validateSessionData', () => {
    it('should validate session data with correct checksum', async () => {
      const workspaceState = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: { createdAt: new Date(), updatedAt: new Date() }
      };
      const sessionData = JSON.stringify(workspaceState);
      const checksum = await generateChecksum(sessionData);

      const result = await recoveryService.validateSessionData(sessionData, checksum);

      expect(result.isValid).toBe(true);
      expect(result.checksumMatch).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect checksum mismatch', async () => {
      const workspaceState = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: { createdAt: new Date(), updatedAt: new Date() }
      };
      const sessionData = JSON.stringify(workspaceState);
      const wrongChecksum = 'wrong_checksum';

      const result = await recoveryService.validateSessionData(sessionData, wrongChecksum);

      expect(result.isValid).toBe(false);
      expect(result.checksumMatch).toBe(false);
      expect(result.errors).toContain('Session data checksum mismatch - data may be corrupted');
    });

    it('should validate basic structure without encryption key', async () => {
      const workspaceState = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: { createdAt: new Date(), updatedAt: new Date() }
      };
      const sessionData = JSON.stringify(workspaceState);
      const checksum = await generateChecksum(sessionData);

      const result = await recoveryService.validateSessionData(sessionData, checksum);

      expect(result.isValid).toBe(true);
      expect(result.canRecover).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required arrays in basic structure', async () => {
      const invalidState = {
        terminalState: [],
        // Missing browserTabs, aiConversations, openFiles
        workspaceConfig: {},
        metadata: { createdAt: new Date(), updatedAt: new Date() }
      };
      const sessionData = JSON.stringify(invalidState);
      const checksum = await generateChecksum(sessionData);

      const result = await recoveryService.validateSessionData(sessionData, checksum);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required workspace state arrays');
      expect(result.canRecover).toBe(true); // Partial recovery is possible
    });

    it('should warn about incorrect array types', async () => {
      const stateWithWrongTypes = {
        terminalState: [],
        browserTabs: [], // Should be array
        aiConversations: 'not an array', // Wrong type
        openFiles: [],
        workspaceConfig: {},
        metadata: { createdAt: new Date(), updatedAt: new Date() }
      };
      const sessionData = JSON.stringify(stateWithWrongTypes);
      const checksum = await generateChecksum(sessionData);

      const result = await recoveryService.validateSessionData(sessionData, checksum);

      expect(result.warnings).toContain('aiConversations should be an array');
    });
  });

  describe('validateBasicStructure', () => {
    it('should validate correct workspace state structure', async () => {
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

    it('should reject non-object data', () => {
      const nonObject = JSON.stringify('just a string');

      const result = (recoveryService as any).validateBasicStructure(nonObject);

      expect(result.errors).toContain('Invalid JSON structure');
      expect(result.canRecover).toBe(false);
    });
  });

  describe('isWorkspaceStateLike', () => {
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

    it('should reject invalid workspace state structure', () => {
      const invalidState = {
        wrong: 'structure',
        missing: 'arrays'
      };

      const result = (recoveryService as any).isWorkspaceStateLike(invalidState);

      expect(result).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect((recoveryService as any).isWorkspaceStateLike(null)).toBe(false);
      expect((recoveryService as any).isWorkspaceStateLike()).toBe(false);
    });

    it('should reject non-objects', () => {
      expect((recoveryService as any).isWorkspaceStateLike('string')).toBe(false);
      expect((recoveryService as any).isWorkspaceStateLike(123)).toBe(false);
      expect((recoveryService as any).isWorkspaceStateLike([])).toBe(false);
    });
  });

  describe('canAttemptRecovery', () => {
    it('should identify recoverable errors', () => {
      const recoverableErrors = [
        'checksum mismatch detected',
        'deserialization failed due to corruption',
        'parsing error in JSON structure',
        'structure validation failed',
        'data appears corrupted'
      ];

      for (const error of recoverableErrors) {
        const result = (recoveryService as any).canAttemptRecovery(new Error(error));
        expect(result).toBe(true);
      }
    });

    it('should identify non-recoverable errors', () => {
      const nonRecoverableErrors = [
        'network connection failed',
        'permission denied',
        'user not found'
      ];

      for (const error of nonRecoverableErrors) {
        const result = (recoveryService as any).canAttemptRecovery(new Error(error));
        expect(result).toBe(false);
      }
    });

    it('should handle non-Error objects', () => {
      expect((recoveryService as any).canAttemptRecovery('string error')).toBe(false);
      expect((recoveryService as any).canAttemptRecovery(null)).toBe(false);
      expect((recoveryService as any).canAttemptRecovery()).toBe(false);
    });
  });

  describe('extractPartialState', () => {
    it('should extract valid JSON from corrupted data', async () => {
      const workspaceStateData = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: []
      };
      const corruptedData = `corrupted_prefix${JSON.stringify(workspaceStateData)}more_corruption`;

      const result = await (recoveryService as any).extractPartialState(corruptedData);

      expect(result).toBeDefined();
      expect(result.terminalState).toEqual([]);
      expect(result.browserTabs).toEqual([]);
      expect(result.aiConversations).toEqual([]);
      expect(result.openFiles).toEqual([]);
    });

    it('should return null when no valid JSON found', async () => {
      const corruptedData = 'completely invalid data with no json objects';

      const result = await (recoveryService as any).extractPartialState(corruptedData);

      expect(result).toBeNull();
    });

    it('should handle malformed JSON gracefully', async () => {
      const corruptedData = 'prefix{"incomplete": json}suffix';

      const result = await (recoveryService as any).extractPartialState(corruptedData);

      expect(result).toBeNull();
    });

    it('should identify workspace state in mixed content', async () => {
      const workspaceStateJson = '{"terminalState": [], "browserTabs": [], "aiConversations": [], "openFiles": []}';
      const corruptedData = `prefix${workspaceStateJson}suffix`;

      const result = await (recoveryService as any).extractPartialState(corruptedData);

      expect(result).toBeDefined();
      expect(result.terminalState).toEqual([]);
      expect(result.browserTabs).toEqual([]);
      expect(result.aiConversations).toEqual([]);
      expect(result.openFiles).toEqual([]);
    });
  });

  describe('repairArray', () => {
    it('should filter valid items with proper IDs', () => {
      const items = [
        { id: '1', name: 'valid' },
        { id: '', name: 'invalid empty id' },
        { name: 'invalid missing id' },
        { id: '2', name: 'valid' }
      ];

      const repaired = (recoveryService as any).repairArray(items, 'testItem');

      expect(repaired).toHaveLength(2);
      expect(repaired[0].id).toBe('1');
      expect(repaired[1].id).toBe('2');
    });

    it('should handle empty arrays', () => {
      const repaired = (recoveryService as any).repairArray([], 'testItem');
      expect(repaired).toHaveLength(0);
    });

    it('should handle null/undefined arrays', () => {
      const repaired1 = (recoveryService as any).repairArray(null, 'testItem');
      const repaired2 = (recoveryService as any).repairArray(undefined, 'testItem');

      expect(repaired1).toHaveLength(0);
      expect(repaired2).toHaveLength(0);
    });

    it('should filter out non-object items', () => {
      const items = [
        { id: '1', name: 'valid' },
        'string item',
        123,
        null,
        undefined,
        { id: '2', name: 'valid' }
      ];

      const repaired = (recoveryService as any).repairArray(items, 'testItem');

      expect(repaired).toHaveLength(2);
      expect(repaired[0].id).toBe('1');
      expect(repaired[1].id).toBe('2');
    });
  });

  describe('calculateStateCompleteness', () => {
    it('should calculate score for complete state', () => {
      const completeState = {
        terminalState: [
          { id: '1', command: 'ls', isActive: true },
          { id: '2', command: 'cd /tmp', isActive: false }
        ],
        browserTabs: [
          { url: 'https://example.com', title: 'Example', isActive: true },
          { url: 'https://test.com', title: 'Test', isActive: false }
        ],
        aiConversations: [
          { id: '1', messages: [], timestamp: new Date() },
          { id: '2', messages: [], timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Recent
        ],
        openFiles: [
          { path: '/file1.ts', hasUnsavedChanges: true },
          { path: '/file2.ts', hasUnsavedChanges: false }
        ],
        workspaceConfig: { theme: 'dark', fontSize: 14 },
        metadata: { version: '1.0', lastSaved: new Date() }
      };

      const score = (recoveryService as any).calculateStateCompleteness(completeState);

      expect(score).toBeGreaterThan(0);
      // Terminal: 2 * 10 + 50 (bonus for active) = 70
      // Browser: 2 * 5 + 30 (bonus for active) = 40
      // AI: 2 * 15 + 10 (one-time bonus for recent) = 40
      // Files: 2 * 8 + 25 (bonus for unsaved) = 41
      // Config: 2 * 3 = 6
      // Metadata: 2 * 2 = 4
      // Total expected: 70 + 40 + 40 + 41 + 6 + 4 = 201
      expect(score).toBe(201);
    });

    it('should calculate score for empty state', () => {
      const emptyState = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: {}
      };

      const score = (recoveryService as any).calculateStateCompleteness(emptyState);

      expect(score).toBe(0);
    });

    it('should handle missing properties gracefully', () => {
      const partialState = {
        terminalState: [{ id: '1', command: 'ls', isActive: true }]
        // Missing other properties
      };

      const score = (recoveryService as any).calculateStateCompleteness(partialState);

      expect(score).toBeGreaterThan(0);
    });

    it('should add bonuses for active elements', () => {
      const stateWithActive = {
        terminalState: [{ id: '1', command: 'ls', isActive: true }],
        browserTabs: [{ url: 'https://example.com', title: 'Example', isActive: true }],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: {}
      };

      const score = (recoveryService as any).calculateStateCompleteness(stateWithActive);

      expect(score).toBeGreaterThan(10 + 5); // Base scores + bonuses
    });

    it('should add bonuses for unsaved changes', () => {
      const stateWithUnsaved = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [{ path: '/file.ts', hasUnsavedChanges: true }],
        workspaceConfig: {},
        metadata: {}
      };

      const score = (recoveryService as any).calculateStateCompleteness(stateWithUnsaved);

      expect(score).toBe(8 + 25); // Base score + unsaved bonus = 33
    });
  });

  describe('resolveMergeConflicts', () => {
    const createMockWorkspaceState = (overrides = {}): WorkspaceState => ({
      terminalState: [],
      browserTabs: [],
      aiConversations: [],
      openFiles: [],
      workspaceConfig: {},
      metadata: { createdAt: new Date(), updatedAt: new Date() },
      ...overrides
    });

    it('should handle single state without conflicts', async () => {
      const state = createMockWorkspaceState({ test: 'data' });
      const sessionStates = [{
        workspaceState: state,
        lastSavedAt: new Date(),
        source: 'primary'
      }];

      const result = await recoveryService.resolveMergeConflicts(sessionStates);

      expect(result.resolvedState).toEqual(state);
      expect(result.conflicts).toHaveLength(0);
      expect(result.warnings).toContain('Only one session state provided, no merge needed');
    });

    it('should merge using latest strategy', async () => {
      const latestState = createMockWorkspaceState({
        terminalState: [{ id: '1', command: 'ls' }]
      });
      const olderState = createMockWorkspaceState({
        terminalState: [{ id: '2', command: 'pwd' }]
      });

      const sessionStates = [
        {
          workspaceState: olderState,
          lastSavedAt: new Date('2025-01-01'),
          source: 'checkpoint'
        },
        {
          workspaceState: latestState,
          lastSavedAt: new Date('2025-01-02'),
          source: 'primary'
        }
      ];

      const result = await recoveryService.resolveMergeConflicts(sessionStates, 'latest');

      // The merge combines unique items from all states
      expect(result.resolvedState.terminalState).toHaveLength(2);
      expect(result.resolvedState.terminalState).toContainEqual({ id: '1', command: 'ls' });
      expect(result.resolvedState.terminalState).toContainEqual({ id: '2', command: 'pwd' });
    });

    it('should merge arrays by unique field', async () => {
      const state1 = createMockWorkspaceState({
        terminalState: [
          { id: '1', command: 'ls', isActive: true },
          { id: '2', command: 'cd /tmp', isActive: false }
        ]
      });

      const state2 = createMockWorkspaceState({
        terminalState: [
          { id: '2', command: 'cd /home', isActive: true }, // Same ID, different command
          { id: '3', command: 'mkdir test', isActive: false }
        ]
      });

      const sessionStates = [
        {
          workspaceState: state1,
          lastSavedAt: new Date('2025-01-01'),
          source: 'primary'
        },
        {
          workspaceState: state2,
          lastSavedAt: new Date('2025-01-02'),
          source: 'checkpoint'
        }
      ];

      const result = await recoveryService.resolveMergeConflicts(sessionStates, 'latest');

      // Should have 3 terminals (unique IDs: 1, 2, 3)
      expect(result.resolvedState.terminalState).toHaveLength(3);
      expect(result.resolvedState.terminalState.find(t => t.id === '1')).toBeDefined();
      expect(result.resolvedState.terminalState.find(t => t.id === '2')).toBeDefined();
      expect(result.resolvedState.terminalState.find(t => t.id === '3')).toBeDefined();

      // Should detect conflict for terminal 2
      const terminalConflict = result.conflicts.find(c => c.field === 'terminalState.id');
      expect(terminalConflict).toBeDefined();
    });

    it('should merge using most-complete strategy', async () => {
      const completeState = createMockWorkspaceState({
        terminalState: [
          { id: '1', command: 'ls', isActive: true },
          { id: '2', command: 'cd /tmp', isActive: false }
        ],
        browserTabs: [
          { url: 'https://example.com', title: 'Example', isActive: true }
        ],
        aiConversations: [
          { id: '1', messages: [], timestamp: new Date() }
        ]
      });

      const incompleteState = createMockWorkspaceState({
        terminalState: [
          { id: '3', command: 'pwd', isActive: false }
        ]
      });

      const sessionStates = [
        {
          workspaceState: incompleteState,
          lastSavedAt: new Date('2025-01-01'),
          source: 'checkpoint'
        },
        {
          workspaceState: completeState,
          lastSavedAt: new Date('2025-01-02'),
          source: 'primary'
        }
      ];

      const result = await recoveryService.resolveMergeConflicts(sessionStates, 'most-complete');

      expect(result.warnings.some(w => w.includes('most complete state'))).toBe(true);
      expect(result.resolvedState.terminalState.length).toBeGreaterThan(0);
    });

    it('should handle manual merge strategy', async () => {
      const state1 = createMockWorkspaceState({ test: 'value1' });
      const state2 = createMockWorkspaceState({ test: 'value2' });

      const sessionStates = [
        {
          workspaceState: state1,
          lastSavedAt: new Date('2025-01-01'),
          source: 'primary'
        },
        {
          workspaceState: state2,
          lastSavedAt: new Date('2025-01-02'),
          source: 'checkpoint'
        }
      ];

      const result = await recoveryService.resolveMergeConflicts(sessionStates, 'manual');

      expect(result.warnings).toContain('Manual merge mode - conflicts detected but require manual resolution');
      expect(result.resolvedState.test).toBe('value2'); // Keeps latest as base (state2 is newer)
    });

    it('should handle empty session states array', async () => {
      await expect(recoveryService.resolveMergeConflicts([])).rejects.toThrow('No session states provided for merge resolution');
    });

    it('should handle merge errors gracefully', async () => {
      const invalidState = null as any;
      const sessionStates = [{
        workspaceState: invalidState,
        lastSavedAt: new Date(),
        source: 'primary'
      }];

      const result = await recoveryService.resolveMergeConflicts(sessionStates);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('shouldMarkAsConflict', () => {
    it('should detect conflicts based on timestamp differences', () => {
      const existing = { timestamp: '2025-01-01T10:00:00Z', content: 'same' };
      const incoming = { timestamp: '2025-01-01T12:00:00Z', content: 'same' }; // 2 hour difference

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);
      expect(result).toBe(true);
    });

    it('should detect conflicts based on content differences', () => {
      const existing = { timestamp: '2025-01-01T10:00:00Z', content: 'different' };
      const incoming = { timestamp: '2025-01-01T10:30:00Z', content: 'also different' }; // Same timestamp-ish, different content

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);
      expect(result).toBe(true);
    });

    it('should detect conflicts based on state differences', () => {
      const existing = { isActive: true, content: 'same' };
      const incoming = { isActive: false, content: 'same' }; // Different active state

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);
      expect(result).toBe(true);
    });

    it('should not mark as conflict when data is similar', () => {
      const existing = { timestamp: '2025-01-01T10:00:00Z', content: 'same', isActive: true };
      const incoming = { timestamp: '2025-01-01T10:00:30Z', content: 'same', isActive: true }; // Minor time difference only (30 seconds)

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);
      expect(result).toBe(false);
    });

    it('should handle missing fields gracefully', () => {
      const existing = { content: 'some content' };
      const incoming = { timestamp: '2025-01-01T10:00:00Z', content: 'some content' };

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);
      expect(result).toBe(false); // No significant differences detected
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle invalid inputs gracefully', async () => {
      // Test with null session data
      const result1 = await recoveryService.validateSessionData('', 'checksum');
      expect(result1.isValid).toBe(false);
      expect(result1.errors.length).toBeGreaterThan(0);

      // Test with undefined checksum
      const result2 = await recoveryService.validateSessionData('{}', undefined as any);
      expect(result2.isValid).toBe(false);
    });

    it('should handle circular references in JSON', async () => {
      const obj: any = { name: 'test' };
      obj.self = obj; // Circular reference

      try {
        JSON.stringify(obj);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        // Circular reference detected
        expect(error).toBeDefined();
      }
    });

    it('should handle very large session data', async () => {
      const largeData = {
        terminalState: Array(1000).fill(null).map((_, i) => ({
          id: `terminal_${i}`,
          command: `command_${i}`,
          isActive: i % 2 === 0
        })),
        browserTabs: Array(500).fill(null).map((_, i) => ({
          url: `https://example${i}.com`,
          title: `Example ${i}`,
          isActive: i === 0
        })),
        aiConversations: Array(100).fill(null).map((_, i) => ({
          id: `conv_${i}`,
          messages: Array(10).fill(null).map((_, j) => ({
            role: j % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${i}_${j}`
          })),
          timestamp: new Date()
        })),
        openFiles: Array(200).fill(null).map((_, i) => ({
          path: `/file_${i}.ts`,
          hasUnsavedChanges: i % 3 === 0
        })),
        workspaceConfig: {
          theme: 'dark',
          fontSize: 14,
          ...Object.fromEntries(Array(50).fill(null).map((_, i) => [`config_${i}`, `value_${i}`]))
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ...Object.fromEntries(Array(20).fill(null).map((_, i) => [`meta_${i}`, `meta_value_${i}`]))
        }
      };

      const sessionData = JSON.stringify(largeData);
      const checksum = await generateChecksum(sessionData);

      const result = await recoveryService.validateSessionData(sessionData, checksum);

      expect(result.isValid).toBe(true);
      expect(result.checksumMatch).toBe(true);
    });
  });
});

describe('Session Recovery Service - Integration Scenarios', () => {
  let recoveryService: SessionRecoveryService;

  beforeEach(() => {
    recoveryService = new SessionRecoveryService();
  });

  it('should handle complex merge conflict resolution', async () => {
    const conflictingStates = [
      {
        workspaceState: {
          terminalState: [
            { id: '1', command: 'ls', isActive: true, timestamp: '2025-01-01T10:00:00Z' },
            { id: '2', command: 'cd /tmp', isActive: false, timestamp: '2025-01-01T09:00:00Z' }
          ],
          browserTabs: [
            { url: 'https://example.com', title: 'Example', isActive: true },
            { url: 'https://test.com', title: 'Test', isActive: false }
          ],
          aiConversations: [],
          openFiles: [],
          workspaceConfig: { theme: 'dark' },
          metadata: { createdAt: new Date(), updatedAt: new Date() }
        },
        lastSavedAt: new Date('2025-01-02'),
        source: 'primary'
      },
      {
        workspaceState: {
          terminalState: [
            { id: '1', command: 'ls -la', isActive: false, timestamp: '2025-01-01T11:00:00Z' }, // Same ID, different command/time
            { id: '3', command: 'mkdir new', isActive: true, timestamp: '2025-01-01T12:00:00Z' }
          ],
          browserTabs: [
            { url: 'https://example.com', title: 'Example Updated', isActive: true }, // Same URL, different title
            { url: 'https://another.com', title: 'Another', isActive: false }
          ],
          aiConversations: [{ id: '1', messages: [], timestamp: new Date() }],
          openFiles: [{ path: '/new.ts', hasUnsavedChanges: true }],
          workspaceConfig: { theme: 'light', fontSize: 14 },
          metadata: { createdAt: new Date(), updatedAt: new Date() }
        },
        lastSavedAt: new Date('2025-01-01'),
        source: 'checkpoint'
      }
    ];

    const result = await recoveryService.resolveMergeConflicts(conflictingStates, 'latest');

    expect(result.resolvedState).toBeDefined();
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);

    // Should have terminals from both sources (unique IDs: 1, 2, 3)
    expect(result.resolvedState.terminalState).toHaveLength(3);

    // Should detect conflict for terminal 1 (same ID, different command/time)
    const terminalConflict = result.conflicts.find(c => c.field === 'terminalState.id');
    expect(terminalConflict).toBeDefined();

    // Browser tabs have different composite keys (url + title), so all are unique
    // All 4 tabs have different composite keys, so no conflicts and all are merged
    expect(result.resolvedState.browserTabs).toHaveLength(4); // 2 from primary + 2 from checkpoint (all unique)
  });

  it('should handle workspace state repair scenario', async () => {
    const partialState = {
      terminalState: [
        { id: '1', command: 'ls' },
        { id: '', command: 'invalid' }, // Invalid ID
        { command: 'missing id' } // Missing ID
      ],
      browserTabs: [
        { id: '1', url: 'https://example.com', title: 'Example' },
        null, // Null item
        undefined // Undefined item
      ],
      // Missing aiConversations and openFiles - should be filled with empty arrays
      workspaceConfig: { theme: 'dark' }
    };

    const isValidState = (state: any): state is WorkspaceState => {
      return (
        state &&
        typeof state === 'object' &&
        Array.isArray(state.terminalState) &&
        Array.isArray(state.browserTabs) &&
        Array.isArray(state.aiConversations) &&
        Array.isArray(state.openFiles) &&
        typeof state.workspaceConfig === 'object' &&
        typeof state.metadata === 'object'
      );
    };

    // Test the array repair functionality
    const repairedTerminals = (recoveryService as any).repairArray(partialState.terminalState, 'terminal');
    expect(repairedTerminals).toHaveLength(1);
    expect(repairedTerminals[0].id).toBe('1');

    const repairedBrowserTabs = (recoveryService as any).repairArray(partialState.browserTabs, 'browserTab');
    expect(repairedBrowserTabs).toHaveLength(1);
    expect(repairedBrowserTabs[0].url).toBe('https://example.com');

    // Test workspace state structure validation
    expect(isValidState(partialState)).toBe(false); // Missing required arrays
  });
});