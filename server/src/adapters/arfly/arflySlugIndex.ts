import { fetchArflyProductList } from './arflyClient.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import { parseOdooTemplateId } from '../../modules/catalog/odooRef.js'

type SlugCacheEntry = { id: number; expiresAt: number }

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

/** Risolve slug → id Arfly senza passare dal proxy lista (evita N+1 spec_tags). */
export async function findArflyProductIdBySlug(
  slug: string,
  locale: HubLocale,
  options?: { partnerId?: number; pricelistId?: number },
): Promise<number | null> {
  const trimmed = slug.trim()
  if (!trimmed) return null

  const direct = parseOdooTemplateId(trimmed)
  if (direct != null) return direct

  const cached = readCachedId(locale, trimmed)
  if (cached != null) return cached

  let page = 1
  while (page <= 20) {
    const list = await fetchArflyProductList({
      locale,
      page,
      perPage: 100,
      partnerId: options?.partnerId,
      pricelistId: options?.pricelistId,
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
