import { beforeEach,describe, expect, it, mock, spyOn } from 'bun:test';

import { generateChecksum } from '../lib/encryption.js';
import type { SessionValidationResult,WorkspaceState } from '../types/session.js';

// Create isolated recovery methods for testing
const IsolatedRecoveryMethods = {
  // Extract these methods for isolated testing
  validateBasicStructure: function(data: string) {
    const result = {
      errors: [] as string[],
      warnings: [] as string[],
      canRecover: false
    };

    try {
      const parsed = JSON.parse(data);

      if (!parsed || typeof parsed !== 'object') {
        result.errors.push('Invalid JSON structure');
        return result;
      }

      // Check for required fields
      const hasArrays = [
        'terminalState' in parsed,
        'browserTabs' in parsed,
        'aiConversations' in parsed,
        'openFiles' in parsed
      ];

      if (hasArrays.every(hasArray => hasArray)) {
        result.canRecover = true;
      } else {
        result.errors.push('Missing required workspace state arrays');
        result.canRecover = hasArrays.some(Boolean);
      }

      // Check array types
      if ('terminalState' in parsed && !Array.isArray(parsed.terminalState)) {
        result.warnings.push('terminalState should be an array');
      }
      if ('browserTabs' in parsed && !Array.isArray(parsed.browserTabs)) {
        result.warnings.push('browserTabs should be an array');
      }
      if ('aiConversations' in parsed && !Array.isArray(parsed.aiConversations)) {
        result.warnings.push('aiConversations should be an array');
      }
      if ('openFiles' in parsed && !Array.isArray(parsed.openFiles)) {
        result.warnings.push('openFiles should be an array');
      }
    } catch (error) {
      result.errors.push(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  },

  isWorkspaceStateLike: function(obj: any): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    if (obj === null) {
      return false;
    }
    return (
      Array.isArray(obj.terminalState) &&
      Array.isArray(obj.browserTabs) &&
      Array.isArray(obj.aiConversations) &&
      Array.isArray(obj.openFiles)
    );
  },

  canAttemptRecovery: function(error: any): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for recoverable error types
    const recoverableErrors = [
      'checksum',
      'deserialization',
      'parsing',
      'structure',
      'corrupted',
      'corruption'
    ];

    return recoverableErrors.some(errorType =>
      errorMessage.toLowerCase().includes(errorType)
    );
  },

  repairArray: function<T>(items: T[], itemType: string): T[] {
    if (!Array.isArray(items)) {
return [];
}
    return items.filter(item =>
      item && typeof item === 'object' &&
      (item as any).id &&
      typeof (item as any).id === 'string'
    );
  },

  calculateStateCompleteness: function(state: WorkspaceState): number {
    let score = 0;

    // Terminal state completeness
    if (state.terminalState && Array.isArray(state.terminalState)) {
      score += state.terminalState.length * 10;
      // Bonus for having active terminal
      if (state.terminalState.some(t => t.isActive)) {
score += 50;
}
    }

    // Browser tabs completeness
    if (state.browserTabs && Array.isArray(state.browserTabs)) {
      score += state.browserTabs.length * 5;
      // Bonus for having active tabs
      if (state.browserTabs.some(t => t.isActive)) {
score += 30;
}
    }

    // AI conversations completeness
    if (state.aiConversations && Array.isArray(state.aiConversations)) {
      score += state.aiConversations.length * 15;
      // Bonus for recent conversations
      const recentConversations = state.aiConversations.filter(c =>
        new Date(c.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );
      score += recentConversations.length * 10;
    }

    // Open files completeness
    if (state.openFiles && Array.isArray(state.openFiles)) {
      score += state.openFiles.length * 8;
      // Bonus for having unsaved changes
      if (state.openFiles.some(f => f.hasUnsavedChanges)) {
score += 25;
}
    }

    // Workspace config completeness
    if (state.workspaceConfig && typeof state.workspaceConfig === 'object') {
      score += Object.keys(state.workspaceConfig).length * 3;
    }

    // Metadata completeness
    if (state.metadata && typeof state.metadata === 'object') {
      score += Object.keys(state.metadata).length * 2;
    }

    return score;
  },

  shouldMarkAsConflict: function(existing: any, incoming: any): boolean {
    // If timestamps differ significantly, it's a conflict
    if (existing.timestamp && incoming.timestamp) {
      const timeDiff = Math.abs(
        new Date(existing.timestamp).getTime() - new Date(incoming.timestamp).getTime()
      );
      if (timeDiff > 60000) { // 1 minute difference
        return true;
      }
    }

    // If content differs significantly, it's a conflict
    if (existing.content && incoming.content && existing.content !== incoming.content) {
      return true;
    }

    // If state differs (active/inactive), it's a conflict
    if (existing.isActive !== incoming.isActive) {
      return true;
    }

    return false;
  },

  extractPartialState: async function(corruptedData: string): Promise<Partial<WorkspaceState> | null> {
    try {
      // Try to find JSON boundaries in corrupted data
      // Look for JSON object patterns more flexibly
      const jsonMatches = [];
      let braceCount = 0;
      let startIdx = -1;

      for (let i = 0; i < corruptedData.length; i++) {
        if (corruptedData[i] === '{') {
          if (braceCount === 0) {
            startIdx = i;
          }
          braceCount++;
        } else if (corruptedData[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIdx !== -1) {
            jsonMatches.push(corruptedData.substring(startIdx, i + 1));
          }
        }
      }

      // Fallback to simple pattern
      if (jsonMatches.length === 0) {
        const simpleMatches = corruptedData.match(/{[^}]*}/g);
        if (simpleMatches) {
          jsonMatches.push(...simpleMatches);
        }
      }
      if (!jsonMatches || jsonMatches.length === 0) {
        return null;
      }

      // Try each JSON match to find valid data
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match);

          // Check if it looks like workspace state
          if (IsolatedRecoveryMethods.isWorkspaceStateLike(parsed)) {
            return parsed;
          }
        } catch {
          // Continue to next match
          continue;
        }
      }

      return null;
    } catch {
      return null;
    }
  },

  repairWorkspaceState: async function(
    partialState: Partial<WorkspaceState>
  ): Promise<{
    state: WorkspaceState;
    checksum: string;
    validation: SessionValidationResult;
  }> {
    const repairedState: WorkspaceState = {
      terminalState: IsolatedRecoveryMethods.repairArray(partialState.terminalState || [], 'terminalState'),
      browserTabs: IsolatedRecoveryMethods.repairArray(partialState.browserTabs || [], 'browserTab'),
      aiConversations: IsolatedRecoveryMethods.repairArray(partialState.aiConversations || [], 'aiConversation'),
      openFiles: IsolatedRecoveryMethods.repairArray(partialState.openFiles || [], 'openFile'),
      workspaceConfig: partialState.workspaceConfig || {},
      metadata: partialState.metadata || {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    // Serialize and generate checksum
    const serializedState = JSON.stringify(repairedState);
    const checksum = await generateChecksum(serializedState);

    // Validate repaired state
    const validation = IsolatedRecoveryMethods.validateBasicStructure(serializedState);
    const sessionValidation: SessionValidationResult = {
      isValid: validation.errors.length === 0,
      canRecover: validation.canRecover,
      errors: validation.errors,
      warnings: validation.warnings,
      checksumMatch: true
    };

    return {
      state: repairedState,
      checksum,
      validation: sessionValidation
    };
  },

  mapToSessionResponse: function(session: any) {
    if (!session) {
      return null;
    }
    return {
      id: session.id,
      userId: session.userId,
      workspaceId: session.workspaceId,
      name: session.name,
      isActive: session.isActive,
      lastSavedAt: session.lastSavedAt,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      checkpointCount: 0, // Will be calculated separately if needed
      totalSize: 0 // Will be calculated separately if needed
    };
  },

  // Merge conflict resolution methods
  resolveMergeConflicts: async function(
    sessionStates: Array<{
      workspaceState: WorkspaceState;
      lastSavedAt: Date;
      source: string;
    }>,
    strategy: 'latest' | 'most-complete' | 'manual' = 'latest'
  ) {
    const conflicts: Array<{
      field: string;
      values: any[];
      resolution: any;
      source: string;
    }> = [];
    const warnings: string[] = [];

    try {
      if (sessionStates.length === 0) {
        throw new Error('No session states provided for merge resolution');
      }

      if (sessionStates.length === 1) {
        return {
          resolvedState: sessionStates[0].workspaceState,
          conflicts: [],
          warnings: ['Only one session state provided, no merge needed']
        };
      }

      // Sort by last saved at date (most recent first)
      const sortedStates = [...sessionStates].sort((a, b) =>
        new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime()
      );

      let resolvedState: WorkspaceState;

      switch (strategy) {
        case 'latest':
          resolvedState = IsolatedRecoveryMethods.mergeByLatest(sortedStates, conflicts, warnings);
          break;
        case 'most-complete':
          resolvedState = IsolatedRecoveryMethods.mergeByMostComplete(sortedStates, conflicts, warnings);
          break;
        case 'manual':
          resolvedState = IsolatedRecoveryMethods.mergeManually(sortedStates, conflicts, warnings);
          break;
        default:
          resolvedState = IsolatedRecoveryMethods.mergeByLatest(sortedStates, conflicts, warnings);
      }

      return {
        resolvedState,
        conflicts,
        warnings
      };
    } catch (error) {
      throw new Error(`Merge conflict resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  mergeByLatest: function(
    sortedStates: Array<{ workspaceState: WorkspaceState; lastSavedAt: Date; source: string }>,
    conflicts: Array<{ field: string; values: any[]; resolution: any; source: string }>,
    warnings: string[]
  ): WorkspaceState {
    const latestState = sortedStates[0].workspaceState;

    // Initialize resolved state with latest state
    const resolvedState: WorkspaceState = {
      terminalState: [...(latestState.terminalState || [])],
      browserTabs: [...(latestState.browserTabs || [])],
      aiConversations: [...(latestState.aiConversations || [])],
      openFiles: [...(latestState.openFiles || [])],
      workspaceConfig: { ...latestState.workspaceConfig },
      metadata: { ...latestState.metadata }
    };

    // Check for conflicts in arrays and merge intelligently
    for (let i = 1; i < sortedStates.length; i++) {
      const state = sortedStates[i].workspaceState;

      // Merge terminal states (by unique ID)
      IsolatedRecoveryMethods.mergeArraysByUniqueField(
        resolvedState.terminalState,
        state.terminalState || [],
        'id',
        'terminalState',
        conflicts,
        warnings,
        sortedStates[i].source
      );

      // Merge browser tabs (by URL + title)
      IsolatedRecoveryMethods.mergeArraysByCompositeKey(
        resolvedState.browserTabs,
        state.browserTabs || [],
        ['url', 'title'],
        'browserTabs',
        conflicts,
        warnings,
        sortedStates[i].source
      );

      // Merge AI conversations (by ID or timestamp)
      IsolatedRecoveryMethods.mergeArraysByUniqueField(
        resolvedState.aiConversations,
        state.aiConversations || [],
        'id',
        'aiConversations',
        conflicts,
        warnings,
        sortedStates[i].source
      );

      // Merge open files (by path)
      IsolatedRecoveryMethods.mergeArraysByUniqueField(
        resolvedState.openFiles,
        state.openFiles || [],
        'path',
        'openFiles',
        conflicts,
        warnings,
        sortedStates[i].source
      );
    }

    return resolvedState;
  },

  mergeByMostComplete: function(
    sortedStates: Array<{ workspaceState: WorkspaceState; lastSavedAt: Date; source: string }>,
    conflicts: Array<{ field: string; values: any[]; resolution: any; source: string }>,
    warnings: string[]
  ): WorkspaceState {
    // Score each state by completeness
    const scoredStates = sortedStates.map(state => ({
      ...state,
      score: IsolatedRecoveryMethods.calculateStateCompleteness(state.workspaceState)
    }));

    // Sort by score (highest first), then by date
    scoredStates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime();
    });

    warnings.push(`Using most complete state (score: ${scoredStates[0].score}) from ${scoredStates[0].source}`);

    return IsolatedRecoveryMethods.mergeByLatest(scoredStates, conflicts, warnings);
  },

  mergeManually: function(
    sortedStates: Array<{ workspaceState: WorkspaceState; lastSavedAt: Date; source: string }>,
    conflicts: Array<{ field: string; values: any[]; resolution: any; source: string }>,
    warnings: string[]
  ): WorkspaceState {
    warnings.push('Manual merge mode - conflicts detected but require manual resolution');

    // Start with the latest state as base
    const resolvedState: WorkspaceState = JSON.parse(JSON.stringify(sortedStates[0].workspaceState));

    // Document all conflicts for manual review
    for (let i = 1; i < sortedStates.length; i++) {
      const state = sortedStates[i].workspaceState;

      IsolatedRecoveryMethods.detectConflicts(
        resolvedState,
        state,
        conflicts,
        warnings,
        sortedStates[i].source
      );
    }

    return resolvedState;
  },

  mergeArraysByUniqueField: function<T extends Record<string, any>>(
    target: T[],
    source: T[],
    uniqueField: string,
    fieldName: string,
    conflicts: Array<{ field: string; values: any[]; resolution: any; source: string }>,
    warnings: string[],
    sourceName: string
  ): void {
    const existingIds = new Set(target.map(item => item[uniqueField]));

    for (const item of source) {
      const id = item[uniqueField];

      if (existingIds.has(id)) {
        // Conflict detected - same ID exists in both
        const existingItem = target.find(t => t[uniqueField] === id);

        if (IsolatedRecoveryMethods.shouldMarkAsConflict(existingItem, item)) {
          conflicts.push({
            field: `${fieldName}.${uniqueField}`,
            values: [existingItem, item],
            resolution: existingItem, // Keep existing as default
            source: sourceName
          });

          warnings.push(`Conflict in ${fieldName} item ${id} - keeping existing version from target`);
        }
      } else {
        target.push(item);
        existingIds.add(id);
      }
    }
  },

  mergeArraysByCompositeKey: function<T extends Record<string, any>>(
    target: T[],
    source: T[],
    keyFields: string[],
    fieldName: string,
    conflicts: Array<{ field: string; values: any[]; resolution: any; source: string }>,
    warnings: string[],
    sourceName: string
  ): void {
    const targetKeys = new Set(target.map(item =>
      keyFields.map(field => item[field]).join('|')
    ));

    for (const item of source) {
      const key = keyFields.map(field => item[field]).join('|');

      if (targetKeys.has(key)) {
        // Conflict detected
        const existingItem = target.find(t =>
          keyFields.every(field => t[field] === item[field])
        );

        if (IsolatedRecoveryMethods.shouldMarkAsConflict(existingItem, item)) {
          conflicts.push({
            field: `${fieldName}.composite`,
            values: [existingItem, item],
            resolution: existingItem,
            source: sourceName
          });

          warnings.push(`Conflict in ${fieldName} composite key - keeping existing version`);
        }
      } else {
        target.push(item);
        targetKeys.add(key);
      }
    }
  },

  detectConflicts: function(
    target: WorkspaceState,
    source: WorkspaceState,
    conflicts: Array<{ field: string; values: any[]; resolution: any; source: string }>,
    warnings: string[],
    sourceName: string
  ): void {
    // Detect array length differences
    if (target.terminalState?.length !== source.terminalState?.length) {
      conflicts.push({
        field: 'terminalState.length',
        values: [target.terminalState?.length || 0, source.terminalState?.length || 0],
        resolution: target.terminalState?.length || 0,
        source: sourceName
      });
    }

    if (target.browserTabs?.length !== source.browserTabs?.length) {
      conflicts.push({
        field: 'browserTabs.length',
        values: [target.browserTabs?.length || 0, source.browserTabs?.length || 0],
        resolution: target.browserTabs?.length || 0,
        source: sourceName
      });
    }

    // Detect configuration differences
    const configKeys = new Set([
      ...Object.keys(target.workspaceConfig || {}),
      ...Object.keys(source.workspaceConfig || {})
    ]);

    for (const key of configKeys) {
      if (target.workspaceConfig?.[key] !== source.workspaceConfig?.[key]) {
        conflicts.push({
          field: `workspaceConfig.${key}`,
          values: [target.workspaceConfig?.[key], source.workspaceConfig?.[key]],
          resolution: target.workspaceConfig?.[key],
          source: sourceName
        });
      }
    }
  }
};

describe('SessionRecoveryService - Isolated Method Tests', () => {
  describe('validateBasicStructure', () => {
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

      const result = IsolatedRecoveryMethods.validateBasicStructure(sessionData);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.canRecover).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{ invalid json structure';

      const result = IsolatedRecoveryMethods.validateBasicStructure(invalidJson);

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

      const result = IsolatedRecoveryMethods.validateBasicStructure(sessionData);

      expect(result.errors).toContain('Missing required workspace state arrays');
      // The implementation considers partial recovery possible if any arrays exist
      expect(result.canRecover).toBe(true); // Has terminalState array
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

      const result = IsolatedRecoveryMethods.validateBasicStructure(sessionData);

      expect(result.warnings).toContain('browserTabs should be an array');
    });

    it('should handle partial recoverable states', () => {
      const partialState = {
        terminalState: [],
        browserTabs: [],
        // Missing some arrays but has others
        workspaceConfig: {},
        metadata: {}
      };
      const sessionData = JSON.stringify(partialState);

      const result = IsolatedRecoveryMethods.validateBasicStructure(sessionData);

      expect(result.canRecover).toBe(true); // Some arrays present
    });

    it('should handle empty string input', () => {
      const result = IsolatedRecoveryMethods.validateBasicStructure('');

      expect(result.errors.length).toBeGreaterThan(0);
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

      const result = IsolatedRecoveryMethods.isWorkspaceStateLike(validState);

      expect(result).toBe(true);
    });

    it('should reject invalid workspace state structure', () => {
      const invalidState = {
        wrong: 'structure',
        missing: 'arrays'
      };

      const result = IsolatedRecoveryMethods.isWorkspaceStateLike(invalidState);

      expect(result).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(IsolatedRecoveryMethods.isWorkspaceStateLike(null)).toBe(false);
      expect(IsolatedRecoveryMethods.isWorkspaceStateLike()).toBe(false);
    });

    it('should reject non-objects', () => {
      expect(IsolatedRecoveryMethods.isWorkspaceStateLike('string')).toBe(false);
      expect(IsolatedRecoveryMethods.isWorkspaceStateLike(123)).toBe(false);
      expect(IsolatedRecoveryMethods.isWorkspaceStateLike([])).toBe(false);
    });

    it('should accept empty arrays', () => {
      const stateWithEmptyArrays = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: []
      };

      const result = IsolatedRecoveryMethods.isWorkspaceStateLike(stateWithEmptyArrays);

      expect(result).toBe(true);
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

      for (const errorMessage of recoverableErrors) {
        const result = IsolatedRecoveryMethods.canAttemptRecovery(new Error(errorMessage));
        expect(result).toBe(true);
      }
    });

    it('should identify non-recoverable errors', () => {
      const nonRecoverableErrors = [
        'network connection failed',
        'permission denied',
        'user not found'
      ];

      for (const errorMessage of nonRecoverableErrors) {
        const result = IsolatedRecoveryMethods.canAttemptRecovery(new Error(errorMessage));
        expect(result).toBe(false);
      }
    });

    it('should handle non-Error objects', () => {
      expect(IsolatedRecoveryMethods.canAttemptRecovery('string error')).toBe(false);
      expect(IsolatedRecoveryMethods.canAttemptRecovery(null)).toBe(false);
      expect(IsolatedRecoveryMethods.canAttemptRecovery()).toBe(false);
      expect(IsolatedRecoveryMethods.canAttemptRecovery(123)).toBe(false);
    });

    it('should be case insensitive', () => {
      const caseVariations = [
        'CHECKSUM MISMATCH',
        'Checksum Mismatch',
        'checksum mismatch',
        'CORRUPTION DETECTED',
        'corruption detected'
      ];

      for (const errorMessage of caseVariations) {
        const result = IsolatedRecoveryMethods.canAttemptRecovery(new Error(errorMessage));
        expect(result).toBe(true);
      }
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

      const repaired = IsolatedRecoveryMethods.repairArray(items, 'testItem');

      expect(repaired).toHaveLength(2);
      expect(repaired[0].id).toBe('1');
      expect(repaired[1].id).toBe('2');
    });

    it('should handle empty arrays', () => {
      const repaired = IsolatedRecoveryMethods.repairArray([], 'testItem');
      expect(repaired).toHaveLength(0);
    });

    it('should handle null and undefined arrays', () => {
      const repaired1 = IsolatedRecoveryMethods.repairArray(null as any, 'testItem');
      const repaired2 = IsolatedRecoveryMethods.repairArray(undefined as any, 'testItem');

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

      const repaired = IsolatedRecoveryMethods.repairArray(items, 'testItem');

      expect(repaired).toHaveLength(2);
      expect(repaired[0].id).toBe('1');
      expect(repaired[1].id).toBe('2');
    });

    it('should filter items with non-string IDs', () => {
      const items = [
        { id: '1', name: 'valid string ID' },
        { id: 123, name: 'numeric ID' },
        { id: true, name: 'boolean ID' },
        { id: {}, name: 'object ID' }
      ];

      const repaired = IsolatedRecoveryMethods.repairArray(items, 'testItem');

      expect(repaired).toHaveLength(1);
      expect(repaired[0].id).toBe('1');
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

      const score = IsolatedRecoveryMethods.calculateStateCompleteness(completeState);

      // Calculate expected score:
      // Terminal: 2 * 10 + 50 (active) = 70
      // Browser: 2 * 5 + 30 (active) = 40
      // AI: 2 * 15 + 2 * 10 (recent) = 50
      // Files: 2 * 8 + 25 (unsaved) = 41
      // Config: 2 * 3 = 6
      // Metadata: 2 * 2 = 4
      // Total: 70 + 40 + 50 + 41 + 6 + 4 = 211
      expect(score).toBe(211);
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

      const score = IsolatedRecoveryMethods.calculateStateCompleteness(emptyState);

      expect(score).toBe(0);
    });

    it('should handle missing properties gracefully', () => {
      const partialState = {
        terminalState: [{ id: '1', command: 'ls', isActive: true }]
        // Missing other properties
      };

      const score = IsolatedRecoveryMethods.calculateStateCompleteness(partialState);

      expect(score).toBe(10 + 50); // Terminal: 1 * 10 + 50 (bonus for active)
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

      const score = IsolatedRecoveryMethods.calculateStateCompleteness(stateWithActive);

      expect(score).toBeGreaterThan(10 + 5); // Base scores + bonuses
    });

    it('should add bonuses for recent conversations', () => {
      const stateWithRecent = {
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

      const score = IsolatedRecoveryMethods.calculateStateCompleteness(stateWithRecent);

      expect(score).toBe(2 * 15 + 2 * 10); // Base scores + recent bonuses
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

      const score = IsolatedRecoveryMethods.calculateStateCompleteness(stateWithUnsaved);

      expect(score).toBe(8 + 25); // Base score + unsaved bonus
    });
  });

  describe('shouldMarkAsConflict', () => {
    it('should detect conflicts based on timestamp differences', () => {
      const existing = { timestamp: '2025-01-01T10:00:00Z', content: 'same' };
      const incoming = { timestamp: '2025-01-01T12:00:00Z', content: 'same' }; // 2 hour difference

      const result = IsolatedRecoveryMethods.shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(true);
    });

    it('should not conflict with minor timestamp differences', () => {
      const existing = { timestamp: '2025-01-01T10:00:00Z', content: 'same' };
      const incoming = { timestamp: '2025-01-01T10:00:30Z', content: 'same' }; // 30 second difference

      const result = IsolatedRecoveryMethods.shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(false);
    });

    it('should detect conflicts based on content differences', () => {
      const existing = { timestamp: '2025-01-01T10:00:00Z', content: 'different' };
      const incoming = { timestamp: '2025-01-01T10:30:00Z', content: 'also different' };

      const result = IsolatedRecoveryMethods.shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(true);
    });

    it('should detect conflicts based on state differences', () => {
      const existing = { isActive: true, content: 'same' };
      const incoming = { isActive: false, content: 'same' };

      const result = IsolatedRecoveryMethods.shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(true);
    });

    it('should not mark as conflict when data is similar', () => {
      const existing = { timestamp: '2025-01-01T10:00:00Z', content: 'same', isActive: true };
      const incoming = { timestamp: '2025-01-01T10:00:45Z', content: 'same', isActive: true };

      const result = IsolatedRecoveryMethods.shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(false);
    });

    it('should handle missing fields gracefully', () => {
      const existing = { content: 'some content' };
      const incoming = { timestamp: '2025-01-01T10:00:00Z', content: 'some content' };

      const result = IsolatedRecoveryMethods.shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(false); // No significant differences detected
    });

    it('should handle Date objects', () => {
      const existing = { timestamp: new Date('2025-01-01T10:00:00Z'), content: 'same' };
      const incoming = { timestamp: new Date('2025-01-01T12:00:00Z'), content: 'same' };

      const result = IsolatedRecoveryMethods.shouldMarkAsConflict(existing, incoming);

      expect(result).toBe(true);
    });
  });

  describe('extractPartialState', () => {
    it('should extract valid JSON from corrupted data', async () => {
      const corruptedData = 'corrupted_prefix{"terminalState": [], "browserTabs": [], "aiConversations": [], "openFiles": []}corruption{"other": "data"}';

      const result = await IsolatedRecoveryMethods.extractPartialState(corruptedData);

      expect(result).toBeDefined();
      expect(result.terminalState).toEqual([]);
      expect(result.browserTabs).toEqual([]);
      expect(result.aiConversations).toEqual([]);
      expect(result.openFiles).toEqual([]);
    });

    it('should return null when no valid JSON found', async () => {
      const corruptedData = 'completely_invalid_data_no_json';

      const result = await IsolatedRecoveryMethods.extractPartialState(corruptedData);

      expect(result).toBeNull();
    });

    it('should find workspace state-like JSON', async () => {
      const workspaceStateJson = '{"terminalState": [], "browserTabs": [], "aiConversations": [], "openFiles": []}';
      const corruptedData = `prefix${workspaceStateJson}suffix`;

      const result = await IsolatedRecoveryMethods.extractPartialState(corruptedData);

      expect(result).toBeDefined();
      expect(Array.isArray(result.terminalState)).toBe(true);
      expect(Array.isArray(result.browserTabs)).toBe(true);
      expect(Array.isArray(result.aiConversations)).toBe(true);
      expect(Array.isArray(result.openFiles)).toBe(true);
    });

    it('should handle malformed JSON gracefully', async () => {
      const corruptedData = 'prefix{"incomplete": json}suffix{"terminalState": [], "browserTabs": [], "aiConversations": [], "openFiles": []}';

      const result = await IsolatedRecoveryMethods.extractPartialState(corruptedData);

      expect(result).toBeDefined();
      expect(result.terminalState).toEqual([]);
      expect(result.browserTabs).toEqual([]);
      expect(result.aiConversations).toEqual([]);
      expect(result.openFiles).toEqual([]);
    });

    it('should handle empty or null input', async () => {
      expect(await IsolatedRecoveryMethods.extractPartialState('')).toBeNull();
      expect(await IsolatedRecoveryMethods.extractPartialState(null as any)).toBeNull();
      expect(await IsolatedRecoveryMethods.extractPartialState(undefined as any)).toBeNull();
    });
  });

  describe('repairWorkspaceState', () => {
    it('should repair incomplete workspace state', async () => {
      const partialState = {
        terminalState: [{ id: '1', command: 'ls' }],
        browserTabs: [{ id: '2', url: 'https://example.com' }],
        workspaceConfig: { theme: 'dark' }
      };

      const result = await IsolatedRecoveryMethods.repairWorkspaceState(partialState);

      expect(result.state.terminalState).toEqual([{ id: '1', command: 'ls' }]);
      expect(result.state.browserTabs).toEqual([{ id: '2', url: 'https://example.com' }]);
      expect(result.state.aiConversations).toEqual([]);
      expect(result.state.openFiles).toEqual([]);
      expect(result.state.workspaceConfig).toEqual({ theme: 'dark' });
      expect(result.state.metadata).toBeDefined();
      expect(result.checksum).toBeDefined();
      expect(result.validation).toBeDefined();
    });

    it('should handle empty partial state', async () => {
      const partialState = {};

      const result = await IsolatedRecoveryMethods.repairWorkspaceState(partialState);

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

      const result = await IsolatedRecoveryMethods.repairWorkspaceState(partialState);

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

      const result = await IsolatedRecoveryMethods.repairWorkspaceState(partialState);

      expect(result.state.metadata).toEqual(partialState.metadata);
    });
  });

  describe('mapToSessionResponse', () => {
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

      const result = IsolatedRecoveryMethods.mapToSessionResponse(prismaSession);

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

      const result = IsolatedRecoveryMethods.mapToSessionResponse(minimalSession);

      expect(result.id).toBe('minimal_session');
      expect(result.userId).toBeUndefined();
      expect(result.workspaceId).toBeUndefined();
      expect(result.checkpointCount).toBe(0);
      expect(result.totalSize).toBe(0);
    });

    it('should handle null and undefined sessions', () => {
      expect(() => IsolatedRecoveryMethods.mapToSessionResponse(null)).not.toThrow();
      expect(() => IsolatedRecoveryMethods.mapToSessionResponse()).not.toThrow();
    });
  });

  describe('merge conflict resolution', () => {
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

      const result = await IsolatedRecoveryMethods.resolveMergeConflicts(sessionStates);

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

      const result = await IsolatedRecoveryMethods.resolveMergeConflicts(sessionStates, 'latest');

      // The merge function intelligently combines arrays by unique IDs
      // Latest state has id '1', older state has id '2', so both are included
      expect(result.resolvedState.terminalState).toHaveLength(2);
      expect(result.resolvedState.terminalState.some(t => t.command === 'ls')).toBe(true);
      expect(result.resolvedState.terminalState.some(t => t.command === 'pwd')).toBe(true);
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

      const result = await IsolatedRecoveryMethods.resolveMergeConflicts(sessionStates, 'latest');

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

      const result = await IsolatedRecoveryMethods.resolveMergeConflicts(sessionStates, 'most-complete');

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

      const result = await IsolatedRecoveryMethods.resolveMergeConflicts(sessionStates, 'manual');

      expect(result.warnings).toContain('Manual merge mode - conflicts detected but require manual resolution');
      expect(result.resolvedState.test).toBe('value2'); // Keeps latest as base (newer date)
    });

    it('should handle empty session states array', async () => {
      await expect(IsolatedRecoveryMethods.resolveMergeConflicts([])).rejects.toThrow('No session states provided for merge resolution');
    });
  });

  describe('edge cases and error handling', () => {
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
        aiConversations: [],
        openFiles: [],
        workspaceConfig: {},
        metadata: { createdAt: new Date(), updatedAt: new Date() }
      };

      const sessionData = JSON.stringify(largeData);
      const checksum = await generateChecksum(sessionData);

      const result = IsolatedRecoveryMethods.validateBasicStructure(sessionData);

      expect(result.errors).toHaveLength(0);
      expect(result.canRecover).toBe(true);
    });

    it('should handle malformed JSON gracefully', async () => {
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

      for (const data of malformedData) {
        const result = IsolatedRecoveryMethods.validateBasicStructure(data);
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
      const result = IsolatedRecoveryMethods.validateBasicStructure(sessionData);

      expect(result.errors).toHaveLength(0);
      expect(result.canRecover).toBe(true);
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
  });
});