import type { SocialProofSettings } from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'

export type SocialProofSettingsDTO = {
  enabled: boolean
  minQuantity: number
  lookbackDays: number
  maxEvents: number
  odooImportEnabled: boolean
  odooLastSyncAt: string | null
  odooLastSyncCount: number | null
  odooLastSyncError: string | null
}

export function mapSettingsRow(row: SocialProofSettings): SocialProofSettingsDTO {
  return {
    enabled: row.enabled,
    minQuantity: row.minQuantity,
    lookbackDays: row.lookbackDays,
    maxEvents: row.maxEvents,
    odooImportEnabled: row.odooImportEnabled,
    odooLastSyncAt: row.odooLastSyncAt?.toISOString() ?? null,
    odooLastSyncCount: row.odooLastSyncCount,
    odooLastSyncError: row.odooLastSyncError,
  }
}

export async function getSocialProofSettings(): Promise<SocialProofSettings> {
  const existing = await prisma.socialProofSettings.findUnique({ where: { id: 'default' } })
  if (existing) return existing

  return prisma.socialProofSettings.create({
    data: {
      id: 'default',
      enabled: env.SOCIAL_PROOF_ENABLED,
      minQuantity: 1,
      lookbackDays: env.SOCIAL_PROOF_LOOKBACK_DAYS,
      maxEvents: env.SOCIAL_PROOF_MAX_EVENTS,
      odooImportEnabled: false,
    },
  })
}

export async function getSocialProofSettingsDTO(): Promise<SocialProofSettingsDTO> {
  return mapSettingsRow(await getSocialProofSettings())
}
