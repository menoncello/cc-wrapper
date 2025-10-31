import { Elysia } from 'elysia';

// Interface for error handler context to avoid using 'any'
interface ErrorHandlerContext {
  code: string | number;
  error: unknown;
  set: { status?: number | string };
}

// Type definitions for mock auth endpoints
interface LoginRequest {
  email?: string;
  password?: string;
}

interface RegisterRequest {
  email?: string;
  password?: string;
}

// Constants for mock service configuration
const DEFAULT_AUTH_PORT = 20001;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

/**
 * CORS middleware configuration
 * @param {object} param - Elysia context object
 * @param {object} param.set - Response setter object
 * @param {Record<string, string | number>} param.set.headers - HTTP response headers
 * @returns {void}
 */
const corsMiddleware = ({ set }: { set: { headers: Record<string, string | number> } }): void => {
  set.headers['Access-Control-Allow-Origin'] = '*';
  set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
  set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
};

/**
 * Handle mock login request
 * @param {object} param - Elysia request context
 * @param {unknown} param.body - Request body containing login credentials
 * @returns {Promise<object>} Mock authentication response
 */
const handleMockLogin = async ({ body }: { body: unknown }): Promise<object> => {
  const loginData = body as LoginRequest;
  return {
    success: true,
    user: {
      id: 'mock-user-id',
      email: loginData.email || 'test@example.com',
      role: 'DEVELOPER'
    },
    token: 'mock-jwt-token-for-testing'
  };
};

/**
 * Handle mock register request
 * @param {object} param - Elysia request context
 * @param {unknown} param.body - Request body containing registration data
 * @returns {Promise<object>} Mock authentication response
 */
const handleMockRegister = async ({ body }: { body: unknown }): Promise<object> => {
  const registerData = body as RegisterRequest;
  return {
    success: true,
    user: {
      id: 'mock-user-id',
      email: registerData.email || 'test@example.com',
      role: 'DEVELOPER'
    },
    token: 'mock-jwt-token-for-testing'
  };
};

/**
 * Handle service info request
 * @returns {object} Service information object
 */
const getServiceInfo = (): object => ({
  service: 'CC Wrapper Authentication Service (Mock)',
  version: '0.1.0-mock',
  status: 'running'
});

/**
 * Handle health check request
 * @returns {object} Health status object
 */
const getHealthStatus = (): object => ({
  status: 'healthy',
  timestamp: new Date().toISOString()
});

/**
 * Handle preflight OPTIONS requests
 * @returns {string} OK response
 */
const handlePreflight = (): string => 'OK';

/**
 * Global error handler
 * @param {ErrorHandlerContext} context - Error context object from Elysia
 * @returns {object} Error response object
 */
const errorHandler = (context: ErrorHandlerContext): object => {
  const { code, error, set } = context;

  if (code === 'VALIDATION') {
    set.status = HTTP_STATUS_BAD_REQUEST;
    return {
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }

  if (code === 'NOT_FOUND') {
    set.status = HTTP_STATUS_NOT_FOUND;
    return {
      error: 'Route not found'
    };
  }

  set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
  return {
    error: 'Internal server error'
  };
};

/**
 * Create and configure mock authentication service
 * @returns {unknown} Configured Elysia application
 */
const createMockApp = (): unknown => {
  const port = Number(process.env.AUTH_PORT) || DEFAULT_AUTH_PORT;

  return new Elysia()
    .onBeforeHandle(corsMiddleware)
    .options('/*', handlePreflight)
    .get('/', getServiceInfo)
    .get('/health', getHealthStatus)
    .post('/api/auth/login', handleMockLogin)
    .post('/api/auth/register', handleMockRegister)
    .onError(errorHandler)
    .listen(port);
};

const app = createMockApp();

/**
 * Mock authentication service instance
 */
export { app };
