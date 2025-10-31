import { PrismaClient } from '@prisma/client';

// Lazy initialization wrapper to handle module loading issues
let _prisma: PrismaClient | null = null;

const getPrismaClient = (): PrismaClient => {
  if (!_prisma) {
    try {
      _prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
      });
    } catch (error) {
      console.error('Failed to initialize Prisma client:', error);
      throw new Error('Prisma client initialization failed. Please run "prisma generate" and try again.');
    }
  }
  return _prisma;
};

// Type augmentation for global scope without using var
interface GlobalPrisma {
  prismaGlobal?: PrismaClient;
  prisma?: any; // Allow mock prisma in tests
}

declare const globalThis: GlobalPrisma & typeof global;

// Export a proxy that uses mock in test environment or real client otherwise
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    // Check for mock prisma first (in test environment)
    if (globalThis.prisma && typeof globalThis.prisma === 'object' && (globalThis.prisma as any).workspaceSession) {
      return (globalThis.prisma as any)[prop as keyof PrismaClient];
    }

    if (!_prisma) {
      _prisma = getPrismaClient();
      if (process.env.NODE_ENV !== 'production') {
        globalThis.prismaGlobal = _prisma;
      }
    }
    return _prisma[prop as keyof PrismaClient];
  }
});

export default prisma;