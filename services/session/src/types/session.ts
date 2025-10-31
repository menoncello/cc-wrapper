/**
 * Session Service Types
 * Defines workspace session persistence and recovery types
 */

export interface WorkspaceState {
  terminalState: TerminalState[];
  browserTabs: BrowserTab[];
  aiConversations: AIConversation[];
  openFiles: OpenFile[];
  workspaceConfig?: Record<string, unknown>;
  metadata?: SessionMetadata;
}

export interface TerminalState {
  id: string;
  cwd: string;
  command?: string;
  history: string[];
  env?: Record<string, string>;
  isActive: boolean;
}

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
  scrollPosition?: { x: number; y: number };
  formData?: Record<string, unknown>;
}

export interface AIConversation {
  id: string;
  sessionId: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface OpenFile {
  id: string;
  path: string;
  content: string;
  cursor?: { line: number; column: number };
  scrollPosition?: number;
  isDirty: boolean;
  language?: string;
}

export interface SessionMetadata {
  name?: string;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  iv: string; // Initialization vector
  salt: string; // Encryption salt
  algorithm: string; // Encryption algorithm used
}

export interface SessionConfig {
  autoSaveInterval: number; // seconds
  retentionDays: number;
  checkpointRetention: number; // days
  maxSessionSize: number; // bytes
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

export interface CreateSessionRequest {
  userId: string;
  workspaceId?: string;
  name?: string;
  workspaceState: WorkspaceState;
  config?: Partial<SessionConfig>;
}

export interface UpdateSessionRequest {
  workspaceState: WorkspaceState;
  name?: string;
}

export interface CreateCheckpointRequest {
  sessionId: string;
  name: string;
  description?: string;
}

export interface SessionResponse {
  id: string;
  userId: string;
  workspaceId?: string;
  name?: string;
  isActive: boolean;
  lastSavedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  checkpointCount: number;
  totalSize: number;
}

export interface CheckpointResponse {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  compressedSize: number;
  uncompressedSize: number;
  createdAt: Date;
}

export interface SessionListResponse {
  sessions: SessionResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  totalSize: number;
  averageSessionSize: number;
  checkpointsCreated: number;
  lastSavedAt?: Date;
}

export interface SessionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checksumMatch: boolean;
  canRecover: boolean;
}

export interface SessionRecoveryOptions {
  useLastKnownGood: boolean;
  fallbackToCheckpoint?: string;
  skipCorruptedData: boolean;
  preserveMetadata: boolean;
}