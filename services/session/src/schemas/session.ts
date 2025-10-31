import { z } from 'zod';

/**
 * Session Service Schemas
 * Zod validation schemas for session API requests and responses
 */

// Base schemas for nested objects
const TerminalStateSchema = z.object({
  id: z.string().uuid(),
  cwd: z.string(),
  command: z.string().optional(),
  history: z.array(z.string()),
  env: z.record(z.string()).optional(),
  isActive: z.boolean()
});

const BrowserTabSchema = z.object({
  id: z.string().uuid(),
  url: z.string().min(1), // Simplified validation
  title: z.string(),
  isActive: z.boolean(),
  scrollPosition: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  formData: z.record(z.unknown()).optional()
});

const AIMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional()
});

const AIConversationSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  messages: z.array(AIMessageSchema),
  createdAt: z.date(),
  updatedAt: z.date()
});

const OpenFileSchema = z.object({
  id: z.string().uuid(),
  path: z.string(),
  content: z.string(),
  cursor: z.object({
    line: z.number(),
    column: z.number()
  }).optional(),
  scrollPosition: z.number().optional(),
  isDirty: z.boolean(),
  language: z.string().optional()
});

const SessionMetadataSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

const WorkspaceStateSchema = z.object({
  terminalState: z.array(TerminalStateSchema),
  browserTabs: z.array(BrowserTabSchema),
  aiConversations: z.array(AIConversationSchema),
  openFiles: z.array(OpenFileSchema),
  workspaceConfig: z.record(z.unknown()).optional(),
  metadata: SessionMetadataSchema.optional()
});

// Request schemas
export const CreateSessionRequestSchema = z.object({
  userId: z.string().uuid(),
  workspaceId: z.string().uuid().optional(),
  name: z.string().max(255).optional(),
  workspaceState: WorkspaceStateSchema,
  config: z.object({
    autoSaveInterval: z.number().min(10).max(300).optional(),
    retentionDays: z.number().min(1).max(365).optional(),
    checkpointRetention: z.number().min(1).max(365).optional(),
    maxSessionSize: z.number().min(1024).max(104857600).optional(), // 1KB to 100MB
    compressionEnabled: z.boolean().optional(),
    encryptionEnabled: z.boolean().optional()
  }).optional()
});

export const UpdateSessionRequestSchema = z.object({
  workspaceState: WorkspaceStateSchema,
  name: z.string().max(255).optional()
});

export const CreateCheckpointRequestSchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional()
});

export const GetSessionRequestSchema = z.object({
  sessionId: z.string().uuid()
});

export const ListSessionsRequestSchema = z.object({
  userId: z.string().uuid(),
  workspaceId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20)
});

export const RestoreSessionRequestSchema = z.object({
  sessionId: z.string().uuid(),
  checkpointId: z.string().uuid().optional()
});

// Response schemas
export const SessionResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  workspaceId: z.string().uuid().nullable(),
  name: z.string().nullable(),
  isActive: z.boolean(),
  lastSavedAt: z.date(),
  expiresAt: z.date(),
  createdAt: z.date(),
  checkpointCount: z.number().min(0),
  totalSize: z.number().min(0)
});

export const CheckpointResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  compressedSize: z.number().min(0),
  uncompressedSize: z.number().min(0),
  createdAt: z.date()
});

export const SessionListResponseSchema = z.object({
  sessions: z.array(SessionResponseSchema),
  total: z.number().min(0),
  page: z.number().min(1),
  pageSize: z.number().min(1).max(100)
});

export const SessionStatsSchema = z.object({
  totalSessions: z.number(),
  activeSessions: z.number(),
  totalSize: z.number(),
  averageSessionSize: z.number(),
  checkpointsCreated: z.number(),
  lastSavedAt: z.date().optional()
});

// Query parameter schemas
export const SessionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  workspaceId: z.string().uuid().optional(),
  isActive: z.string().optional().transform(val => {
    if (val === undefined || val === null) {
return;
}
    return val === 'true' || val === '1';
  }),
  includeCheckpoints: z.string().optional().transform(val => {
    if (val === undefined || val === null) {
return;
}
    return val === 'true' || val === '1';
  })
});

export const CheckpointQuerySchema = z.object({
  sessionId: z.string().uuid(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20)
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string(),
  details: z.record(z.unknown()).optional()
});

// Type exports
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
export type UpdateSessionRequest = z.infer<typeof UpdateSessionRequestSchema>;
export type CreateCheckpointRequest = z.infer<typeof CreateCheckpointRequestSchema>;
export type GetSessionRequest = z.infer<typeof GetSessionRequestSchema>;
export type ListSessionsRequest = z.infer<typeof ListSessionsRequestSchema>;
export type RestoreSessionRequest = z.infer<typeof RestoreSessionRequestSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type CheckpointResponse = z.infer<typeof CheckpointResponseSchema>;
export type SessionListResponse = z.infer<typeof SessionListResponseSchema>;
export type SessionStats = z.infer<typeof SessionStatsSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;