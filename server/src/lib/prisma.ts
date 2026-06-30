import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function databaseUrlWithDevPoolLimits(url: string): string {
  if (env.NODE_ENV === 'production') return url

  try {
    const parsed = new URL(url)
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', '3')
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '20')
    }
    return parsed.toString()
  } catch {
    return url
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrlWithDevPoolLimits(env.DATABASE_URL),
      },
    },
  })

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
