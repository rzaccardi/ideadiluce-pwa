import { prisma } from '../../lib/prisma.js'
import type { ViesCheckResult } from './vies.client.js'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export type CachedViesResult = {
  fromCache: true
  valid: boolean
  name: string | null
  address: string | null
  requestDate: string | null
}

export const vatCacheRepository = {
  async get(countryCode: string, vatNumber: string): Promise<CachedViesResult | null> {
    const row = await prisma.vatValidationCache.findUnique({
      where: { countryCode_vatNumber: { countryCode, vatNumber } },
    })
    if (!row || row.expiresAt <= new Date()) return null
    return {
      fromCache: true,
      valid: row.valid,
      name: row.name,
      address: row.address,
      requestDate: row.requestDate,
    }
  },

  async set(countryCode: string, vatNumber: string, result: ViesCheckResult): Promise<void> {
    if (result.valid === null) return
    const now = new Date()
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS)
    await prisma.vatValidationCache.upsert({
      where: { countryCode_vatNumber: { countryCode, vatNumber } },
      create: {
        countryCode,
        vatNumber,
        valid: result.valid,
        name: result.name ?? null,
        address: result.address ?? null,
        requestDate: result.requestDate ?? null,
        checkedAt: now,
        expiresAt,
      },
      update: {
        valid: result.valid,
        name: result.name ?? null,
        address: result.address ?? null,
        requestDate: result.requestDate ?? null,
        checkedAt: now,
        expiresAt,
      },
    })
  },
}
