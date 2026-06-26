import {
  fetchArflyProductDetail,
  isArflyConfigured,
} from '../../adapters/arfly/arflyClient.js'
import { findArflyProductIdBySlug } from '../../adapters/arfly/arflySlugIndex.js'
import { env } from '../../config/env.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import { parseOdooTemplateId } from './odooRef.js'

function mediaUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = env.ARFLY_API_BASE_URL?.trim().replace(/\/$/, '')
  return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path
}

export type ArflyProductLabel = {
  slug: string
  name: string
  imageUrl: string | null
}

async function labelFromArflyId(
  id: number,
  locale: HubLocale,
  refKey: string,
  map: Map<string, ArflyProductLabel>,
) {
  try {
    const res = await fetchArflyProductDetail(id, locale)
    const product = res.product
    map.set(refKey, {
      slug: product.slug,
      name: product.title,
      imageUrl: mediaUrl(product.image?.url),
    })
  } catch {
    /* prodotto non trovato su Arfly */
  }
}

/** Risolve slug/nome da Odoo (via Arfly) per righe ordine/carrello admin. */
export async function resolveArflyProductLabels(
  refs: string[],
  locale: HubLocale = 'IT',
): Promise<Map<string, ArflyProductLabel>> {
  const map = new Map<string, ArflyProductLabel>()
  const unique = [...new Set(refs.filter(Boolean))]
  if (unique.length === 0 || !isArflyConfigured()) return map

  const slugRefs: string[] = []
  const templateIds: number[] = []

  for (const ref of unique) {
    const tid = parseOdooTemplateId(ref)
    if (tid != null) templateIds.push(tid)
    else slugRefs.push(ref)
  }

  await Promise.all([
    ...templateIds.map((id) => labelFromArflyId(id, locale, String(id), map)),
    ...slugRefs.map(async (slug) => {
      const id = await findArflyProductIdBySlug(slug, locale)
      if (id != null) await labelFromArflyId(id, locale, slug, map)
    }),
  ])

  return map
}
