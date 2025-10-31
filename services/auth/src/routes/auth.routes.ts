import { Elysia, t } from 'elysia';

import { VALIDATION_CONSTANTS } from '../constants/auth.constants.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { loginSchema, profileUpdateSchema, registerSchema } from '../schemas/auth.js';
import { AuthService } from '../services/auth.service.js';

const authService = new AuthService();

/**
 * Authentication routes for CC Wrapper
 * All routes use Bun-native crypto implementations
 */
export const authRoutes = new Elysia({ prefix: '/api/auth' })
  // Apply rate limiting to all auth routes
  .derive(rateLimitMiddleware())

  // POST /api/auth/register - Register new user
  .post(
    '/register',
    async ({ body, set }) => {
      try {
        // Validate request body
        const validatedData = registerSchema.parse(body);

        // Register user
        const result = await authService.register(validatedData);

        set.status = 201;
        return result;
      } catch (error) {
        set.status = 400;
        return {
          error: error instanceof Error ? error.message : 'Registration failed'
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
        name: t.Optional(t.String())
      })
    }
  )

  // POST /api/auth/login - Login user
  .post(
    '/login',
    async ({ body, set }) => {
      try {
        // Validate request body
        const validatedData = loginSchema.parse(body);

        // Login user
        return await authService.login(validatedData.email, validatedData.password);
      } catch (error) {
        set.status = 401;
        return {
          error: error instanceof Error ? error.message : 'Login failed'
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String()
      })
    }
  )

  // POST /api/auth/logout - Logout user
  .post('/logout', async ({ request, set }) => {
    try {
      // Verify authentication
      await authMiddleware({ request, set });

      // Extract token
      const token = request.headers
        .get('Authorization')
        ?.substring(VALIDATION_CONSTANTS.BEARER_PREFIX_LENGTH);
      if (!token) {
        throw new Error('Token not found');
      }

      // Logout user
      await authService.logout(token);

      return { success: true };
    } catch (error) {
      set.status = 401;
      return {
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  })

  // GET /api/auth/me - Get current user
  .get('/me', async ({ request, set }) => {
    try {
      // Verify authentication
      const payload = await authMiddleware({ request, set });

      // Get user details
      const user = await authService.getUserById(payload.userId);

      if (!user) {
        set.status = 404;
        return { error: 'User not found' };
      }

      return { user };
    } catch (error) {
      set.status = 401;
      return {
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  })

  // PUT /api/auth/profile - Update user profile
  .put(
    '/profile',
    async ({ request, body, set }) => {
      try {
        // Verify authentication
        const payload = await authMiddleware({ request, set });

        // Validate request body
        const validatedData = profileUpdateSchema.parse(body);

        // Update profile
        const profile = await authService.updateProfile(payload.userId, validatedData);

        return { profile };
      } catch (error) {
        set.status = 400;
        return {
          error: error instanceof Error ? error.message : 'Profile update failed'
        };
      }
    },
    {
      body: t.Object({
        preferredAITools: t.Optional(t.Array(t.String())),
        notificationPreferences: t.Optional(
          t.Object({
            email: t.Boolean(),
            inApp: t.Boolean(),
            quietHours: t.Optional(
              t.Object({
                enabled: t.Boolean(),
                start: t.String(),
                end: t.String()
              })
            )
          })
        ),
        defaultWorkspaceId: t.Optional(t.String())
      })
    }
  );
