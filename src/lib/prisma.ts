import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

// In development, clear cache if models are missing to force fresh client
if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  const cachedClient = globalForPrisma.prisma as any
  if (!cachedClient.quiz || !cachedClient.courseMaterial) {
    // Old cached client missing new models, disconnect and clear
    cachedClient.$disconnect().catch(() => {})
    globalForPrisma.prisma = undefined
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
