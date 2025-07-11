import { PrismaClient } from '@prisma/client';

// Avoid multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Create or use existing Prisma Client instance
const prisma = global.prisma || new PrismaClient();

// Save Prisma Client to global in non-production environments
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma };
