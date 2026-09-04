import { env } from '../../config/env.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { mapOdooCatalogListItem } from '../../adapters/odoo-catalog/odooCatalogMapper.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import type { ProductDetailDTO, ProductRelatedDTO } from '../../types/dto.js'
import { getCachedProductDetailById } from './odoo-catalog-index.service.js'

export const ACCESSORY_ENRICH_LIMIT = 8

const ACCESSORY_ID_FIELDS = ['optional_product_ids', 'accessory_product_ids'] as const

type AccessoryIdRow = {
  id: number
  accessory_product_ids?: number[]
  optional_product_ids?: number[]
}

function uniquePositiveIds(ids: Iterable<number>, excludeId?: number | null): number[] {
  const seen = new Set<number>()
  for (const id of ids) {
    if (!Number.isInteger(id) || id <= 0) continue
    if (excludeId != null && id === excludeId) continue
    seen.add(id)
  }
  return [...seen]
}

function templateIdFromImageUrl(url: string | null | undefined): number | null {
  if (!url) return null
  const match = /\/product\.template\/(\d+)\//.exec(url)
  if (!match) return null
  const id = Number(match[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

function patchRelatedTemplateId(item: ProductRelatedDTO): ProductRelatedDTO {
  if (item.odooTemplateId != null && item.odooTemplateId > 0) return item
  const fromImage = templateIdFromImageUrl(item.imageUrl)
  if (fromImage == null) return item
  return { ...item, odooTemplateId: fromImage }
}

async function readOdooAccessoryTemplateIds(
  ctx: OdooCallContext,
  templateId: number,
): Promise<number[]> {
  try {
    const rows = await odooExecuteKw<AccessoryIdRow[]>(
      ctx,
      'product.template',
      'read',
      [[templateId]],
      { fields: [...ACCESSORY_ID_FIELDS] },
    )
    const row = rows[0]
    if (!row) return []
    return uniquePositiveIds(
      [...(row.optional_product_ids ?? []), ...(row.accessory_product_ids ?? [])],
      templateId,
    )
  } catch {
    const ids: number[] = []
    for (const field of ACCESSORY_ID_FIELDS) {
      try {
        const rows = await odooExecuteKw<AccessoryIdRow[]>(
          ctx,
          'product.template',
          'read',
          [[templateId]],
          { fields: [field] },
        )
        ids.push(...(rows[0]?.[field] ?? []))
      } catch {
        /* campo assente su questa istanza Odoo */
      }
    }
    return uniquePositiveIds(ids, templateId)
  }
}

/**
 * Se il catalogo v2 non porta accessori, li legge da Odoo
 * `optional_product_ids` + `accessory_product_ids` e li risolve via API catalogo (slug/prezzi reali).
 */
export async function enrichProductDetailWithAccessories(
  ctx: OdooCallContext,
  product: ProductDetailDTO,
): Promise<ProductDetailDTO> {
  const existing = (product.accessories ?? []).filter((item) => item.slug?.trim())
  if (existing.length > 0) {
    return { ...product, accessories: existing.map(patchRelatedTemplateId) }
  }

  if (!env.ODOO_ENABLED || !isOdooConfigured()) return product
  const templateId = product.odooTemplateId
  if (templateId == null || templateId <= 0) return product

  let ids: number[]
  try {
    ids = await readOdooAccessoryTemplateIds(ctx, templateId)
  } catch {
    return product
  }
  const limited = ids.slice(0, ACCESSORY_ENRICH_LIMIT)
  if (limited.length === 0) return product

  const locale = parseHubLocale(product.locale)
  const cards: ProductRelatedDTO[] = []
  for (const id of limited) {
    try {
      const res = await getCachedProductDetailById(locale, id)
      if (!res?.product?.slug?.trim()) continue
      cards.push({
        ...mapOdooCatalogListItem(res.product, locale),
        relation: 'accessory',
      })
    } catch {
      /* dettaglio assente o non pubblicato */
    }
  }

  if (cards.length === 0) return product
  return { ...product, accessories: cards }
}
