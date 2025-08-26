import { PrismaClient } from '@/generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with appropriate configuration
function createPrismaClient() {
  const client = new PrismaClient({
    // Connection pool settings for serverless
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Logging configuration
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })

  // Use Prisma Accelerate if configured
  if (process.env.DATABASE_PROXY_URL) {
    return client.$extends(withAccelerate())
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}