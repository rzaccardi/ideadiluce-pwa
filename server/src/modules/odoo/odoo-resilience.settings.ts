import type { OdooResilienceSettings } from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import type { OdooResilienceSettingsDTO } from '../../types/odoo.dto.js'

export const DEFAULT_ODOO_RESILIENCE: Omit<
  OdooResilienceSettingsDTO,
  'updatedAt' | 'updatedByEmail' | 'envEmergencyOverride' | 'smtpConfigured'
> = {
  emergencyMode: false,
  catalogCacheFallback: true,
  smtpFallback: true,
  note: null,
}

const CACHE_TTL_MS = 5_000
let cache: { at: number; row: OdooResilienceSettings } | null = null

function invalidateCache() {
  cache = null
}

export function mapOdooResilienceSettings(row: OdooResilienceSettings): OdooResilienceSettingsDTO {
  return {
    emergencyMode: row.emergencyMode,
    catalogCacheFallback: row.catalogCacheFallback,
    smtpFallback: row.smtpFallback,
    note: row.note,
    updatedAt: row.updatedAt.toISOString(),
    updatedByEmail: row.updatedByEmail,
    envEmergencyOverride: env.ODOO_EMERGENCY_MODE,
    smtpConfigured: Boolean(env.SMTP_ENABLED && env.SMTP_HOST),
  }
}

export async function getOdooResilienceSettings(): Promise<OdooResilienceSettings> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.row

  const existing = await prisma.odooResilienceSettings.findUnique({ where: { id: 'default' } })
  const row =
    existing ??
    (await prisma.odooResilienceSettings.create({
      data: { id: 'default', ...DEFAULT_ODOO_RESILIENCE },
    }))
  cache = { at: Date.now(), row }
  return row
}

export async function getOdooResilienceSettingsDTO(): Promise<OdooResilienceSettingsDTO> {
  return mapOdooResilienceSettings(await getOdooResilienceSettings())
}

export async function patchOdooResilienceSettings(
  input: Partial<Pick<OdooResilienceSettingsDTO, 'emergencyMode' | 'catalogCacheFallback' | 'smtpFallback' | 'note'>>,
  updatedByEmail?: string | null,
): Promise<OdooResilienceSettingsDTO> {
  await getOdooResilienceSettings()
  const data: {
    emergencyMode?: boolean
    catalogCacheFallback?: boolean
    smtpFallback?: boolean
    note?: string | null
    updatedByEmail?: string | null
  } = {}
  if (input.emergencyMode !== undefined) data.emergencyMode = input.emergencyMode
  if (input.catalogCacheFallback !== undefined) data.catalogCacheFallback = input.catalogCacheFallback
  if (input.smtpFallback !== undefined) data.smtpFallback = input.smtpFallback
  if (input.note !== undefined) data.note = input.note?.trim() || null
  if (updatedByEmail !== undefined) data.updatedByEmail = updatedByEmail

  if (Object.keys(data).length === 0) {
    return getOdooResilienceSettingsDTO()
  }

  const row = await prisma.odooResilienceSettings.update({
    where: { id: 'default' },
    data,
  })
  invalidateCache()
  cache = { at: Date.now(), row }
  return mapOdooResilienceSettings(row)
}

/** Kill switch admin o override env: non chiamare Odoo sul critical path. */
export async function isEmergencyMode(): Promise<boolean> {
  if (env.ODOO_EMERGENCY_MODE) return true
  try {
    const row = await getOdooResilienceSettings()
    return row.emergencyMode
  } catch {
    return env.ODOO_EMERGENCY_MODE
  }
}

export async function isCatalogCacheFallbackEnabled(): Promise<boolean> {
  if (await isEmergencyMode()) return true
  try {
    return (await getOdooResilienceSettings()).catalogCacheFallback
  } catch {
    return true
  }
}

export async function isSmtpFallbackEnabled(): Promise<boolean> {
  if (await isEmergencyMode()) return true
  try {
    return (await getOdooResilienceSettings()).smtpFallback
  } catch {
    return true
  }
}
