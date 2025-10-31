/**
 * Prisma helper types to avoid complex type conflicts
 */

// Simple interface for Prisma operations
interface SafePrismaClient {
  user: {
    create: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
  userProfile: {
    update: (args: any) => Promise<any>;
  };
  workspace: {
    create: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any>;
  };
  session: {
    create: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
}

// Helper to cast Prisma client safely
export const createSafePrisma = (prisma: unknown): SafePrismaClient => prisma as SafePrismaClient;
