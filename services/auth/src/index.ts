import { Elysia } from 'elysia';

import { authRoutes } from './routes/auth.routes.js';
import { oauthRoutes } from './routes/oauth.routes.js';
import { workspaceRoutes } from './routes/workspace.routes.js';

const PORT = process.env.AUTH_PORT || 3001;

/**
 * CC Wrapper Authentication Service
 * Built with Elysia on Bun runtime
 * Uses Bun-native crypto for authentication (no external JWT libraries)
 */
// CORS middleware
const corsMiddleware = ({ set }: { set: { headers: Record<string, string | number> } }) => {
  set.headers['Access-Control-Allow-Origin'] = '*';
  set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
  set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
};

const app = new Elysia()
  .onBeforeHandle(corsMiddleware)
  .options('/*', () => 'OK') // Handle all preflight requests
  .get('/', () => ({
    service: 'CC Wrapper Authentication Service',
    version: '0.1.0',
    status: 'running'
  }))
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString()
  }))
  .use(authRoutes)
  .use(oauthRoutes)
  .use(workspaceRoutes)
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        error: 'Validation failed',
        message: error.message
      };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        error: 'Route not found'
      };
    }

    // Log error for debugging
    console.error('Error:', error);

    set.status = 500;
    return {
      error: 'Internal server error'
    };
  })
  .listen(PORT);

console.log(`🚀 Authentication service running at http://localhost:${app.server?.port}`);
console.log(`📝 API Health Check: http://localhost:${app.server?.port}/health`);
console.log(`🔌 Auth endpoints available at: http://localhost:${app.server?.port}/api/auth`);
console.log(
  `💼 Workspace endpoints available at: http://localhost:${app.server?.port}/api/workspaces`
);

export default app;
export type AuthApp = typeof app;
