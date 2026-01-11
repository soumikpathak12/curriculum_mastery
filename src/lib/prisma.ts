import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

// Version: 1.0.1 (Forces client reload after schema update)
if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  const cachedClient = globalForPrisma.prisma as any
  // Check if the client is missing the new models or if we need to force a refresh
  if (!cachedClient.courseMaterialFile || !cachedClient.quiz) {
    console.log('DEBUG: Old Prisma client detected, clearing cache...')
    cachedClient.$disconnect().catch(() => { })
    globalForPrisma.prisma = undefined
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
