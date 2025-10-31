import { Elysia, t } from 'elysia';

import { OAUTH_STATE_COOKIE_MAX_AGE } from '../constants/auth.constants.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { oauthCallbackSchema } from '../schemas/auth.js';
import { OAuthService } from '../services/oauth.service.js';

// HTTP status constants
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_FOUND = 302;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const oauthService = new OAuthService();

/**
 * Extract OAuth state from cookie headers
 * @param {string} cookies - Cookie header string
 * @returns {string} The extracted state token or empty string if not found
 */
function extractStateFromCookie(cookies: string): string {
  const stateCookie = cookies.split(';').find(c => c.trim().startsWith('oauth_state='));
  const cookieParts = stateCookie?.split('=');
  return cookieParts && cookieParts.length > 1 ? cookieParts[1] || '' : '';
}

/**
 * Validate OAuth provider
 * @param {string} provider - OAuth provider name
 * @returns {boolean} Whether the provider is supported
 */
function validateProvider(provider: string): boolean {
  return provider === 'google' || provider === 'github';
}

/**
 * Create error response for invalid provider
 * @param {object} set - Elysia response setter
 * @param {number | string} set.status - HTTP status code
 * @returns {object} Error response
 */
function createInvalidProviderResponse(set: { status?: number | string }): { error: string } {
  set.status = HTTP_STATUS_BAD_REQUEST;
  return { error: 'Unsupported OAuth provider' };
}

/**
 * Validate OAuth state from cookies
 * @param {string} cookieHeader - Cookie header from request
 * @param {string} providedState - State parameter from OAuth callback
 * @returns {string | null} Validated state or null if invalid
 */
function validateOAuthState(cookieHeader: string | null, providedState: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const expectedState = extractStateFromCookie(cookieHeader);
  if (!expectedState) {
    return null;
  }

  return oauthService.validateState(providedState, expectedState) ? expectedState : null;
}

/**
 * Create state cookie header
 * @param {string} state - OAuth state token
 * @returns {string} Set-Cookie header value
 */
function createStateCookie(state: string): string {
  return `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${OAUTH_STATE_COOKIE_MAX_AGE}`;
}

/**
 * Create clear state cookie header
 * @returns {string} Set-Cookie header to clear state
 */
function createClearStateCookie(): string {
  return 'oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0';
}

/**
 * OAuth routes for social login (Google, GitHub)
 */
export const oauthRoutes = new Elysia({ prefix: '/api/auth/oauth' })
  .derive(rateLimitMiddleware())

  // GET /api/auth/oauth/:provider - Initiate OAuth flow
  .get(
    '/:provider',
    async ({ params, set }) => {
      try {
        const { provider } = params;

        if (!validateProvider(provider)) {
          return createInvalidProviderResponse(set);
        }

        // Generate authorization URL with state token
        const { url, state } = oauthService.getAuthorizationUrl(provider);

        // Store state in cookie for validation (simple approach)
        // Production should use secure session storage
        set.headers = {
          'Set-Cookie': createStateCookie(state)
        };

        // Redirect to OAuth provider
        set.status = HTTP_STATUS_FOUND;
        set.headers['Location'] = url;

        return { redirectUrl: url };
      } catch (error) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return {
          error: error instanceof Error ? error.message : 'OAuth initialization failed'
        };
      }
    },
    {
      params: t.Object({
        provider: t.String()
      })
    }
  )

  // GET /api/auth/oauth/:provider/callback - Handle OAuth callback
  .get(
    '/:provider/callback',
    async ({ params, query, request, set }) => {
      try {
        const { provider } = params;

        if (!validateProvider(provider)) {
          return createInvalidProviderResponse(set);
        }

        // Validate query parameters
        const validatedQuery = oauthCallbackSchema.parse(query);

        // Extract and validate state from cookie
        const cookieHeader = request.headers.get('Cookie');
        const validatedState = validateOAuthState(cookieHeader, validatedQuery.state);

        if (!validatedState) {
          set.status = HTTP_STATUS_BAD_REQUEST;
          return { error: 'Invalid or missing state parameter' };
        }

        // Handle OAuth callback (state already validated above)
        const result = await oauthService.handleCallback(
          provider,
          validatedQuery.code,
          validatedState
        );

        // Clear state cookie
        set.headers = {
          'Set-Cookie': createClearStateCookie()
        };

        return result;
      } catch (error) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return {
          error: error instanceof Error ? error.message : 'OAuth callback failed'
        };
      }
    },
    {
      params: t.Object({
        provider: t.String()
      }),
      query: t.Object({
        code: t.String(),
        state: t.String()
      })
    }
  );
