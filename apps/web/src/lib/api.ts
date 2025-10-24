// API client for interacting with the backend

/* eslint-disable @typescript-eslint/no-explicit-any */
/* global localStorage RequestInit fetch */

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:20001';

export class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Try to load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Workspace endpoints
  async createWorkspace(data: {
    userType: string;
    preferredAITools: string[];
    workspaceName: string;
    workspaceDescription?: string;
    workspaceTemplate?: string;
  }) {
    return this.request('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getWorkspaces() {
    return this.request('/api/workspaces');
  }

  // Profile endpoints
  async updateProfile(data: {
    preferredAITools?: string[];
    notificationPreferences?: {
      email: boolean;
      inApp: boolean;
      quietHours?: {
        enabled: boolean;
        start: string;
        end: string;
      };
    };
    defaultWorkspaceId?: string;
    tourCompleted?: boolean;
    onboardingCompleted?: boolean;
  }) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }
}

export const apiClient = new APIClient(API_BASE_URL);
