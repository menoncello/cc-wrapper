// Shared authentication types for CC Wrapper

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER'
}

export enum UserType {
  SOLO = 'solo',
  TEAM = 'team',
  ENTERPRISE = 'enterprise'
}

export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github'
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  userType?: UserType;
  oauthProvider?: OAuthProvider;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  preferredAITools?: string[];
  notificationPreferences?: NotificationPreferences;
  defaultWorkspaceId?: string;
  onboardingCompleted: boolean;
  tourCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  template?: string;
  ownerId: string;
  config?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  deviceInfo?: Record<string, unknown>;
  expiresAt: Date;
  createdAt: Date;
}

// API Request/Response Types
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface ProfileUpdateRequest {
  preferredAITools?: string[];
  notificationPreferences?: NotificationPreferences;
  defaultWorkspaceId?: string;
}

export interface OnboardingData {
  userType: UserType;
  preferredAITools: string[];
  workspaceName: string;
  workspaceDescription?: string;
  workspaceTemplate?: string;
}

export interface OAuthCallbackQuery {
  code: string;
  state: string;
}

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for highlighting
  position: 'top' | 'bottom' | 'left' | 'right';
}

// Session Management Types
export interface Checkpoint {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  createdAt: Date;
  compressedSize: number;
  uncompressedSize: number;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  data: string; // Serialized state data
  checksum: string;
  isFull: boolean;
  deltaSize?: number;
}

export interface SessionConfig {
  autoSaveInterval: number; // in seconds
  retentionDays: number;
  maxCheckpoints?: number;
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
}

export interface WorkspaceSession {
  id: string;
  name: string;
  workspaceId: string;
  userId: string;
  config: SessionConfig;
  createdAt: Date;
  updatedAt: Date;
  lastCheckpointAt?: Date;
}

export interface SessionCheckpoint {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  data: string;
  checksum: string;
  size: number;
  isFull: boolean;
  deltaSize?: number;
  createdAt: Date;
}

export interface AIConversation {
  id: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
  metadata?: Record<string, unknown>;
}

export interface OpenFile {
  id: string;
  path: string;
  content: string;
  language?: string;
  lastModified: Date;
  hasUnsavedChanges?: boolean;
}

// API Request/Response Types for Sessions
export interface CreateSessionRequest {
  name: string;
  workspaceId: string;
  config?: Partial<SessionConfig>;
}

export interface CreateCheckpointRequest {
  sessionId: string;
  name: string;
  description?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  isFull?: boolean;
}

export interface UpdateSessionRequest {
  name?: string;
  config?: Partial<SessionConfig>;
}

export interface SessionResponse {
  session: WorkspaceSession;
  checkpointCount: number;
  totalSize: number;
}

export interface CheckpointResponse {
  checkpoint: SessionCheckpoint;
  preview?: Partial<WorkspaceState>; // First few KB of state for preview
}

export interface SessionListResponse {
  sessions: WorkspaceSession[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WorkspaceState {
  files: OpenFile[];
  conversations: AIConversation[];
  activeFileId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
