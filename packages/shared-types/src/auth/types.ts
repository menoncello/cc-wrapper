// Shared authentication types for CC Wrapper

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER'
}

export const OWNER = 'OWNER';
export const ADMIN = 'ADMIN';
export const DEVELOPER = 'DEVELOPER';
export const VIEWER = 'VIEWER';

export enum UserRole {
  OWNER = OWNER,
  ADMIN = ADMIN,
  DEVELOPER = DEVELOPER,
  VIEWER = VIEWER
}

export const SOLO = 'solo';
export const TEAM = 'team';
export const ENTERPRISE = 'enterprise';

export enum UserType {
  SOLO = SOLO,
  TEAM = TEAM,
  ENTERPRISE = ENTERPRISE
}

export const GOOGLE = 'google';
export const GITHUB = 'github';

export enum OAuthProvider {
  GOOGLE = GOOGLE,
  GITHUB = GITHUB
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
