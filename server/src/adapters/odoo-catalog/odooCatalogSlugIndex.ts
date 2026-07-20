import { fetchOdooCatalogProductList, fetchOdooCatalogProductSearch } from './odooCatalogClient.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import { parseOdooTemplateId } from '../../modules/catalog/odooRef.js'

type SlugCacheEntry = { id: number; expiresAt: number }

/** Cache in-memory breve per slug→id (non è l’indice catalogo su disco). */
const SLUG_CACHE_TTL_MS = 5 * 60 * 1000
const slugToIdCache = new Map<string, SlugCacheEntry>()

function cacheKey(locale: HubLocale, slug: string): string {
  return `${locale}:${slug}`
}

function rememberSlug(locale: HubLocale, slug: string, id: number) {
  slugToIdCache.set(cacheKey(locale, slug), {
    id,
    expiresAt: Date.now() + SLUG_CACHE_TTL_MS,
  })
}

function readCachedId(locale: HubLocale, slug: string): number | null {
  const entry = slugToIdCache.get(cacheKey(locale, slug))
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    slugToIdCache.delete(cacheKey(locale, slug))
    return null
  }
  return entry.id
}

/**
 * Risolve slug → id prodotto via Odoo live (search, poi scan lista).
 * Non usa l’indice cache catalogo (riservato al typeahead).
 */
export async function findOdooCatalogProductIdBySlug(
  slug: string,
  locale: HubLocale,
  _options?: { partnerId?: number; pricelistId?: number },
): Promise<number | null> {
  const trimmed = slug.trim()
  if (!trimmed) return null

  const direct = parseOdooTemplateId(trimmed)
  if (direct != null) return direct

  const cached = readCachedId(locale, trimmed)
  if (cached != null) return cached

  try {
    const search = await fetchOdooCatalogProductSearch({
      locale,
      q: trimmed,
      page: 1,
      per_page: 20,
    })
    for (const item of search.items) {
      rememberSlug(locale, item.slug, item.id)
    }
    const hit = search.items.find((item) => item.slug === trimmed)
    if (hit) return hit.id
  } catch {
    // fallback scan lista sotto
  }

  let page = 1
  while (page <= 20) {
    const list = await fetchOdooCatalogProductList({
      locale,
      page,
      perPage: 100,
    })

    for (const item of list.items) {
      rememberSlug(locale, item.slug, item.id)
    }

    const hit = list.items.find((item) => item.slug === trimmed)
    if (hit) return hit.id
    if (page >= list.total_pages) break
    page += 1
  }

  return null
}
