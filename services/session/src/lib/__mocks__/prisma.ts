// Mock Prisma client for testing
import type { PrismaClient } from '@prisma/client';

export const createMockPrismaClient = (): PrismaClient => {
  const mockData = {
    workspaceSessions: new Map(),
    sessionMetadata: new Map(),
    sessionCheckpoints: new Map(),
    sessionConfigs: new Map()
  };

  return {
    workspaceSession: {
      create: async ({ data }: any) => {
        const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const session = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          checkpoints: []
        };
        mockData.workspaceSessions.set(id, session);
        return session;
      },

      findUnique: async ({ where }: any) => {
        return mockData.workspaceSessions.get(where.id) || null;
      },

      update: async ({ where, data }: any) => {
        const existing = mockData.workspaceSessions.get(where.id);
        if (!existing) return null;
        const updated = { ...existing, ...data, updatedAt: new Date() };
        mockData.workspaceSessions.set(where.id, updated);
        return updated;
      },

      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const [id, session] of mockData.workspaceSessions.entries()) {
          if (where.userId ? session.userId === where.userId : true) {
            if (where.isActive !== undefined ? session.isActive === where.isActive : true) {
              if (where.id ? (where.id.not ? id !== where.id.not : id === where.id) : true) {
                mockData.workspaceSessions.set(id, { ...session, ...data });
                count++;
              }
            }
          }
        }
        return { count };
      },

      delete: async ({ where }: any) => {
        const deleted = mockData.workspaceSessions.get(where.id);
        if (deleted) {
          mockData.workspaceSessions.delete(where.id);
        }
        return deleted || null;
      },

      deleteMany: async ({ where }: any) => {
        let count = 0;
        for (const [id, session] of mockData.workspaceSessions.entries()) {
          if (where.expiresAt ? session.expiresAt < where.expiresAt.lt : true) {
            mockData.workspaceSessions.delete(id);
            count++;
          }
        }
        return { count };
      },

      findMany: async ({ where, orderBy, skip, take }: any) => {
        let sessions = Array.from(mockData.workspaceSessions.values());

        if (where) {
          sessions = sessions.filter(session => {
            if (where.userId && session.userId !== where.userId) return false;
            if (where.workspaceId && session.workspaceId !== where.workspaceId) return false;
            if (where.isActive !== undefined && session.isActive !== where.isActive) return false;
            return true;
          });
        }

        if (orderBy) {
          sessions.sort((a, b) => {
            for (const [key, direction] of Object.entries(orderBy)) {
              if (a[key] < b[key]) return direction === 'desc' ? 1 : -1;
              if (a[key] > b[key]) return direction === 'desc' ? -1 : 1;
            }
            return 0;
          });
        }

        if (skip) sessions = sessions.slice(skip);
        if (take) sessions = sessions.slice(0, take);

        return sessions;
      },

      count: async ({ where }: any) => {
        let sessions = Array.from(mockData.workspaceSessions.values());
        if (where) {
          sessions = sessions.filter(session => {
            if (where.userId && session.userId !== where.userId) return false;
            if (where.workspaceId && session.workspaceId !== where.workspaceId) return false;
            if (where.isActive !== undefined && session.isActive !== where.isActive) return false;
            return true;
          });
        }
        return sessions.length;
      }
    },

    sessionMetadata: {
      create: async ({ data }: any) => {
        const id = `metadata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const metadata = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockData.sessionMetadata.set(id, metadata);
        return metadata;
      },

      update: async ({ where, data }: any) => {
        const existing = mockData.sessionMetadata.get(where.sessionId);
        if (!existing) return null;
        const updated = { ...existing, ...data };
        mockData.sessionMetadata.set(where.sessionId, updated);
        return updated;
      }
    },

    sessionCheckpoint: {
      create: async ({ data }: any) => {
        const id = `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const checkpoint = { id, ...data, createdAt: new Date() };
        mockData.sessionCheckpoints.set(id, checkpoint);
        return checkpoint;
      },

      findMany: async ({ where, orderBy }: any) => {
        let checkpoints = Array.from(mockData.sessionCheckpoints.values());

        if (where?.sessionId) {
          checkpoints = checkpoints.filter(cp => cp.sessionId === where.sessionId);
        }

        if (orderBy) {
          checkpoints.sort((a, b) => {
            for (const [key, direction] of Object.entries(orderBy)) {
              if (a[key] < b[key]) return direction === 'desc' ? 1 : -1;
              if (a[key] > b[key]) return direction === 'desc' ? -1 : 1;
            }
            return 0;
          });
        }

        return checkpoints;
      }
    },

    sessionConfig: {
      upsert: async ({ where, create, update }: any) => {
        const existing = mockData.sessionConfigs.get(where.userId);
        const config = existing ? { ...existing, ...update } : { ...create, userId: where.userId };
        mockData.sessionConfigs.set(where.userId, config);
        return config;
      }
    },

    $transaction: async (callback: any) => {
      // Create a transaction-like object with the same structure as the mock
      const tx = {
        workspaceSession: {
          create: async ({ data }: any) => {
            const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const session = {
              id,
              ...data,
              createdAt: new Date(),
              updatedAt: new Date(),
              checkpoints: []
            };
            mockData.workspaceSessions.set(id, session);
            return session;
          },

          update: async ({ where, data }: any) => {
            const existing = mockData.workspaceSessions.get(where.id);
            if (!existing) return null;
            const updated = { ...existing, ...data, updatedAt: new Date() };
            mockData.workspaceSessions.set(where.id, updated);
            return updated;
          }
        },

        sessionMetadata: {
          create: async ({ data }: any) => {
            const id = `metadata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const metadata = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
            mockData.sessionMetadata.set(id, metadata);
            return metadata;
          },

          update: async ({ where, data }: any) => {
            const existing = mockData.sessionMetadata.get(where.sessionId);
            if (!existing) return null;
            const updated = { ...existing, ...data };
            mockData.sessionMetadata.set(where.sessionId, updated);
            return updated;
          }
        },

        sessionConfig: {
          upsert: async ({ where, create, update }: any) => {
            const existing = mockData.sessionConfigs.get(where.userId);
            const config = existing ? { ...existing, ...update } : { ...create, userId: where.userId };
            mockData.sessionConfigs.set(where.userId, config);
            return config;
          }
        }
      };

      return await callback(tx);
    },

    $connect: async () => {},
    $disconnect: async () => {},

    // Method to reset all mock data between tests
    _resetData: () => {
      mockData.workspaceSessions.clear();
      mockData.sessionMetadata.clear();
      mockData.sessionCheckpoints.clear();
      mockData.sessionConfigs.clear();
    }
  } as PrismaClient & { _resetData: () => void };
};

// Setup mock for testing with clean state
export const setupTestPrismaMock = () => {
  // Create fresh mock client for each test
  const mockClient = createMockPrismaClient();
  (globalThis as any).prisma = mockClient;
  return mockClient;
};

// Reset mock data between tests (keeps same client instance)
export const resetTestPrismaMock = () => {
  const existingClient = (globalThis as any).prisma;
  if (existingClient && existingClient._resetData) {
    // Call the reset method if available
    existingClient._resetData();
  } else {
    // If no reset method, setup fresh mock
    setupTestPrismaMock();
  }
};

// Cleanup mock after tests
export const cleanupTestPrismaMock = () => {
  delete (globalThis as any).prisma;
};