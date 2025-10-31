// API client for interacting with the backend

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:20001';

/**
 * API client for interacting with the backend services
 * @class
 */
export class APIClient {
  private baseURL: string;
  private token: string | null = null;

  /**
   * Creates a new API client instance
   * @param {string} baseURL - The base URL for the API
   * @class
   */
  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Try to load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  /**
   * Sets the authentication token for API requests
   * @param {string} token - The authentication token to use
   * @returns {void}
   */
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * Clears the authentication token
   * @returns {void} void
   */
  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Makes an HTTP request to the API endpoint
   * @param {string} endpoint - The API endpoint to request
   * @param {RequestInit} [options={}] - Optional request configuration
   * @returns {Promise<T>} Promise resolving to the response data
   */
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
  /**
   * Creates a new workspace
   * @param {object} data - Workspace creation data
   * @param {string} data.userType - The type of user (developer, designer, etc.)
   * @param {string[]} data.preferredAITools - Array of preferred AI tools
   * @param {string} data.workspaceName - The name of the workspace
   * @param {string} [data.workspaceDescription] - Optional description of the workspace
   * @param {string} [data.workspaceTemplate] - Optional template to use for the workspace
   * @returns {Promise<unknown>} Promise resolving to the created workspace data
   */
  async createWorkspace(data: {
    userType: string;
    preferredAITools: string[];
    workspaceName: string;
    workspaceDescription?: string;
    workspaceTemplate?: string;
  }): Promise<unknown> {
    return this.request('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Retrieves all workspaces for the current user
   * @returns {Promise<unknown>} Promise resolving to array of workspaces
   */
  async getWorkspaces(): Promise<unknown> {
    return this.request('/api/workspaces');
  }

  // Profile endpoints
  /**
   * Updates the current user's profile
   * @param {object} data - Profile update data
   * @param {string[]} [data.preferredAITools] - Optional array of preferred AI tools
   * @param {object} [data.notificationPreferences] - Optional notification preferences
   * @param {boolean} data.notificationPreferences.email - Whether email notifications are enabled
   * @param {boolean} data.notificationPreferences.inApp - Whether in-app notifications are enabled
   * @param {object} [data.notificationPreferences.quietHours] - Optional quiet hours configuration
   * @param {boolean} data.notificationPreferences.quietHours.enabled - Whether quiet hours are enabled
   * @param {string} data.notificationPreferences.quietHours.start - Start time for quiet hours
   * @param {string} data.notificationPreferences.quietHours.end - End time for quiet hours
   * @param {string} [data.defaultWorkspaceId] - Optional default workspace ID
   * @param {boolean} [data.tourCompleted] - Optional flag indicating if tour is completed
   * @param {boolean} [data.onboardingCompleted] - Optional flag indicating if onboarding is completed
   * @returns {Promise<unknown>} Promise resolving to the updated profile data
   */
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
  }): Promise<unknown> {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Retrieves the current user's profile
   * @returns {Promise<unknown>} Promise resolving to the current user data
   */
  async getCurrentUser(): Promise<unknown> {
    return this.request('/api/auth/me');
  }
}

export const apiClient = new APIClient(API_BASE_URL);
