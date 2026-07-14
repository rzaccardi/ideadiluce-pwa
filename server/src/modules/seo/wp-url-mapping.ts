/**
 * Mapping URL WordPress indicizzati → destinazioni PWA.
 * Le categorie /categoria-prodotto/... restano in-place (contenuto servito sulla stessa URL).
 */

export type WpUrlType =
  | 'home'
  | 'product'
  | 'product_category'
  | 'brand'
  | 'page'
  | 'post'
  | 'blog_category'
  | 'author'
  | 'shipping_class'
  | 'divi_template'
  | 'unknown'

export type WpUrlMapping = {
  fromPath: string
  toPath: string | null
  statusCode: 301
  reason: string
  /** Se true, il path WP resta servito in-place (nessun redirect). */
  serveInPlace: boolean
}

/** Pagine legacy WP = stesso path sulla PWA (nessun redirect). */
export const WP_LEGACY_PAGE_PATHS = new Set([
  '/',
  '/illuminazione-arredo',
  '/acquista-ambiente',
  '/privacy-policy',
  '/negozio',
  '/blog',
  '/tos',
  '/on-demand',
])

export function normalizeSeoPath(path: string): string {
  const trimmed = path.trim()
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return normalizeSeoPath(new URL(trimmed).pathname)
    } catch {
      return '/'
    }
  }
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash
}

export function classifyWpUrl(path: string): WpUrlType {
  const normalized = normalizeSeoPath(path)
  if (normalized === '/') return 'home'
  if (normalized.startsWith('/prodotto/')) return 'product'
  if (normalized.startsWith('/categoria-prodotto/')) return 'product_category'
  if (normalized.startsWith('/brand/')) return 'brand'
  if (/^\/\d{4}\/\d{2}\/\d{2}\//.test(normalized)) return 'post'
  if (normalized.startsWith('/category/')) return 'blog_category'
  if (normalized.startsWith('/author/')) return 'author'
  if (normalized.includes('taxonomy=product_shipping_class')) return 'shipping_class'
  if (normalized.startsWith('/et_tb_item_type/')) return 'divi_template'
  if (WP_LEGACY_PAGE_PATHS.has(normalized)) return 'page'
  return 'unknown'
}

/** Post WordPress → slug guida PWA (allineato a legacy-editorial-guides.content.ts). */
const WP_POST_GUIDE_MAP: Record<string, string> = {
  '/2024/06/26/luce-calda-o-fredda': '/guide/luce-calda-o-fredda',
  '/2024/06/04/calipso-artemide-io-vengo-dalla-luna': '/guide/calipso-artemide-io-vengo-dalla-luna',
  '/2024/06/25/la-natura-trend-2024': '/guide/la-natura-trend-2024',
}

/**
 * Risolve un path WordPress indicizzato.
 * Le categorie prodotto restano in-place; redirect solo per post blog, author, ecc.
 */
export function resolveWpIndexedPath(path: string): WpUrlMapping | null {
  const fromPath = normalizeSeoPath(path)
  const type = classifyWpUrl(fromPath)

  switch (type) {
    case 'home':
    case 'product':
    case 'brand':
    case 'product_category':
      return { fromPath, toPath: null, statusCode: 301, reason: 'URL indicizzato servito in-place', serveInPlace: true }

    case 'page':
      return { fromPath, toPath: null, statusCode: 301, reason: 'Pagina legacy stesso path', serveInPlace: true }

    case 'post': {
      const toPath = WP_POST_GUIDE_MAP[fromPath]
      if (!toPath) return null
      return {
        fromPath,
        toPath,
        statusCode: 301,
        reason: 'WordPress post → guida PWA',
        serveInPlace: false,
      }
    }

    case 'blog_category':
      return {
        fromPath,
        toPath: '/blog',
        statusCode: 301,
        reason: 'Categoria blog WP → indice blog PWA',
        serveInPlace: false,
      }

    case 'author':
      return {
        fromPath,
        toPath: '/blog',
        statusCode: 301,
        reason: 'Archivio autore WP → blog',
        serveInPlace: false,
      }

    case 'divi_template':
      return {
        fromPath,
        toPath: '/',
        statusCode: 301,
        reason: 'Template Divi obsoleto → home',
        serveInPlace: false,
      }

    case 'shipping_class':
      return null

    default:
      if (fromPath === '/sample-page') {
        return {
          fromPath,
          toPath: '/chi-siamo',
          statusCode: 301,
          reason: 'WordPress placeholder → chi siamo',
          serveInPlace: false,
        }
      }
      return null
  }
}

/** Redirect da applicare in SeoRedirect (esclude serveInPlace e path senza target). */
export function listWpIndexedRedirects(paths: string[]): WpUrlMapping[] {
  const seen = new Set<string>()
  const redirects: WpUrlMapping[] = []

  for (const raw of paths) {
    const mapping = resolveWpIndexedPath(raw)
    if (!mapping || mapping.serveInPlace || !mapping.toPath) continue
    if (seen.has(mapping.fromPath)) continue
    seen.add(mapping.fromPath)
    redirects.push(mapping)
  }

  return redirects
}

/** Path da includere in sitemap (tutti gli URL in-place + destinazioni redirect). */
export function listWpSitemapCanonicalPaths(paths: string[]): string[] {
  const canonical = new Set<string>()

  for (const raw of paths) {
    const mapping = resolveWpIndexedPath(raw)
    if (!mapping) continue
    if (mapping.serveInPlace) {
      canonical.add(mapping.fromPath)
    } else if (mapping.toPath) {
      canonical.add(mapping.toPath)
    }
  }

  return [...canonical].sort()
}
