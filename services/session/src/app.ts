/**
 * Main Session Service Application
 * Integrates all services and provides unified API
 */

import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { PrismaClient } from '@prisma/client';
import { Elysia } from 'elysia';

// Import route modules
import { checkpointRoutes } from './routes/checkpoints';
import { encryptionRoutes } from './routes/encryption';
import { defaultConfig,integrationRoutes  } from './routes/integration';
import { keyRotationRoutes } from './routes/key-rotation';
import { keysRoutes } from './routes/keys';
import { secureDerivationRoutes } from './routes/secure-derivation';
import { sessionRoutes } from './routes/sessions';
import { synchronizationRoutes } from './routes/synchronization';
// Import services
import { IntegrationService } from './services/integration.service';
import { SessionSynchronizationService } from './services/synchronization.service';

const prisma = new PrismaClient();
const syncService = new SessionSynchronizationService();
const integrationService = new IntegrationService(defaultConfig);

export const app = new Elysia()
  .use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'CC Wrapper Session Service',
        version: '1.2.0',
        description: 'Enterprise-grade session persistence and recovery service with real-time synchronization'
      },
      tags: [
        { name: 'Sessions', description: 'Session management operations' },
        { name: 'Checkpoints', description: 'Manual checkpoint operations' },
        { name: 'Keys', description: 'Encryption key management' },
        { name: 'Encryption', description: 'Data encryption/decryption' },
        { name: 'Key Rotation', description: 'Key rotation operations' },
        { name: 'Secure Derivation', description: 'Secure key derivation' },
        { name: 'Synchronization', description: 'Real-time synchronization' },
        { name: 'Integration', description: 'External service integrations' }
      ]
    }
  }))
  .use(sessionRoutes)
  .use(checkpointRoutes)
  .use(keysRoutes)
  .use(encryptionRoutes)
  .use(keyRotationRoutes)
  .use(secureDerivationRoutes)
  .use(synchronizationRoutes)
  .use(integrationRoutes)
  .get('/', () => {
    return {
      service: 'CC Wrapper Session Service',
      version: '1.2.0',
      status: 'operational',
      features: [
        'Session persistence and recovery',
        'Real-time synchronization',
        'Manual checkpoint system',
        'User-controlled encryption',
        'Key rotation and management',
        'Secure key derivation',
        'External service integrations'
      ],
      endpoints: {
        sessions: '/sessions',
        checkpoints: '/checkpoints',
        keys: '/keys',
        encryption: '/encryption',
        keyRotation: '/rotation',
        secureDerivation: '/derivation',
        synchronization: '/sync',
        integration: '/integration',
        documentation: '/swagger'
      }
    };
  })
  .get('/health', async () => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      const dbHealth = 'healthy';

      // Check services
      const integrationHealth = await integrationService.checkServiceHealth();
      const syncMetrics = syncService.getMetrics();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth,
          synchronization: {
            status: syncMetrics.activeSubscriptions > 0 ? 'active' : 'idle',
            metrics: syncMetrics
          },
          integration: {
            status: integrationHealth.every(h => h.status === 'healthy') ? 'healthy' : 'degraded',
            services: integrationHealth
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })
  .get('/metrics', async () => {
    try {
      const syncMetrics = syncService.getMetrics();
      const integrationHealth = await integrationService.checkServiceHealth();
      const activeSubscriptions = syncService.getActiveSubscriptions();
      const unresolvedConflicts = syncService.getUnresolvedConflicts();

      return {
        timestamp: new Date().toISOString(),
        synchronization: {
          ...syncMetrics,
          activeSubscriptions: activeSubscriptions.length,
          unresolvedConflicts: unresolvedConflicts.length
        },
        integration: {
          totalServices: integrationHealth.length,
          healthyServices: integrationHealth.filter(h => h.status === 'healthy').length,
          degradedServices: integrationHealth.filter(h => h.status === 'degraded').length,
          unhealthyServices: integrationHealth.filter(h => h.status === 'unhealthy').length
        }
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to get metrics'
      };
    }
  })
  .onError(({ error, code, set }) => {
    console.error('Application error:', error);

    switch (code) {
      case 'VALIDATION':
        set.status = 400;
        return {
          success: false,
          error: 'Validation failed',
          details: error.message
        };
      case 'NOT_FOUND':
        set.status = 404;
        return {
          success: false,
          error: 'Resource not found',
          details: error.message
        };
      case 'INTERNAL_SERVER_ERROR':
        set.status = 500;
        return {
          success: false,
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        };
      default:
        set.status = 500;
        return {
          success: false,
          error: 'An unexpected error occurred',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
  })
  .onBeforeHandle(({ set }) => {
    // Add security headers
    set.headers = {
      ...set.headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'"
    };
  })
  .listen({
    port: Number(process.env.PORT) || 3000,
    hostname: process.env.HOST || '0.0.0.0'
  });

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');

  try {
    await syncService.shutdown();
    await integrationService.shutdown();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');

  try {
    await syncService.shutdown();
    await integrationService.shutdown();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log(`🚀 CC Wrapper Session Service v1.2.0 started on ${app.server?.hostname}:${app.server?.port}`);
console.log(`📚 API Documentation: http://${app.server?.hostname}:${app.server?.port}/swagger`);
console.log(`💚 Health Check: http://${app.server?.hostname}:${app.server?.port}/health`);