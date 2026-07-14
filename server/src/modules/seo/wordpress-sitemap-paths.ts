import { WORDPRESS_INDEXED_PATHS } from './wordpress-indexed-paths.js'

/** URL non indicizzabili o obsolete — esclusi dalla sitemap. */
export const WORDPRESS_SITEMAP_EXCLUDED_PATHS = new Set([
  '/et_tb_item_type/template',
])

export function normalizeSitemapPathKey(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const withoutTrailing = withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash
  return withoutTrailing.toLowerCase()
}

/** Tutti gli URL WordPress da Yoast ancora validi per la sitemap. */
export function listWordpressSitemapPaths(): string[] {
  return WORDPRESS_INDEXED_PATHS.filter((path) => !WORDPRESS_SITEMAP_EXCLUDED_PATHS.has(path))
}

export function extractProductSlugFromPath(path: string): string | null {
  const normalized = normalizeSitemapPathKey(path)
  const match = normalized.match(/^\/prodotto\/([^/]+)$/)
  return match?.[1] ?? null
}

/** Slug prodotto già presenti nella sitemap WordPress indicizzata. */
export function listWordpressIndexedProductSlugs(): Set<string> {
  const slugs = new Set<string>()
  for (const path of listWordpressSitemapPaths()) {
    const slug = extractProductSlugFromPath(path)
    if (slug) slugs.add(slug)
  }
  return slugs
}

export function extractBrandSlugFromPath(path: string): string | null {
  const normalized = normalizeSitemapPathKey(path)
  const match = normalized.match(/^\/brand\/([^/]+)$/)
  return match?.[1] ?? null
}

export function listWordpressIndexedBrandSlugs(): Set<string> {
  const slugs = new Set<string>()
  for (const path of listWordpressSitemapPaths()) {
    const slug = extractBrandSlugFromPath(path)
    if (slug) slugs.add(slug)
  }
  return slugs
}

export function isPathInWordpressIndex(path: string): boolean {
  const key = normalizeSitemapPathKey(path)
  return listWordpressSitemapPaths().some((p) => normalizeSitemapPathKey(p) === key)
}
