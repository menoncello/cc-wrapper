import type { AuthResponse } from '@cc-wrapper/shared-types';

import { OAUTH_STATE_TOKEN_SIZE } from '../constants/auth.constants.js';
import { generateRandomToken } from '../lib/crypto.js';
import { AuthService } from './auth.service.js';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

interface OAuthUserInfo {
  email: string;
  name?: string;
  id: string;
}

/**
 * OAuth service for handling social authentication (Google, GitHub)
 * Manages OAuth flows, token exchange, and user creation from social providers
 */
export class OAuthService {
  private authService: AuthService;
  private configs: Record<string, OAuthConfig>;

  /**
   * Initialize OAuth service with provider configurations
   * Validates required environment variables and sets up OAuth provider settings
   * @throws {Error} When required OAuth environment variables are missing
   */
  public constructor() {
    this.authService = new AuthService();
    this.configs = this.initializeProviderConfigs();
  }

  /**
   * Initialize OAuth provider configurations
   * @returns {Record<string, OAuthConfig>} Provider configuration object
   * @throws {Error} When required environment variables are missing
   */
  private initializeProviderConfigs(): Record<string, OAuthConfig> {
    this.validateRequiredEnvVars();

    return {
      google: this.createGoogleConfig(),
      github: this.createGithubConfig()
    };
  }

  /**
   * Validate required OAuth environment variables
   * @throws {Error} When required environment variables are missing
   */
  private validateRequiredEnvVars(): void {
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REDIRECT_URI',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'GITHUB_REDIRECT_URI'
    ];

    const missing = requiredEnvVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required OAuth environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Create Google OAuth configuration
   * @returns {OAuthConfig} Google OAuth configuration
   */
  private createGoogleConfig(): OAuthConfig {
    return {
      clientId: this.getRequiredEnvVar('GOOGLE_CLIENT_ID'),
      clientSecret: this.getRequiredEnvVar('GOOGLE_CLIENT_SECRET'),
      redirectUri: this.getRequiredEnvVar('GOOGLE_REDIRECT_URI'),
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
    };
  }

  /**
   * Create GitHub OAuth configuration
   * @returns {OAuthConfig} GitHub OAuth configuration
   */
  private createGithubConfig(): OAuthConfig {
    return {
      clientId: this.getRequiredEnvVar('GITHUB_CLIENT_ID'),
      clientSecret: this.getRequiredEnvVar('GITHUB_CLIENT_SECRET'),
      redirectUri: this.getRequiredEnvVar('GITHUB_REDIRECT_URI'),
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user'
    };
  }

  /**
   * Get required environment variable or throw error
   * @param {string} key - Environment variable name
   * @returns {string} Environment variable value
   * @throws {Error} When environment variable is missing
   */
  private getRequiredEnvVar(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  /**
   * Generate OAuth authorization URL
   * @param {string} provider - OAuth provider name ('google' or 'github')
   * @returns {{url: string, state: string}} Object containing authorization URL and CSRF state token
   * @throws {Error} When provider is not supported
   */
  public getAuthorizationUrl(provider: string): { url: string; state: string } {
    const config = this.getProviderConfig(provider);

    // Generate state token for CSRF protection
    const state = generateRandomToken(OAUTH_STATE_TOKEN_SIZE);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      state,
      scope: this.getScope(provider)
    });

    const url = `${config.authorizationUrl}?${params.toString()}`;

    return { url, state };
  }

  /**
   * Handle OAuth callback and create/login user
   * @param {string} provider - OAuth provider name
   * @param {string} code - Authorization code from OAuth provider
   * @param {string} _state - State parameter for CSRF protection (unused after validation)
   * @returns {Promise<AuthResponse>} Authentication response containing user data and tokens
   * @throws {Error} When provider is not supported or callback fails
   */
  public async handleCallback(
    provider: string,
    code: string,
    _state: string
  ): Promise<AuthResponse> {
    const accessToken = await this.exchangeCodeForToken(provider, code);
    const userInfo = await this.getUserInfo(provider, accessToken);

    return this.authService.createOAuthUser(userInfo.email, provider, userInfo.id, userInfo.name);
  }

  /**
   * Exchange authorization code for access token
   * @param {string} provider - OAuth provider name
   * @param {string} code - Authorization code from OAuth provider
   * @returns {Promise<string>} Access token string
   * @throws {Error} When token exchange fails
   */
  private async exchangeCodeForToken(provider: string, code: string): Promise<string> {
    const config = this.getProviderConfig(provider);

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  /**
   * Get user information from OAuth provider
   * @param {string} provider - OAuth provider name
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<OAuthUserInfo>} User information from provider
   * @throws {Error} When user info fetch fails or provider is unsupported
   */
  private async getUserInfo(provider: string, accessToken: string): Promise<OAuthUserInfo> {
    const config = this.getProviderConfig(provider);

    const response = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseUserInfo(provider, data);
  }

  /**
   * Parse user info response based on provider
   * @param {string} provider - OAuth provider name
   * @param {unknown} data - Raw response data from provider
   * @returns {OAuthUserInfo} Standardized user information
   * @throws {Error} When provider is not supported
   */
  private parseUserInfo(provider: string, data: unknown): OAuthUserInfo {
    if (provider === 'google') {
      const googleData = data as { id: string; email: string; name?: string };
      return {
        id: googleData.id,
        email: googleData.email,
        name: googleData.name
      };
    } else if (provider === 'github') {
      const githubData = data as { id: number; email: string; name?: string };
      return {
        id: String(githubData.id),
        email: githubData.email,
        name: githubData.name
      };
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * Get OAuth scope based on provider
   * @param {string} provider - OAuth provider name
   * @returns {string} OAuth scope string for the provider
   */
  private getScope(provider: string): string {
    const scopes: Record<string, string> = {
      google: 'openid email profile',
      github: 'user:email'
    };

    return scopes[provider] || '';
  }

  /**
   * Validate OAuth state token (CSRF protection)
   * In production, store states in Redis with expiration
   * @param {string} state - State parameter from OAuth callback
   * @param {string} expectedState - Original state parameter stored in cookie
   * @returns {boolean} True if state tokens match
   */
  public validateState(state: string, expectedState: string): boolean {
    return state === expectedState;
  }

  /**
   * Get provider configuration or throw error
   * @param {string} provider - OAuth provider name
   * @returns {OAuthConfig} Provider configuration object
   * @throws {Error} When provider is not supported
   */
  private getProviderConfig(provider: string): OAuthConfig {
    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    return config;
  }
}
