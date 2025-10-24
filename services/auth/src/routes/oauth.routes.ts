import { Elysia, t } from 'elysia';

import { OAUTH_STATE_COOKIE_MAX_AGE } from '../constants/auth.constants.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { oauthCallbackSchema } from '../schemas/auth.js';
import { OAuthService } from '../services/oauth.service.js';

const oauthService = new OAuthService();

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

        if (provider !== 'google' && provider !== 'github') {
          set.status = 400;
          return { error: 'Unsupported OAuth provider' };
        }

        // Generate authorization URL with state token
        const { url, state } = oauthService.getAuthorizationUrl(provider);

        // Store state in cookie for validation (simple approach)
        // Production should use secure session storage
        set.headers = {
          'Set-Cookie': `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${OAUTH_STATE_COOKIE_MAX_AGE}`
        };

        // Redirect to OAuth provider
        set.status = 302;
        set.redirect = url;

        return { redirectUrl: url };
      } catch (error) {
        set.status = 500;
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

        if (provider !== 'google' && provider !== 'github') {
          set.status = 400;
          return { error: 'Unsupported OAuth provider' };
        }

        // Validate query parameters
        const validatedQuery = oauthCallbackSchema.parse(query);

        // Get state from cookie
        const cookies = request.headers.get('Cookie') || '';
        const stateCookie = cookies.split(';').find(c => c.trim().startsWith('oauth_state='));
        const cookieParts = stateCookie?.split('=');
        const expectedState = cookieParts && cookieParts.length > 1 ? cookieParts[1] : '';

        // Ensure state is present
        if (!expectedState) {
          set.status = 400;
          return { error: 'Missing state cookie' };
        }

        // Validate state token (CSRF protection)
        if (!oauthService.validateState(validatedQuery.state, expectedState)) {
          set.status = 400;
          return { error: 'Invalid state parameter' };
        }

        // Handle OAuth callback (state already validated above)
        const result = await oauthService.handleCallback(
          provider,
          validatedQuery.code,
          expectedState
        );

        // Clear state cookie
        set.headers = {
          'Set-Cookie': 'oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
        };

        return result;
      } catch (error) {
        set.status = 400;
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
