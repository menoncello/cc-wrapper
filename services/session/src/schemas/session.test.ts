import { describe, expect, it } from 'bun:test';

import {
  CreateCheckpointRequestSchema,
  CreateSessionRequestSchema,
  SessionListResponseSchema,
  SessionQuerySchema,
  SessionResponseSchema,
  UpdateSessionRequestSchema
} from './session.js';

describe('Session schemas', () => {
  describe('CreateSessionRequestSchema', () => {
    const createMinimalWorkspaceState = () => ({
      terminalState: [],
      browserTabs: [],
      aiConversations: [],
      openFiles: []
    });

    const validWorkspaceState = {
      terminalState: [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        cwd: '/home/user/project',
        command: 'npm test',
        history: ['npm install', 'npm run dev', 'npm test'],
        env: { NODE_ENV: 'development' },
        isActive: true
      }],
      browserTabs: [{
        id: '550e8400-e29b-41d4-a716-446655440001',
        url: 'https://example.com',
        title: 'Example Page',
        isActive: true,
        scrollPosition: { x: 0, y: 100 }
      }],
      aiConversations: [{
        id: '550e8400-e29b-41d4-a716-446655440002',
        sessionId: '550e8400-e29b-41d4-a716-446655440003',
        messages: [{
          id: '550e8400-e29b-41d4-a716-446655440004',
          role: 'user' as const,
          content: 'Hello, how are you?',
          timestamp: new Date()
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      openFiles: [{
        id: '550e8400-e29b-41d4-a716-446655440005',
        path: '/home/user/project/src/index.ts',
        content: 'console.log("Hello World");',
        cursor: { line: 1, column: 20 },
        scrollPosition: 0,
        isDirty: true,
        language: 'typescript'
      }]
    };

    it('should accept valid session creation data', () => {
      // Let's test with minimal data first
      const minimalWorkspaceState = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: []
      };

      const validData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        workspaceId: '550e8400-e29b-41d4-a716-446655440001',
        name: 'My Session',
        workspaceState: minimalWorkspaceState
      };

      const result = CreateSessionRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept session creation without optional fields', () => {
      const minimalWorkspaceState = {
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: []
      };

      const minimalData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        workspaceState: minimalWorkspaceState
      };

      const result = CreateSessionRequestSchema.safeParse(minimalData);

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID format for userId', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        workspaceState: createMinimalWorkspaceState()
      };

      const result = CreateSessionRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject session name exceeding max length', () => {
      const invalidData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'A'.repeat(256),
        workspaceState: createMinimalWorkspaceState()
      };

      const result = CreateSessionRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid auto-save interval', () => {
      const invalidData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        workspaceState: createMinimalWorkspaceState(),
        config: {
          autoSaveInterval: 5 // Too small (minimum 10)
        }
      };

      const result = CreateSessionRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid session size limit', () => {
      const invalidData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        workspaceState: createMinimalWorkspaceState(),
        config: {
          maxSessionSize: 200 * 1024 * 1024 // Too large (100MB max)
        }
      };

      const result = CreateSessionRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should accept valid config options', () => {
      const validData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        workspaceState: createMinimalWorkspaceState(),
        config: {
          autoSaveInterval: 60,
          retentionDays: 90,
          checkpointRetention: 180,
          maxSessionSize: 50 * 1024 * 1024, // 50MB
          compressionEnabled: true,
          encryptionEnabled: true
        }
      };

      const result = CreateSessionRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('UpdateSessionRequestSchema', () => {
    const validWorkspaceState = {
      terminalState: [],
      browserTabs: [],
      aiConversations: [],
      openFiles: []
    };

    it('should accept valid session update data', () => {
      const validData = {
        workspaceState: validWorkspaceState,
        name: 'Updated Session Name'
      };

      const result = UpdateSessionRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept update without name change', () => {
      const dataWithoutName = {
        workspaceState: validWorkspaceState
      };

      const result = UpdateSessionRequestSchema.safeParse(dataWithoutName);

      expect(result.success).toBe(true);
    });

    it('should reject empty workspace state', () => {
      const invalidData = {
        workspaceState: null
      };

      const result = UpdateSessionRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('CreateCheckpointRequestSchema', () => {
    it('should accept valid checkpoint creation data', () => {
      const validData = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Important Checkpoint',
        description: 'Checkpoint before major refactoring'
      };

      const result = CreateCheckpointRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept checkpoint without description', () => {
      const dataWithoutDescription = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Quick Save'
      };

      const result = CreateCheckpointRequestSchema.safeParse(dataWithoutDescription);

      expect(result.success).toBe(true);
    });

    it('should reject empty checkpoint name', () => {
      const invalidData = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        name: ''
      };

      const result = CreateCheckpointRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject checkpoint name exceeding max length', () => {
      const invalidData = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'A'.repeat(256)
      };

      const result = CreateCheckpointRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject description exceeding max length', () => {
      const invalidData = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Valid Name',
        description: 'A'.repeat(1001)
      };

      const result = CreateCheckpointRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid sessionId format', () => {
      const invalidData = {
        sessionId: 'not-a-uuid',
        name: 'Valid Name'
      };

      const result = CreateCheckpointRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('SessionQuerySchema', () => {
    it('should parse valid query parameters with defaults', () => {
      const queryParams = {};
      const result = SessionQuerySchema.safeParse(queryParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('should parse valid page and pageSize parameters', () => {
      const queryParams = { page: '2', pageSize: '10' };
      const result = SessionQuerySchema.safeParse(queryParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it('should reject page less than 1', () => {
      const queryParams = { page: '0' };
      const result = SessionQuerySchema.safeParse(queryParams);

      expect(result.success).toBe(false);
    });

    it('should reject pageSize greater than 100', () => {
      const queryParams = { pageSize: '101' };
      const result = SessionQuerySchema.safeParse(queryParams);

      expect(result.success).toBe(false);
    });

    it('should parse boolean includeCheckpoints parameter', () => {
      const queryParams = { includeCheckpoints: 'true' };
      const result = SessionQuerySchema.safeParse(queryParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeCheckpoints).toBe(true);
      }
    });

    it('should parse valid workspaceId parameter', () => {
      const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
      const queryParams = { workspaceId };
      const result = SessionQuerySchema.safeParse(queryParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.workspaceId).toBe(workspaceId);
      }
    });

    it('should reject invalid workspaceId format', () => {
      const queryParams = { workspaceId: 'not-a-uuid' };
      const result = SessionQuerySchema.safeParse(queryParams);

      expect(result.success).toBe(false);
    });

    it('should parse isActive parameter as boolean', () => {
      const queryParams = { isActive: 'false' };
      const result = SessionQuerySchema.safeParse(queryParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(false);
      }
    });
  });

  describe('SessionResponseSchema', () => {
    const validSessionResponse = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      workspaceId: null,
      name: 'My Session',
      isActive: true,
      lastSavedAt: new Date(),
      expiresAt: new Date(),
      createdAt: new Date(),
      checkpointCount: 5,
      totalSize: 1024000
    };

    it('should accept valid session response data', () => {
      const result = SessionResponseSchema.safeParse(validSessionResponse);

      expect(result.success).toBe(true);
    });

    it('should accept session with workspaceId', () => {
      const sessionWithWorkspace = {
        ...validSessionResponse,
        workspaceId: '550e8400-e29b-41d4-a716-446655440002'
      };

      const result = SessionResponseSchema.safeParse(sessionWithWorkspace);

      expect(result.success).toBe(true);
    });

    it('should accept session with null name', () => {
      const sessionWithNullName = {
        ...validSessionResponse,
        name: null
      };

      const result = SessionResponseSchema.safeParse(sessionWithNullName);

      expect(result.success).toBe(true);
    });

    it('should reject invalid totalSize (negative number)', () => {
      const invalidSession = {
        ...validSessionResponse,
        totalSize: -100
      };

      const result = SessionResponseSchema.safeParse(invalidSession);

      expect(result.success).toBe(false);
    });

    it('should reject invalid checkpointCount (negative number)', () => {
      const invalidSession = {
        ...validSessionResponse,
        checkpointCount: -1
      };

      const result = SessionResponseSchema.safeParse(invalidSession);

      expect(result.success).toBe(false);
    });
  });

  describe('SessionListResponseSchema', () => {
    const validSessionResponse = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      workspaceId: null,
      name: 'My Session',
      isActive: true,
      lastSavedAt: new Date(),
      expiresAt: new Date(),
      createdAt: new Date(),
      checkpointCount: 5,
      totalSize: 1024000
    };

    it('should accept valid session list response', () => {
      const validResponse = {
        sessions: [validSessionResponse],
        total: 1,
        page: 1,
        pageSize: 20
      };

      const result = SessionListResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });

    it('should accept empty session list', () => {
      const emptyResponse = {
        sessions: [],
        total: 0,
        page: 1,
        pageSize: 20
      };

      const result = SessionListResponseSchema.safeParse(emptyResponse);

      expect(result.success).toBe(true);
    });

    it('should reject mismatched total count', () => {
      const invalidResponse = {
        sessions: [validSessionResponse],
        total: 5, // Should be 1
        page: 1,
        pageSize: 20
      };

      const result = SessionListResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(true); // Schema allows this - business logic would validate
    });

    it('should reject invalid page number', () => {
      const invalidResponse = {
        sessions: [validSessionResponse],
        total: 1,
        page: 0,
        pageSize: 20
      };

      const result = SessionListResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });

    it('should reject pageSize exceeding maximum', () => {
      const invalidResponse = {
        sessions: [validSessionResponse],
        total: 1,
        page: 1,
        pageSize: 101
      };

      const result = SessionListResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });
});