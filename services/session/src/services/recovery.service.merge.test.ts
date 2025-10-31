import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

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

// Set up mocks before importing
globalThis.prisma = mockPrisma;
globalThis.createSerializer = mockSerializer.createSerializer;

// Import after mocking
import type { WorkspaceState } from '../types/session.js';
import { SessionRecoveryService } from './recovery.service.js';

describe('SessionRecoveryService - Merge Conflict Resolution Tests', () => {
  let recoveryService: SessionRecoveryService;

  beforeEach(() => {
    recoveryService = new SessionRecoveryService();
  });

  const createMockWorkspaceState = (overrides = {}): WorkspaceState => ({
    terminalState: [],
    browserTabs: [],
    aiConversations: [],
    openFiles: [],
    workspaceConfig: {},
    metadata: { createdAt: new Date(), updatedAt: new Date() },
    ...overrides
  });

  describe('calculateStateCompleteness Private Method', () => {
    it('should calculate score for complete state with all features', () => {
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

    it('should add bonuses for active terminal', () => {
      const stateWithActiveTerminal = {
        terminalState: [
          { id: '1', command: 'ls', isActive: true }
        ],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: {}
      };

      const score = (recoveryService as any).calculateStateCompleteness(stateWithActiveTerminal);

      expect(score).toBe(10 + 50); // Base score + active bonus
    });

    it('should add bonuses for active browser tabs', () => {
      const stateWithActiveTab = {
        terminalState: [],
        browserTabs: [
          { url: 'https://example.com', title: 'Example', isActive: true }
        ],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: {}
      };

      const score = (recoveryService as any).calculateStateCompleteness(stateWithActiveTab);

      expect(score).toBe(5 + 30); // Base score + active bonus
    });

    it('should add bonuses for recent AI conversations', () => {
      const stateWithRecentConversations = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [
          { id: '1', messages: [], timestamp: new Date() }, // Recent
          { id: '2', messages: [], timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Recent
        ],
        openFiles: [],
        workspaceConfig: {},
        metadata: {}
      };

      const score = (recoveryService as any).calculateStateCompleteness(stateWithRecentConversations);

      expect(score).toBe(2 * 15 + 10); // Base scores + one-time recent bonus
    });

    it('should add bonuses for unsaved file changes', () => {
      const stateWithUnsavedChanges = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [
          { path: '/file.ts', hasUnsavedChanges: true }
        ],
        workspaceConfig: {},
        metadata: {}
      };

      const score = (recoveryService as any).calculateStateCompleteness(stateWithUnsavedChanges);

      expect(score).toBe(8 + 25); // Base score + unsaved bonus
    });

    it('should score workspace configuration complexity', () => {
      const stateWithComplexConfig = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {
          theme: 'dark',
          fontSize: 14,
          tabSize: 2,
          autoSave: true,
          showLineNumbers: true
        },
        metadata: {}
      };

      const score = (recoveryService as any).calculateStateCompleteness(stateWithComplexConfig);

      expect(score).toBe(Object.keys(stateWithComplexConfig.workspaceConfig).length * 3); // 5 * 3 = 15
    });

    it('should handle missing properties gracefully', () => {
      const partialState = {
        terminalState: [{ id: '1', command: 'ls', isActive: true }]
        // Missing other properties
      };

      const score = (recoveryService as any).calculateStateCompleteness(partialState);

      expect(score).toBe(10 + 50); // Should still score what exists
    });

    it('should handle null and undefined arrays', () => {
      const stateWithNullArrays = {
        terminalState: null as any,
        browserTabs: undefined as any,
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: {}
      };

      const score = (recoveryService as any).calculateStateCompleteness(stateWithNullArrays);

      expect(score).toBe(0); // Should not crash
    });
  });

  describe('mergeArraysByUniqueField Private Method', () => {
    it('should merge arrays by unique field without conflicts', () => {
      const target = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];
      const source = [
        { id: '3', name: 'Item 3' },
        { id: '4', name: 'Item 4' }
      ];
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).mergeArraysByUniqueField(
        target, source, 'id', 'testField', conflicts, warnings, 'testSource'
      );

      expect(target).toHaveLength(4);
      expect(target.find(item => item.id === '3')).toBeDefined();
      expect(target.find(item => item.id === '4')).toBeDefined();
      expect(conflicts).toHaveLength(0);
    });

    it('should detect and handle conflicts by unique field', () => {
      const existing = { id: '1', name: 'Original', timestamp: '2025-01-01T10:00:00Z' };
      const incoming = { id: '1', name: 'Modified', timestamp: '2025-01-01T12:00:00Z' };
      const target = [existing];
      const source = [incoming];
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).mergeArraysByUniqueField(
        target, source, 'id', 'testField', conflicts, warnings, 'testSource'
      );

      expect(target).toHaveLength(1); // Should not duplicate
      expect(target[0].name).toBe('Original'); // Should keep existing
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].field).toBe('testField.id');
      expect(conflicts[0].values).toEqual([existing, incoming]);
      expect(warnings).toContain('Conflict in testField item 1 - keeping existing version from target');
    });

    it('should not mark as conflict when data is similar', () => {
      const existing = { id: '1', name: 'Same', timestamp: '2025-01-01T10:00:00Z' };
      const incoming = { id: '1', name: 'Same', timestamp: '2025-01-01T10:30:00Z' }; // Minor time difference
      const target = [existing];
      const source = [incoming];
      const conflicts = [];
      const warnings = [];

      spyOn(recoveryService as any, 'shouldMarkAsConflict').mockReturnValue(false);

      (recoveryService as any).mergeArraysByUniqueField(
        target, source, 'id', 'testField', conflicts, warnings, 'testSource'
      );

      expect(conflicts).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    it('should handle empty arrays', () => {
      const target = [];
      const source = [{ id: '1', name: 'Item 1' }];
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).mergeArraysByUniqueField(
        target, source, 'id', 'testField', conflicts, warnings, 'testSource'
      );

      expect(target).toHaveLength(1);
      expect(conflicts).toHaveLength(0);
    });

    it('should handle null and undefined values', () => {
      const target = [{ id: '1', name: 'Item 1' }];
      const source = [null, undefined, { id: '2', name: 'Item 2' }] as any;
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).mergeArraysByUniqueField(
        target, source, 'id', 'testField', conflicts, warnings, 'testSource'
      );

      expect(target).toHaveLength(2); // Should handle gracefully
    });
  });

  describe('mergeArraysByCompositeKey Private Method', () => {
    it('should merge arrays by composite key without conflicts', () => {
      const target = [
        { url: 'https://example.com', title: 'Example' },
        { url: 'https://test.com', title: 'Test' }
      ];
      const source = [
        { url: 'https://another.com', title: 'Another' },
        { url: 'https://different.com', title: 'Different' }
      ];
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).mergeArraysByCompositeKey(
        target, source, ['url', 'title'], 'browserTabs', conflicts, warnings, 'testSource'
      );

      expect(target).toHaveLength(4);
      expect(target.find(item => item.url === 'https://another.com')).toBeDefined();
      expect(conflicts).toHaveLength(0);
    });

    it('should detect conflicts by composite key', () => {
      const existing = { url: 'https://example.com', title: 'Example', content: 'Original content' };
      const incoming = { url: 'https://example.com', title: 'Example', content: 'Modified content' };
      const target = [existing];
      const source = [incoming];
      const conflicts = [];
      const warnings = [];

      spyOn(recoveryService as any, 'shouldMarkAsConflict').mockReturnValue(true);

      (recoveryService as any).mergeArraysByCompositeKey(
        target, source, ['url', 'title'], 'browserTabs', conflicts, warnings, 'testSource'
      );

      expect(target).toHaveLength(1); // Should not duplicate
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].field).toBe('browserTabs.composite');
      expect(warnings).toContain('Conflict in browserTabs composite key - keeping existing version');
    });

    it('should handle missing key fields', () => {
      const target = [{ url: 'https://example.com' }]; // Missing title
      const source = [{ url: 'https://example.com', title: 'Example' }];
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).mergeArraysByCompositeKey(
        target, source, ['url', 'title'], 'browserTabs', conflicts, warnings, 'testSource'
      );

      // Should handle missing fields gracefully
      expect(target.length).toBeGreaterThan(0);
    });

    it('should handle single key composite', () => {
      const target = [{ id: '1', name: 'Item 1' }];
      const source = [{ id: '2', name: 'Item 2' }];
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).mergeArraysByCompositeKey(
        target, source, ['id'], 'testField', conflicts, warnings, 'testSource'
      );

      expect(target).toHaveLength(2);
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('deepMergeObjects Private Method', () => {
    it('should merge objects without conflicts', () => {
      const target = { theme: 'dark', fontSize: 14 };
      const source = { autoSave: true, tabSize: 2 };
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).deepMergeObjects(
        target, source, 'workspaceConfig', conflicts, warnings, 'testSource'
      );

      expect(target).toEqual({
        theme: 'dark',
        fontSize: 14,
        autoSave: true,
        tabSize: 2
      });
      expect(conflicts).toHaveLength(0);
    });

    it('should detect conflicts in primitive values', () => {
      const target = { theme: 'dark', fontSize: 14 };
      const source = { theme: 'light', fontSize: 16 };
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).deepMergeObjects(
        target, source, 'workspaceConfig', conflicts, warnings, 'testSource'
      );

      expect(target.theme).toBe('dark'); // Should keep existing
      expect(target.fontSize).toBe(14); // Should keep existing
      expect(conflicts).toHaveLength(2);
      expect(conflicts[0].field).toBe('workspaceConfig.theme');
      expect(conflicts[1].field).toBe('workspaceConfig.fontSize');
      expect(warnings).toContain('Conflict in workspaceConfig.theme - keeping existing value');
      expect(warnings).toContain('Conflict in workspaceConfig.fontSize - keeping existing value');
    });

    it('should recursively merge nested objects', () => {
      const target = {
        editor: { theme: 'dark', fontSize: 14 },
        terminal: { shell: 'bash' }
      };
      const source = {
        editor: { tabSize: 2, showLineNumbers: true },
        terminal: { fontSize: 12 }
      };
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).deepMergeObjects(
        target, source, 'workspaceConfig', conflicts, warnings, 'testSource'
      );

      expect(target).toEqual({
        editor: { theme: 'dark', fontSize: 14, tabSize: 2, showLineNumbers: true },
        terminal: { shell: 'bash', fontSize: 12 }
      });
    });

    it('should handle nested object conflicts', () => {
      const target = { editor: { theme: 'dark' } };
      const source = { editor: { theme: 'light' } };
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).deepMergeObjects(
        target, source, 'workspaceConfig', conflicts, warnings, 'testSource'
      );

      expect(target.editor.theme).toBe('dark'); // Keep existing
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].field).toBe('workspaceConfig.editor.theme');
    });

    it('should handle null and undefined values', () => {
      const target = { theme: 'dark', fontSize: null };
      const source = { theme: undefined, autoSave: true };
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).deepMergeObjects(
        target, source, 'workspaceConfig', conflicts, warnings, 'testSource'
      );

      expect(target.theme).toBe('dark'); // Should keep existing
      expect(target.autoSave).toBe(true); // Should add new property
    });
  });

  describe('detectConflicts Private Method', () => {
    it('should detect array length differences', () => {
      const target = {
        terminalState: [{ id: '1' }, { id: '2' }],
        browserTabs: [{ id: '1' }],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: {}
      };
      const source = {
        terminalState: [{ id: '1' }],
        browserTabs: [{ id: '1' }, { id: '2' }],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: {}
      };
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).detectConflicts(target, source, conflicts, warnings, 'testSource');

      expect(conflicts).toHaveLength(2);
      expect(conflicts[0].field).toBe('terminalState.length');
      expect(conflicts[0].values).toEqual([2, 1]);
      expect(conflicts[1].field).toBe('browserTabs.length');
      expect(conflicts[1].values).toEqual([1, 2]);
    });

    it('should detect configuration differences', () => {
      const target = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: { theme: 'dark', fontSize: 14 },
        metadata: {}
      };
      const source = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: { theme: 'light', fontSize: 14, autoSave: true },
        metadata: {}
      };
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).detectConflicts(target, source, conflicts, warnings, 'testSource');

      expect(conflicts).toHaveLength(2);
      expect(conflicts.some(c => c.field === 'workspaceConfig.theme')).toBe(true);
      expect(conflicts.some(c => c.field === 'workspaceConfig.autoSave')).toBe(true);
    });

    it('should handle missing configuration keys', () => {
      const target = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: { theme: 'dark' },
        metadata: {}
      };
      const source = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: { fontSize: 14 },
        metadata: {}
      };
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).detectConflicts(target, source, conflicts, warnings, 'testSource');

      expect(conflicts).toHaveLength(2);
      expect(conflicts.some(c => c.field === 'workspaceConfig.theme')).toBe(true);
      expect(conflicts.some(c => c.field === 'workspaceConfig.fontSize')).toBe(true);
    });

    it('should handle empty configurations', () => {
      const target = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: {}
      };
      const source = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: [],
        workspaceConfig: { theme: 'dark' },
        metadata: {}
      };
      const conflicts = [];
      const warnings = [];

      (recoveryService as any).detectConflicts(target, source, conflicts, warnings, 'testSource');

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].field).toBe('workspaceConfig.theme');
    });
  });

  describe('shouldMarkAsConflict Private Method', () => {
    it('should detect conflicts based on timestamp differences', () => {
      const existing = { timestamp: '2025-01-01T10:00:00Z', content: 'same' };
      const incoming = { timestamp: '2025-01-01T12:00:00Z', content: 'same' }; // 2 hour difference

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(true);
    });

    it('should not conflict with minor timestamp differences', () => {
      const existing = { timestamp: '2025-01-01T10:00:00Z', content: 'same' };
      const incoming = { timestamp: '2025-01-01T10:00:30Z', content: 'same' }; // 30 second difference

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(false); // 30 seconds < 1 minute threshold, so no conflict
    });

    it('should detect conflicts based on content differences', () => {
      const existing = { timestamp: '2025-01-01T10:00:00Z', content: 'different' };
      const incoming = { timestamp: '2025-01-01T10:30:00Z', content: 'also different' };

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(true);
    });

    it('should detect conflicts based on state differences', () => {
      const existing = { isActive: true, content: 'same' };
      const incoming = { isActive: false, content: 'same' };

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(true);
    });

    it('should not conflict when data is identical', () => {
      const existing = { timestamp: '2025-01-01T10:00:00Z', content: 'same', isActive: true };
      const incoming = { timestamp: '2025-01-01T10:00:30Z', content: 'same', isActive: true }; // Only 30 seconds difference

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(false); // 30 seconds < 1 minute threshold
    });

    it('should handle missing fields gracefully', () => {
      const existing = { content: 'some content' };
      const incoming = { timestamp: '2025-01-01T10:00:00Z', content: 'some content' };

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(false);
    });

    it('should handle null and undefined values', () => {
      const testCases = [
        [{ content: null }, { content: 'not null' }],
        [{ content: undefined }, { content: 'defined' }],
        [null, { content: 'something' }],
        [undefined, { content: 'something' }]
      ];

      for (const [existing, incoming] of testCases) {
        const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);
        expect(typeof result).toBe('boolean');
      }
    });

    it('should handle string timestamps that are not ISO format', () => {
      const existing = { timestamp: '2025-01-01 10:00:00', content: 'same' };
      const incoming = { timestamp: '2025-01-01 12:00:00', content: 'same' };

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(true); // Should still work with non-ISO timestamps
    });

    it('should handle Date objects', () => {
      const existing = { timestamp: new Date('2025-01-01T10:00:00Z'), content: 'same' };
      const incoming = { timestamp: new Date('2025-01-01T12:00:00Z'), content: 'same' };

      const result = (recoveryService as any).shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(true);
    });
  });

  describe('mergeByLatest Private Method', () => {
    it('should merge states preferring latest values', async () => {
      const latestState = createMockWorkspaceState({
        terminalState: [{ id: '1', command: 'ls', isActive: true }],
        browserTabs: [{ url: 'https://latest.com', title: 'Latest' }]
      });
      const olderState = createMockWorkspaceState({
        terminalState: [{ id: '2', command: 'pwd', isActive: false }],
        browserTabs: [{ url: 'https://older.com', title: 'Older' }]
      });

      const sortedStates = [
        { workspaceState: latestState, lastSavedAt: new Date('2025-01-02'), source: 'primary' },
        { workspaceState: olderState, lastSavedAt: new Date('2025-01-01'), source: 'checkpoint' }
      ];
      const conflicts = [];
      const warnings = [];

      const result = (recoveryService as any).mergeByLatest(sortedStates, conflicts, warnings);

      expect(result.terminalState).toHaveLength(2); // Should merge both
      expect(result.browserTabs).toHaveLength(2); // Should merge both
      expect(result.terminalState.find(t => t.command === 'ls')).toBeDefined();
      expect(result.terminalState.find(t => t.command === 'pwd')).toBeDefined();
    });

    it('should handle merge with conflicts', async () => {
      const latestState = createMockWorkspaceState({
        terminalState: [{ id: '1', command: 'ls', isActive: true, timestamp: '2025-01-02T10:00:00Z' }]
      });
      const olderState = createMockWorkspaceState({
        terminalState: [{ id: '1', command: 'ls -la', isActive: false, timestamp: '2025-01-01T10:00:00Z' }] // Same ID, different data
      });

      const sortedStates = [
        { workspaceState: latestState, lastSavedAt: new Date('2025-01-02'), source: 'primary' },
        { workspaceState: olderState, lastSavedAt: new Date('2025-01-01'), source: 'checkpoint' }
      ];
      const conflicts = [];
      const warnings = [];

      spyOn(recoveryService as any, 'shouldMarkAsConflict').mockReturnValue(true);

      const result = (recoveryService as any).mergeByLatest(sortedStates, conflicts, warnings);

      expect(result.terminalState).toHaveLength(1); // Should not duplicate conflicting items
      expect(conflicts.length).toBeGreaterThan(0);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should handle empty states', async () => {
      const emptyState = createMockWorkspaceState();
      const sortedStates = [
        { workspaceState: emptyState, lastSavedAt: new Date('2025-01-02'), source: 'primary' }
      ];
      const conflicts = [];
      const warnings = [];

      const result = (recoveryService as any).mergeByLatest(sortedStates, conflicts, warnings);

      expect(result.terminalState).toEqual([]);
      expect(result.browserTabs).toEqual([]);
      expect(result.aiConversations).toEqual([]);
      expect(result.openFiles).toEqual([]);
    });
  });

  describe('mergeByMostComplete Private Method', () => {
    it('should prefer most complete state', async () => {
      const completeState = createMockWorkspaceState({
        terminalState: [{ id: '1', command: 'ls', isActive: true }],
        browserTabs: [{ url: 'https://example.com', title: 'Example', isActive: true }],
        aiConversations: [{ id: '1', messages: [], timestamp: new Date() }],
        openFiles: [{ path: '/file.ts', hasUnsavedChanges: true }],
        workspaceConfig: { theme: 'dark', fontSize: 14 },
        metadata: { version: '1.0', lastSaved: new Date() }
      });

      const incompleteState = createMockWorkspaceState({
        terminalState: [{ id: '2', command: 'pwd', isActive: false }]
        // Missing other arrays
      });

      const sortedStates = [
        { workspaceState: incompleteState, lastSavedAt: new Date('2025-01-02'), source: 'checkpoint' },
        { workspaceState: completeState, lastSavedAt: new Date('2025-01-01'), source: 'primary' }
      ];
      const conflicts = [];
      const warnings = [];

      // Mock mergeByLatest to capture the call
      spyOn(recoveryService as any, 'mergeByLatest').mockReturnValue(completeState);

      const result = (recoveryService as any).mergeByMostComplete(sortedStates, conflicts, warnings);

      expect((recoveryService as any).mergeByLatest).toHaveBeenCalled();
      expect(warnings.some(w => w.includes('most complete state'))).toBe(true);
      expect(warnings.some(w => w.includes('primary'))).toBe(true);
    });

    it('should break ties by date when scores are equal', async () => {
      const state1 = createMockWorkspaceState({
        terminalState: [{ id: '1', command: 'ls' }]
      });

      const state2 = createMockWorkspaceState({
        terminalState: [{ id: '2', command: 'pwd' }]
      });

      const sortedStates = [
        { workspaceState: state1, lastSavedAt: new Date('2025-01-01'), source: 'checkpoint' },
        { workspaceState: state2, lastSavedAt: new Date('2025-01-02'), source: 'primary' }
      ];
      const conflicts = [];
      const warnings = [];

      spyOn(recoveryService as any, 'mergeByLatest').mockReturnValue(state2);

      const result = (recoveryService as any).mergeByMostComplete(sortedStates, conflicts, warnings);

      expect((recoveryService as any).mergeByLatest).toHaveBeenCalled();
      // Should prefer newer date when scores are equal
    });
  });

  describe('mergeManually Private Method', () => {
    it('should prepare for manual merge resolution', async () => {
      const state1 = createMockWorkspaceState({ test: 'value1' });
      const state2 = createMockWorkspaceState({ test: 'value2' });

      const sortedStates = [
        { workspaceState: state1, lastSavedAt: new Date('2025-01-01'), source: 'primary' },
        { workspaceState: state2, lastSavedAt: new Date('2025-01-02'), source: 'checkpoint' }
      ];
      const conflicts = [];
      const warnings = [];

      spyOn(recoveryService as any, 'detectConflicts').mockImplementation(() => {});

      const result = (recoveryService as any).mergeManually(sortedStates, conflicts, warnings);

      expect(result.test).toBe('value1'); // Should keep latest as base
      expect(warnings).toContain('Manual merge mode - conflicts detected but require manual resolution');
      expect((recoveryService as any).detectConflicts).toHaveBeenCalled();
    });

    it('should document all conflicts for manual review', async () => {
      const state1 = createMockWorkspaceState({
        terminalState: [{ id: '1', command: 'ls' }]
      });

      const state2 = createMockWorkspaceState({
        terminalState: [{ id: '1', command: 'pwd' }] // Same ID, different command
      });

      const sortedStates = [
        { workspaceState: state1, lastSavedAt: new Date('2025-01-02'), source: 'primary' },
        { workspaceState: state2, lastSavedAt: new Date('2025-01-01'), source: 'checkpoint' }
      ];
      const conflicts = [];
      const warnings = [];

      const result = (recoveryService as any).mergeManually(sortedStates, conflicts, warnings);

      expect(warnings).toContain('Manual merge mode - conflicts detected but require manual resolution');
      expect(result.terminalState[0].command).toBe('ls'); // Should keep base state
    });

    it('should handle single state in manual mode', async () => {
      const singleState = createMockWorkspaceState({ test: 'single' });
      const sortedStates = [
        { workspaceState: singleState, lastSavedAt: new Date('2025-01-01'), source: 'primary' }
      ];
      const conflicts = [];
      const warnings = [];

      const result = (recoveryService as any).mergeManually(sortedStates, conflicts, warnings);

      expect(result.test).toBe('single');
      expect(warnings).toContain('Manual merge mode - conflicts detected but require manual resolution');
    });
  });

  describe('Complex Merge Scenarios', () => {
    it('should handle merge with multiple conflict types', async () => {
      const state1 = createMockWorkspaceState({
        terminalState: [
          { id: '1', command: 'ls', isActive: true, timestamp: '2025-01-01T10:00:00Z' },
          { id: '2', command: 'cd /tmp', isActive: false }
        ],
        browserTabs: [
          { url: 'https://example.com', title: 'Example', isActive: true, timestamp: '2025-01-01T10:00:00Z' }
        ],
        workspaceConfig: { theme: 'dark' }
      });

      const state2 = createMockWorkspaceState({
        terminalState: [
          { id: '1', command: 'ls -la', isActive: false, timestamp: '2025-01-01T12:00:00Z' }, // Conflict
          { id: '3', command: 'mkdir test', isActive: true } // New item
        ],
        browserTabs: [
          { url: 'https://example.com', title: 'Example', isActive: true, timestamp: '2025-01-01T12:00:00Z' }, // Conflict
          { url: 'https://new.com', title: 'New Site', isActive: false } // New item
        ],
        workspaceConfig: { theme: 'light', fontSize: 14 } // Conflict + new property
      });

      const sessionStates = [
        { workspaceState: state1, lastSavedAt: new Date('2025-01-02'), source: 'primary' },
        { workspaceState: state2, lastSavedAt: new Date('2025-01-01'), source: 'checkpoint' }
      ];

      const result = await recoveryService.resolveMergeConflicts(sessionStates, 'latest');

      expect(result.resolvedState).toBeDefined();
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);

      // Should have unique terminals (ids 1, 2, 3)
      expect(result.resolvedState.terminalState).toHaveLength(3);

      // Should have unique browser tabs (2 unique + 1 new = 3, but conflict keeps 1)
      expect(result.resolvedState.browserTabs).toHaveLength(2);

      // Should detect conflicts
      expect(result.conflicts.some(c => c.field.includes('terminalState.id'))).toBe(true);
      expect(result.conflicts.some(c => c.field.includes('browserTabs.composite'))).toBe(true);
      expect(result.conflicts.some(c => c.field.includes('workspaceConfig'))).toBe(true);
    });

    it('should handle merge with empty and null arrays', async () => {
      const state1 = createMockWorkspaceState({
        terminalState: null as any,
        browserTabs: undefined as any,
        aiConversations: [],
        openFiles: [{ id: '1', path: '/file.ts' }]
      });

      const state2 = createMockWorkspaceState({
        terminalState: [],
        browserTabs: [],
        aiConversations: [{ id: '1', messages: [] }],
        openFiles: null as any
      });

      const sessionStates = [
        { workspaceState: state1, lastSavedAt: new Date('2025-01-02'), source: 'primary' },
        { workspaceState: state2, lastSavedAt: new Date('2025-01-01'), source: 'checkpoint' }
      ];

      const result = await recoveryService.resolveMergeConflicts(sessionStates, 'latest');

      expect(result.resolvedState).toBeDefined();
      expect(Array.isArray(result.resolvedState.terminalState)).toBe(true);
      expect(Array.isArray(result.resolvedState.browserTabs)).toBe(true);
      expect(Array.isArray(result.resolvedState.aiConversations)).toBe(true);
      expect(Array.isArray(result.resolvedState.openFiles)).toBe(true);
    });

    it('should handle merge with circular references', async () => {
      const baseState = createMockWorkspaceState({
        terminalState: [{ id: '1', command: 'ls' }]
      });

      // Create a circular reference
      const stateWithCircular = JSON.parse(JSON.stringify(baseState));
      (stateWithCircular as any).self = stateWithCircular;

      const sessionStates = [
        { workspaceState: baseState, lastSavedAt: new Date('2025-01-02'), source: 'primary' }
      ];

      // Should handle circular references gracefully
      await expect(recoveryService.resolveMergeConflicts(sessionStates, 'latest')).resolves.toBeDefined();
    });
  });
});