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

export class OAuthService {
  private authService: AuthService;
  private configs: Record<string, OAuthConfig>;

  constructor() {
    this.authService = new AuthService();

    // Validate required OAuth environment variables
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

    // Initialize OAuth provider configurations
    this.configs = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        redirectUri: process.env.GITHUB_REDIRECT_URI!,
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user'
      }
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(provider: string): { url: string; state: string } {
    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

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
   */
  async handleCallback(provider: string, code: string, _state: string): Promise<AuthResponse> {
    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    // Exchange authorization code for access token
    const accessToken = await this.exchangeCodeForToken(provider, code);

    // Get user information from OAuth provider
    const userInfo = await this.getUserInfo(provider, accessToken);

    // Create or login OAuth user
    return await this.authService.createOAuthUser(
      userInfo.email,
      provider,
      userInfo.id,
      userInfo.name
    );
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(provider: string, code: string): Promise<string> {
    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

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
   */
  private async getUserInfo(provider: string, accessToken: string): Promise<OAuthUserInfo> {
    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

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

    // Parse user info based on provider
    if (provider === 'google') {
      return {
        id: (data as { id: string }).id,
        email: (data as { email: string }).email,
        name: (data as { name?: string }).name
      };
    } else if (provider === 'github') {
      return {
        id: String((data as { id: number }).id),
        email: (data as { email: string }).email,
        name: (data as { name?: string }).name
      };
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * Get OAuth scope based on provider
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
   */
  validateState(state: string, expectedState: string): boolean {
    return state === expectedState;
  }
}
