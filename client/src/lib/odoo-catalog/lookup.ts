import { api } from '@/api/endpoints'
import { mapOdooCatalogListItem } from '@/lib/odoo-catalog/mapper'
import { getCatalogPricingOptions } from '@/lib/catalog-pricing'
import type { PwaLocale } from '@/lib/locale'
import { parseLocaleParam } from '@/lib/locale'
import type { ProductCardDTO } from '@/types/dto'

function parseProductRefToId(ref: string): number | null {
  const trimmed = ref.trim()
  if (/^\d+$/.test(trimmed)) {
    const id = Number(trimmed)
    return Number.isInteger(id) && id > 0 ? id : null
  }
  const tpl = /^tpl-(\d+)$/i.exec(trimmed)
  if (tpl) {
    const id = Number(tpl[1])
    return Number.isInteger(id) && id > 0 ? id : null
  }
  const legacy = /-(\d+)$/.exec(trimmed) ?? /^p-(\d+)$/i.exec(trimmed)
  if (!legacy) return null
  const id = Number(legacy[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export function toPwaLocale(value: string | undefined): PwaLocale {
  return parseLocaleParam(value)
}

export async function findOdooCatalogProductIdBySlug(
  slug: string,
  locale: PwaLocale = 'IT',
  pricing: { partnerId?: number; pricelistId?: number } = {},
): Promise<number | null> {
  const direct = parseProductRefToId(slug)
  if (direct != null) return direct

  let page = 1
  while (page <= 20) {
    const list = await api.odooCatalog.products({ locale, page, pageSize: 100, ...pricing })
    const hit = list.items.find((item) => item.slug === slug)
    if (hit) return hit.id
    if (page >= list.total_pages) break
    page += 1
  }
  return null
}

export async function resolveOdooCatalogProductCard(
  productRef: string,
  locale: PwaLocale = 'IT',
  pricing: { partnerId?: number; pricelistId?: number } = getCatalogPricingOptions(),
): Promise<ProductCardDTO | null> {
  const productId = await findOdooCatalogProductIdBySlug(productRef, locale, pricing)
  if (productId == null) return null
  const res = await api.odooCatalog.product(productId, locale, pricing)
  return mapOdooCatalogListItem(res.product, locale)
}
