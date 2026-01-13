/**
 * Database Service
 * Handles all database operations using Prisma ORM
 */

import { PrismaClient } from '../generated/prisma';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

