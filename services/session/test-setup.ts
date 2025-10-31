/**
 * Test setup for Session Service
 * Configures test environment, mocking, and global setup
 */

import { PrismaClient } from '@prisma/client';
import { afterAll, afterEach,beforeAll, beforeEach } from 'bun:test';

// Mock Prisma client for testing
let mockPrisma: PrismaClient | null = null;

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Initialize mock Prisma client
  mockPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/ccwrapper_test'
      }
    }
  });

  // Set global mocks for console methods to reduce noise in tests
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});

beforeEach(async () => {
  // Clean up test data before each test if needed
  if (mockPrisma && process.env.NODE_ENV === 'test') {
    try {
      // Clean up test data
      await mockPrisma.workspaceSession.deleteMany({
        where: {
          userId: { startsWith: 'test-' }
        }
      });
      await mockPrisma.sessionCheckpoint.deleteMany({
        where: {
          sessionId: { startsWith: 'test-' }
        }
      });
    } catch (error) {
      // Ignore database errors in test environment
      console.warn('Test cleanup failed:', error);
    }
  }
});

afterEach(() => {
  // Clear any mocks after each test
  jest.clearAllMocks();
});

afterAll(async () => {
  // Cleanup database connections
  if (mockPrisma) {
    await mockPrisma.$disconnect();
  }
});

// Export the mock prisma client for tests that need it
export { mockPrisma };