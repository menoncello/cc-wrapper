/**
 * Mock Prisma Client for Testing
 * Provides consistent mocking across all test files
 */

import { mock } from 'bun:test';

// Create comprehensive mock structure
export const createMockPrisma = () => ({
  userEncryptionKey: {
    create: mock(),
    findFirst: mock(),
    findMany: mock(),
    update: mock(),
    delete: mock(),
    deleteMany: mock(),
    count: mock(),
  },
  workspaceSession: {
    create: mock(),
    findUnique: mock(),
    findMany: mock(),
    update: mock(),
    delete: mock(),
    deleteMany: mock(),
    count: mock(),
  },
  $transaction: mock(),
  sessionCheckpoint: {
    create: mock(),
    findUnique: mock(),
    findMany: mock(),
    update: mock(),
    delete: mock(),
    deleteMany: mock(),
    count: mock(),
    aggregate: mock(),
  },
  sessionMetadata: {
    findMany: mock(),
    update: mock(),
    create: mock(),
    upsert: mock(),
    findUnique: mock(),
  },
  user: {
    create: mock(),
    findUnique: mock(),
    findMany: mock(),
    update: mock(),
    delete: mock(),
    deleteMany: mock(),
  },
  workspace: {
    create: mock(),
    findUnique: mock(),
    findMany: mock(),
    update: mock(),
    delete: mock(),
    deleteMany: mock(),
  },
  $disconnect: mock(),
  $connect: mock(),
});

// Default mock instance
export const mockPrisma = createMockPrisma();

// Helper to clear all mocks
export const clearAllMocks = (prismaMock = mockPrisma) => {
  const clearMockGroup = (group: any) => {
    if (group && typeof group === 'object') {
      Object.values(group).forEach((method: any) => {
        if (method && typeof method.mockClear === 'function') {
          method.mockClear();
        }
      });
    }
  };

  Object.values(prismaMock).forEach(clearMockGroup);
};

// Helper to reset all mocks
export const resetAllMocks = (prismaMock = mockPrisma) => {
  const resetMockGroup = (group: any) => {
    if (group && typeof group === 'object') {
      Object.values(group).forEach((method: any) => {
        if (method && typeof method.mockReset === 'function') {
          method.mockReset();
        }
      });
    }
  };

  Object.values(prismaMock).forEach(resetMockGroup);
};

// Setup global mock for prisma module
export const setupPrismaMock = () => {
  globalThis.prisma = mockPrisma;

  // Create a MockPrismaClient class that returns our mock
  class MockPrismaClient {
    constructor() {
      return mockPrisma;
    }
  }

  // Store original PrismaClient if it exists
  const originalPrismaClient = globalThis.PrismaClient;

  // Set our mock as the global PrismaClient
  globalThis.PrismaClient = MockPrismaClient;
};

// Cleanup global mock
export const cleanupPrismaMock = () => {
  if (typeof globalThis.prisma !== 'undefined') {
    delete globalThis.prisma;
  }
  if (typeof globalThis.PrismaClient !== 'undefined') {
    delete globalThis.PrismaClient;
  }
};