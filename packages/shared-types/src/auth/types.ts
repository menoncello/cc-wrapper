// Shared authentication types for CC Wrapper

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER'
}

// Export enum values to avoid unused variable warnings
export const { OWNER, ADMIN, DEVELOPER, VIEWER } = UserRole;

export enum UserType {
  SOLO = 'solo',
  TEAM = 'team',
  ENTERPRISE = 'enterprise'
}

// Export enum values to avoid unused variable warnings
export const { SOLO, TEAM, ENTERPRISE } = UserType;

export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github'
}

// Export enum values to avoid unused variable warnings
export const { GOOGLE, GITHUB } = OAuthProvider;

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
