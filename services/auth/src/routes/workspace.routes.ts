import { UserType } from '@cc-wrapper/shared-types';
import { Elysia, t } from 'elysia';

import { authMiddleware } from '../middleware/auth.js';
import { onboardingDataSchema } from '../schemas/auth.js';
import { WorkspaceService } from '../services/workspace.service.js';

const workspaceService = new WorkspaceService();

/**
 * Workspace routes for CC Wrapper
 */
export const workspaceRoutes = new Elysia({ prefix: '/api/workspaces' })
  // POST /api/workspaces - Create workspace from onboarding
  .post(
    '/',
    async ({ request, body, set }) => {
      try {
        // Verify authentication
        const payload = await authMiddleware({ request, set });

        // Validate onboarding data
        const validatedData = onboardingDataSchema.parse(body);

        // Map string to UserType enum
        const userTypeMap: Record<string, UserType> = {
          solo: UserType.SOLO,
          team: UserType.TEAM,
          enterprise: UserType.ENTERPRISE
        };

        // Create default workspace with properly typed data
        const workspace = await workspaceService.createDefaultWorkspace(payload.userId, {
          userType: userTypeMap[validatedData.userType] || UserType.SOLO,
          preferredAITools: validatedData.preferredAITools,
          workspaceName: validatedData.workspaceName,
          workspaceDescription: validatedData.workspaceDescription,
          workspaceTemplate: validatedData.workspaceTemplate
        });

        set.status = 201;
        return { workspace };
      } catch (error) {
        set.status = 400;
        return {
          error: error instanceof Error ? error.message : 'Workspace creation failed'
        };
      }
    },
    {
      body: t.Object({
        userType: t.Union([t.Literal('solo'), t.Literal('team'), t.Literal('enterprise')]),
        preferredAITools: t.Array(t.String()),
        workspaceName: t.String(),
        workspaceDescription: t.Optional(t.String()),
        workspaceTemplate: t.Optional(
          t.Union([
            t.Literal('React'),
            t.Literal('Node.js'),
            t.Literal('Python'),
            t.Literal('Custom')
          ])
        )
      })
    }
  )

  // GET /api/workspaces - Get user workspaces
  .get('/', async ({ request, set }) => {
    try {
      // Verify authentication
      const payload = await authMiddleware({ request, set });

      // Get workspaces
      const workspaces = await workspaceService.getUserWorkspaces(payload.userId);

      return { workspaces };
    } catch (error) {
      set.status = 401;
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch workspaces'
      };
    }
  })

  // GET /api/workspaces/:id - Get workspace by ID
  .get(
    '/:id',
    async ({ request, params, set }) => {
      try {
        // Verify authentication
        await authMiddleware({ request, set });

        // Get workspace
        const workspace = await workspaceService.getWorkspaceById(params.id);

        if (!workspace) {
          set.status = 404;
          return { error: 'Workspace not found' };
        }

        return { workspace };
      } catch (error) {
        set.status = 401;
        return {
          error: error instanceof Error ? error.message : 'Failed to fetch workspace'
        };
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  );
