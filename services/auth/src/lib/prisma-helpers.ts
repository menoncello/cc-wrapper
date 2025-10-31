/**
 * Prisma helper types to avoid complex type conflicts
 */

// Generic operation type for Prisma methods
type PrismaOperation<T = unknown> = (args: T) => Promise<unknown>;

// Simple interface for Prisma operations with proper typing
interface SafePrismaClient {
  user: {
    create: PrismaOperation;
    findUnique: PrismaOperation;
    findFirst: PrismaOperation;
    update: PrismaOperation;
  };
  userProfile: {
    update: PrismaOperation;
  };
  workspace: {
    create: PrismaOperation;
    findUnique: PrismaOperation;
    findMany: PrismaOperation;
  };
  session: {
    create: PrismaOperation;
    delete: PrismaOperation;
  };
}

// Helper to cast Prisma client safely
export const createSafePrisma = (prisma: unknown): SafePrismaClient => prisma as SafePrismaClient;
