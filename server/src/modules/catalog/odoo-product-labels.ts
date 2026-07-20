import {
  fetchOdooCatalogProductDetail,
  isOdooCatalogConfigured,
} from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { findOdooCatalogProductIdBySlug } from '../../adapters/odoo-catalog/odooCatalogSlugIndex.js'
import { env } from '../../config/env.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import { parseOdooTemplateId } from './odooRef.js'

function mediaUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = env.ODOO_CATALOG_BASE_URL?.trim().replace(/\/$/, '')
  return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path
}

export type OdooCatalogProductLabel = {
  slug: string
  name: string
  imageUrl: string | null
}

async function labelFromOdooCatalogId(
  id: number,
  locale: HubLocale,
  refKey: string,
  map: Map<string, OdooCatalogProductLabel>,
) {
  try {
    const res = await fetchOdooCatalogProductDetail(id, locale)
    const product = res.product
    map.set(refKey, {
      slug: product.slug,
      name: product.title,
      imageUrl: mediaUrl(product.image?.url),
    })
  } catch {
    /* prodotto non trovato su OdooCatalog */
  }
}

/** Risolve slug/nome da Odoo (via API catalogo) per righe ordine/carrello admin. */
export async function resolveOdooCatalogProductLabels(
  refs: string[],
  locale: HubLocale = 'IT',
): Promise<Map<string, OdooCatalogProductLabel>> {
  const map = new Map<string, OdooCatalogProductLabel>()
  const unique = [...new Set(refs.filter(Boolean))]
  if (unique.length === 0 || !isOdooCatalogConfigured()) return map

  const slugRefs: string[] = []
  const templateIds: number[] = []

  for (const ref of unique) {
    const tid = parseOdooTemplateId(ref)
    if (tid != null) templateIds.push(tid)
    else slugRefs.push(ref)
  }

  await Promise.all([
    ...templateIds.map((id) => labelFromOdooCatalogId(id, locale, String(id), map)),
    ...slugRefs.map(async (slug) => {
      const id = await findOdooCatalogProductIdBySlug(slug, locale)
      if (id != null) await labelFromOdooCatalogId(id, locale, slug, map)
    }),
  ])

  return map
}
