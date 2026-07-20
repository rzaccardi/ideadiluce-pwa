import { env } from '../../config/env.js'
import {
  absoluteUrl,
  ambienteRoomPath,
  ambientiIndexPath,
  blogIndexPath,
  brandPath,
  brandsIndexPath,
  catalogPath,
  categoryPath,
  guideArticlePath,
  homePath,
  HREFLANG_CODE,
  HUB_LOCALES,
  productPath,
  staticContentPath,
  type HubLocale,
} from '../../lib/hub-locale.js'
import { catalogStorefrontService } from '../catalog/catalog-storefront.service.js'
import { listOdooCatalogProductSlugs } from '../catalog/catalogResolver.service.js'
import { STATIC_SITEMAP_PATHS } from './seo-sitemap.constants.js'
import { listAmbienteRoomSlugs, listIndexedGuideSlugs } from './seo-guide-slugs.js'
import {
  isPathInWordpressIndex,
  listWordpressIndexedBrandSlugs,
  listWordpressIndexedProductSlugs,
  listWordpressSitemapPaths,
  normalizeSitemapPathKey,
} from './wordpress-sitemap-paths.js'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

type SitemapEntry = {
  loc: string
  alternates: Array<{ hreflang: string; href: string }>
}

function urlEntry(e: SitemapEntry): string {
  const alt = e.alternates
    .map(
      (a) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(a.hreflang)}" href="${escapeXml(a.href)}" />`,
    )
    .join('\n')
  return `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n${alt ? `${alt}\n` : ''}  </url>`
}

function localizedPaths(paths: Record<HubLocale, string>): Record<HubLocale, string> {
  return paths
}

function pathsForSlug(
  slug: string,
  pathFn: (slug: string, locale: HubLocale) => string,
): Record<HubLocale, string> {
  return localizedPaths(
    Object.fromEntries(HUB_LOCALES.map((l) => [l, pathFn(slug, l)])) as Record<HubLocale, string>,
  )
}

function pathsForStatic(pathFn: (locale: HubLocale) => string): Record<HubLocale, string> {
  return localizedPaths(
    Object.fromEntries(HUB_LOCALES.map((l) => [l, pathFn(l)])) as Record<HubLocale, string>,
  )
}

function italianAlternates(siteBase: string, path: string): SitemapEntry['alternates'] {
  const href = absoluteUrl(siteBase, path)
  return [
    { hreflang: 'it', href },
    { hreflang: 'x-default', href },
  ]
}

function pushItalianPath(
  seen: Set<string>,
  entries: SitemapEntry[],
  siteBase: string,
  path: string,
) {
  const key = normalizeSitemapPathKey(path)
  if (seen.has(key)) return
  seen.add(key)
  entries.push({
    loc: absoluteUrl(siteBase, path),
    alternates: italianAlternates(siteBase, path),
  })
}

function pushLocalizedGroup(
  seen: Set<string>,
  entries: SitemapEntry[],
  siteBase: string,
  paths: Record<HubLocale, string>,
) {
  const itKey = normalizeSitemapPathKey(paths.IT)
  if (seen.has(itKey)) return
  seen.add(itKey)

  for (const loc of HUB_LOCALES) {
    const alternates = HUB_LOCALES.map((altLoc) => ({
      hreflang: HREFLANG_CODE[altLoc],
      href: absoluteUrl(siteBase, paths[altLoc]),
    }))
    alternates.push({ hreflang: 'x-default', href: absoluteUrl(siteBase, paths.IT) })
    entries.push({
      loc: absoluteUrl(siteBase, paths[loc]),
      alternates,
    })
  }
}

export async function buildProductSitemapXml(): Promise<string> {
  const siteBase = env.PUBLIC_SITE_URL
  const [productSlugs, categories, brands, guideSlugs] = await Promise.all([
    listOdooCatalogProductSlugs('IT'),
    catalogStorefrontService.listCategories('IT'),
    catalogStorefrontService.listBrands('IT'),
    listIndexedGuideSlugs(),
  ])
  const roomSlugs = listAmbienteRoomSlugs()
  const wpProductSlugs = listWordpressIndexedProductSlugs()
  const wpBrandSlugs = listWordpressIndexedBrandSlugs()

  const seen = new Set<string>()
  const entries: SitemapEntry[] = []

  // 1. Base completa: tutti gli URL WordPress indicizzati (1180+)
  for (const path of listWordpressSitemapPaths()) {
    pushItalianPath(seen, entries, siteBase, path)
  }

  // 2. Hub PWA non presenti nell'export WordPress (multilingua)
  pushLocalizedGroup(seen, entries, siteBase, pathsForStatic(homePath))
  pushLocalizedGroup(seen, entries, siteBase, pathsForStatic(catalogPath))
  pushLocalizedGroup(seen, entries, siteBase, pathsForStatic(brandsIndexPath))
  pushLocalizedGroup(seen, entries, siteBase, pathsForStatic(blogIndexPath))
  pushLocalizedGroup(seen, entries, siteBase, pathsForStatic(ambientiIndexPath))

  for (const staticPath of STATIC_SITEMAP_PATHS) {
    if (isPathInWordpressIndex(staticPath)) continue
    pushLocalizedGroup(
      seen,
      entries,
      siteBase,
      pathsForStatic((locale) => staticContentPath(staticPath, locale)),
    )
  }

  // 3. Guide editoriali PWA (nuovi URL /guide/...)
  for (const guideSlug of guideSlugs) {
    pushLocalizedGroup(seen, entries, siteBase, pathsForSlug(guideSlug, guideArticlePath))
  }

  // 4. Ambienti PWA (/ambienti/{room})
  for (const room of roomSlugs) {
    pushLocalizedGroup(seen, entries, siteBase, pathsForSlug(room, ambienteRoomPath))
  }

  // 5. Prodotti Odoo aggiunti dopo il cutover (non in sitemap WP)
  for (const slug of productSlugs) {
    if (wpProductSlugs.has(slug)) continue
    pushLocalizedGroup(seen, entries, siteBase, pathsForSlug(slug, productPath))
  }

  // 6. Categorie catalogo PWA (/categoria/{slug}) — link interni nuovi
  for (const category of categories) {
    if (!category.slug) continue
    pushLocalizedGroup(seen, entries, siteBase, pathsForSlug(category.slug, categoryPath))
  }

  // 7. Brand Odoo non presenti nell'export WordPress
  for (const brand of brands) {
    if (!brand.slug || wpBrandSlugs.has(brand.slug)) continue
    pushLocalizedGroup(seen, entries, siteBase, pathsForSlug(brand.slug, brandPath))
  }

  const body = entries.map(urlEntry).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>`
}

/** Conteggio URL unici IT (per admin/status). */
export function countUniqueItalianSitemapUrls(entries: SitemapEntry[]): number {
  const keys = new Set<string>()
  for (const entry of entries) {
    const itAlt = entry.alternates.find((a) => a.hreflang === 'it')?.href ?? entry.loc
    try {
      keys.add(normalizeSitemapPathKey(new URL(itAlt).pathname))
    } catch {
      keys.add(normalizeSitemapPathKey(itAlt))
    }
  }
  return keys.size
}
