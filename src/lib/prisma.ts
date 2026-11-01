// Prisma is optional. The application uses resilient JSON database in data/local_db.json
let prismaClientInstance: any = null;

if (process.env.USE_PRISMA === 'true') {
  try {
    const { PrismaClient } = require('@prisma/client');
    prismaClientInstance = new PrismaClient({ log: ['query'] });
  } catch {
    prismaClientInstance = null;
  }
}

export const prisma = prismaClientInstance;