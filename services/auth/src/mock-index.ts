import { Elysia } from 'elysia';

// Type definitions for mock auth endpoints
interface LoginRequest {
  email?: string;
  password?: string;
}

interface RegisterRequest {
  email?: string;
  password?: string;
}

const PORT = process.env.AUTH_PORT || 20001;

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
    service: 'CC Wrapper Authentication Service (Mock)',
    version: '0.1.0-mock',
    status: 'running'
  }))
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString()
  }))
  // Mock auth endpoints for testing
  .post('/api/auth/login', async ({ body }) => {
    const loginData = body as LoginRequest;
    console.log('Mock login request:', loginData);
    return {
      success: true,
      user: {
        id: 'mock-user-id',
        email: loginData.email || 'test@example.com',
        role: 'DEVELOPER'
      },
      token: 'mock-jwt-token-for-testing'
    };
  })
  .post('/api/auth/register', async ({ body }) => {
    const registerData = body as RegisterRequest;
    console.log('Mock register request:', registerData);
    return {
      success: true,
      user: {
        id: 'mock-user-id',
        email: registerData.email || 'test@example.com',
        role: 'DEVELOPER'
      },
      token: 'mock-jwt-token-for-testing'
    };
  })
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

console.log(`🚀 Mock Authentication service running at http://localhost:${app.server?.port}`);
console.log(`📝 API Health Check: http://localhost:${app.server?.port}/health`);
console.log(`🔌 Mock Auth endpoints available at: http://localhost:${app.server?.port}/api/auth`);

export default app;
