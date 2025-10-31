import { Elysia } from 'elysia';

import { authRoutes } from './routes/auth.routes.js';
import { oauthRoutes } from './routes/oauth.routes.js';
import { workspaceRoutes } from './routes/workspace.routes.js';

const DEFAULT_AUTH_PORT = 3001;
const PORT = process.env.AUTH_PORT || DEFAULT_AUTH_PORT;

/**
 * CORS middleware to handle cross-origin requests
 * @param {{set: {headers: Record<string, string | number>}}} root0 - The middleware context object
 * @param {{headers: Record<string, string | number>}} root0.set - Response configuration object
 * @param {Record<string, string | number>} root0.set.headers - Headers configuration for the response
 * @returns {void} - This function modifies the response headers but doesn't return a value
 */
const corsMiddleware = ({ set }: { set: { headers: Record<string, string | number> } }): void => {
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

    set.status = 500;
    return {
      error: 'Internal server error'
    };
  })
  .listen(PORT);

export { app };
export type AuthApp = typeof app;
