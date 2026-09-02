import type { StorefrontSettings } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export const DEFAULT_LEGACY_SITE_URL = 'https://old.ideadiluce.it'

export type StorefrontSettingsDTO = {
  soundsEnabled: boolean
  legacySiteNoticeEnabled: boolean
  legacySiteUrl: string
}

export function normalizeLegacySiteUrl(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return DEFAULT_LEGACY_SITE_URL
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' || !url.hostname) return DEFAULT_LEGACY_SITE_URL
    return url.toString()
  } catch {
    return DEFAULT_LEGACY_SITE_URL
  }
}

export function mapStorefrontSettings(row: StorefrontSettings): StorefrontSettingsDTO {
  return {
    soundsEnabled: row.soundsEnabled,
    legacySiteNoticeEnabled: row.legacySiteNoticeEnabled,
    legacySiteUrl: normalizeLegacySiteUrl(row.legacySiteUrl),
  }
}

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  const existing = await prisma.storefrontSettings.findUnique({ where: { id: 'default' } })
  if (existing) return existing

  return prisma.storefrontSettings.create({
    data: {
      id: 'default',
      soundsEnabled: true,
      legacySiteNoticeEnabled: false,
      legacySiteUrl: DEFAULT_LEGACY_SITE_URL,
    },
  })
}

export async function getStorefrontSettingsDTO(): Promise<StorefrontSettingsDTO> {
  return mapStorefrontSettings(await getStorefrontSettings())
}

export async function patchStorefrontSettings(
  input: Partial<StorefrontSettingsDTO>,
): Promise<StorefrontSettingsDTO> {
  await getStorefrontSettings()
  const data: {
    soundsEnabled?: boolean
    legacySiteNoticeEnabled?: boolean
    legacySiteUrl?: string
  } = {}
  if (input.soundsEnabled !== undefined) data.soundsEnabled = input.soundsEnabled
  if (input.legacySiteNoticeEnabled !== undefined) {
    data.legacySiteNoticeEnabled = input.legacySiteNoticeEnabled
  }
  if (input.legacySiteUrl !== undefined) {
    data.legacySiteUrl = normalizeLegacySiteUrl(input.legacySiteUrl)
  }

  if (Object.keys(data).length === 0) {
    return getStorefrontSettingsDTO()
  }

  const row = await prisma.storefrontSettings.update({
    where: { id: 'default' },
    data,
  })
  return mapStorefrontSettings(row)
}
