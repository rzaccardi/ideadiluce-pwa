import { PrismaClient } from '../generated/hub-client/index.js'

const globalForPrisma = globalThis as unknown as { hubPrisma?: PrismaClient }

export const hubPrisma =
  globalForPrisma.hubPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.hubPrisma = hubPrisma
}
