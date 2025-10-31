import { describe, expect, it } from 'bun:test';

import {
  CreateCheckpointRequestSchema,
  CreateSessionRequestSchema,
  SessionListResponseSchema,
  SessionQuerySchema,
  SessionResponseSchema,
  UpdateSessionRequestSchema
} from './session.js';

describe('Session schemas - Core validation', () => {
  describe('CreateSessionRequestSchema', () => {
    it('should accept basic session creation data', () => {
      const validData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        workspaceState: {
          terminalState: [],
          browserTabs: [],
          aiConversations: [],
          openFiles: []
        }
      };

      const result = CreateSessionRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for userId', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        workspaceState: {
          terminalState: [],
          browserTabs: [],
          aiConversations: [],
          openFiles: []
        }
      };

      const result = CreateSessionRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('CreateCheckpointRequestSchema', () => {
    it('should accept valid checkpoint creation data', () => {
      const validData = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Checkpoint'
      };

      const result = CreateCheckpointRequestSchema.safeParse(validData);

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
  });

  describe('SessionQuerySchema', () => {
    it('should accept valid query parameters', () => {
      const queryParams = {
        page: 1,
        pageSize: 20
      };

      const result = SessionQuerySchema.safeParse(queryParams);

      expect(result.success).toBe(true);
    });

    it('should apply defaults correctly', () => {
      const queryParams = {};

      const result = SessionQuerySchema.safeParse(queryParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });
  });

  describe('SessionResponseSchema', () => {
    it('should accept valid session response', () => {
      const validResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        workspaceId: null,
        name: 'Test Session',
        isActive: true,
        lastSavedAt: new Date(),
        expiresAt: new Date(),
        createdAt: new Date(),
        checkpointCount: 0,
        totalSize: 0
      };

      const result = SessionResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });

    it('should reject negative checkpoint count', () => {
      const invalidResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        workspaceId: null,
        name: 'Test Session',
        isActive: true,
        lastSavedAt: new Date(),
        expiresAt: new Date(),
        createdAt: new Date(),
        checkpointCount: -1,
        totalSize: 0
      };

      const result = SessionResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });

  describe('SessionListResponseSchema', () => {
    it('should accept valid session list response', () => {
      const validResponse = {
        sessions: [],
        total: 0,
        page: 1,
        pageSize: 20
      };

      const result = SessionListResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });
  });
});