import { env } from '../../config/env.js'
import {
  absoluteUrl,
  ambienteRoomPath,
  ambientiIndexPath,
  brandPath,
  brandsIndexPath,
  catalogPath,
  categoryPath,
  guideArticlePath,
  guideIndexPath,
  HREFLANG_CODE,
  homePath,
  HUB_LOCALES,
  productPath,
  staticContentPath,
  type HubLocale,
} from '../../lib/hub-locale.js'
import { catalogStorefrontService } from '../catalog/catalog-storefront.service.js'
import { listArflyProductSlugs } from '../catalog/catalogResolver.service.js'
import {
  STATIC_SITEMAP_PATHS,
} from './seo-sitemap.constants.js'
import { listAmbienteRoomSlugs, listIndexedGuideSlugs } from './seo-guide-slugs.js'

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

function pushLocalizedGroup(entries: SitemapEntry[], siteBase: string, paths: Record<HubLocale, string>) {
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

export async function buildProductSitemapXml(): Promise<string> {
  const siteBase = env.PUBLIC_SITE_URL
  const [productSlugs, categories, brands, guideSlugs] = await Promise.all([
    listArflyProductSlugs('IT'),
    catalogStorefrontService.listCategories('IT'),
    catalogStorefrontService.listBrands('IT'),
    listIndexedGuideSlugs(),
  ])
  const roomSlugs = listAmbienteRoomSlugs()

  const entries: SitemapEntry[] = []

  pushLocalizedGroup(entries, siteBase, pathsForStatic(homePath))
  pushLocalizedGroup(entries, siteBase, pathsForStatic(catalogPath))
  pushLocalizedGroup(entries, siteBase, pathsForStatic(brandsIndexPath))
  pushLocalizedGroup(entries, siteBase, pathsForStatic(guideIndexPath))
  pushLocalizedGroup(entries, siteBase, pathsForStatic(ambientiIndexPath))

  for (const staticPath of STATIC_SITEMAP_PATHS) {
    pushLocalizedGroup(
      entries,
      siteBase,
      pathsForStatic((locale) => staticContentPath(staticPath, locale)),
    )
  }

  for (const guideSlug of guideSlugs) {
    pushLocalizedGroup(entries, siteBase, pathsForSlug(guideSlug, guideArticlePath))
  }

  for (const room of roomSlugs) {
    pushLocalizedGroup(entries, siteBase, pathsForSlug(room, ambienteRoomPath))
  }

  for (const slug of productSlugs) {
    pushLocalizedGroup(entries, siteBase, pathsForSlug(slug, productPath))
  }

  for (const category of categories) {
    if (!category.slug) continue
    pushLocalizedGroup(entries, siteBase, pathsForSlug(category.slug, categoryPath))
  }

  for (const brand of brands) {
    if (!brand.slug) continue
    pushLocalizedGroup(entries, siteBase, pathsForSlug(brand.slug, brandPath))
  }

  const body = entries.map(urlEntry).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>`
}
