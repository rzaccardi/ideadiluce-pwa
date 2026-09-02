import type { StorefrontSettings } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export type StorefrontSettingsDTO = {
  soundsEnabled: boolean
}

export function mapStorefrontSettings(row: StorefrontSettings): StorefrontSettingsDTO {
  return {
    soundsEnabled: row.soundsEnabled,
  }
}

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  const existing = await prisma.storefrontSettings.findUnique({ where: { id: 'default' } })
  if (existing) return existing

  return prisma.storefrontSettings.create({
    data: {
      id: 'default',
      soundsEnabled: true,
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
  const data: { soundsEnabled?: boolean } = {}
  if (input.soundsEnabled !== undefined) data.soundsEnabled = input.soundsEnabled

  if (Object.keys(data).length === 0) {
    return getStorefrontSettingsDTO()
  }

  const row = await prisma.storefrontSettings.update({
    where: { id: 'default' },
    data,
  })
  return mapStorefrontSettings(row)
}
