import type { MerchantCenterSettings } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export type MerchantCenterSettingsDTO = {
  enabled: boolean
  includeOutOfStock: boolean
  expandVariants: boolean
  googleProductCategory: string
  shippingCountry: string
  shippingPriceCents: number | null
  brandFallback: string
}

export const DEFAULT_MERCHANT_CENTER_SETTINGS: MerchantCenterSettingsDTO = {
  enabled: true,
  includeOutOfStock: true,
  expandVariants: false,
  googleProductCategory: '594',
  shippingCountry: 'IT',
  shippingPriceCents: null,
  brandFallback: 'Idea di Luce',
}

export function mapMerchantCenterSettings(row: MerchantCenterSettings): MerchantCenterSettingsDTO {
  return {
    enabled: row.enabled,
    includeOutOfStock: row.includeOutOfStock,
    expandVariants: row.expandVariants,
    googleProductCategory: row.googleProductCategory.trim(),
    shippingCountry: row.shippingCountry.trim().toUpperCase() || 'IT',
    shippingPriceCents: row.shippingPriceCents,
    brandFallback: row.brandFallback.trim() || DEFAULT_MERCHANT_CENTER_SETTINGS.brandFallback,
  }
}

export async function getMerchantCenterSettings(): Promise<MerchantCenterSettings> {
  const existing = await prisma.merchantCenterSettings.findUnique({ where: { id: 'default' } })
  if (existing) return existing

  return prisma.merchantCenterSettings.create({
    data: {
      id: 'default',
      ...DEFAULT_MERCHANT_CENTER_SETTINGS,
    },
  })
}

export async function getMerchantCenterSettingsDTO(): Promise<MerchantCenterSettingsDTO> {
  return mapMerchantCenterSettings(await getMerchantCenterSettings())
}

export async function patchMerchantCenterSettings(
  input: Partial<MerchantCenterSettingsDTO>,
): Promise<MerchantCenterSettingsDTO> {
  await getMerchantCenterSettings()
  const data: Partial<MerchantCenterSettingsDTO> = {}
  if (input.enabled !== undefined) data.enabled = input.enabled
  if (input.includeOutOfStock !== undefined) data.includeOutOfStock = input.includeOutOfStock
  if (input.expandVariants !== undefined) data.expandVariants = input.expandVariants
  if (input.googleProductCategory !== undefined) {
    data.googleProductCategory = input.googleProductCategory.trim()
  }
  if (input.shippingCountry !== undefined) {
    data.shippingCountry = input.shippingCountry.trim().toUpperCase()
  }
  if (input.shippingPriceCents !== undefined) data.shippingPriceCents = input.shippingPriceCents
  if (input.brandFallback !== undefined) {
    data.brandFallback = input.brandFallback.trim() || DEFAULT_MERCHANT_CENTER_SETTINGS.brandFallback
  }

  if (Object.keys(data).length === 0) {
    return getMerchantCenterSettingsDTO()
  }

  const row = await prisma.merchantCenterSettings.update({
    where: { id: 'default' },
    data,
  })
  return mapMerchantCenterSettings(row)
}
