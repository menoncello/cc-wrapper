import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client with logging for development
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
  return client;
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

export default prisma;
