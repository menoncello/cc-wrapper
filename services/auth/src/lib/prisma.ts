import { PrismaClient } from '@prisma/client';

/**
 * Initialize Prisma Client with logging configuration
 * @returns {PrismaClient} Configured Prisma client instance
 */
const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
};

// Type augmentation for global scope without using var
interface GlobalPrisma {
  prismaGlobal?: PrismaClient;
}

declare const globalThis: GlobalPrisma & typeof global;

const prisma: PrismaClient = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

/**
 * Prisma client instance for database operations
 */
export { prisma };
