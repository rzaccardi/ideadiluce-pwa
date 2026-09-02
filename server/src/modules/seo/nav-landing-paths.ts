import { SITE_PAGE_DEFAULTS } from '../site/site-content.defaults.js'
import { AMBIENTI_ROOM_SLUGS } from './seo-sitemap.constants.js'

/**
 * Pagine catalogo da menu, mega-menu e link editoriali.
 * Finiscono in sitemap/llms (cache SEO su disco) e nel warmup ISR dello storefront.
 */
const LANDING_PATH_RE =
  /^\/(attacco|ambienti|categoria(?:-tecnica|-prodotto)?|tipologia|stile|illuminazione-arredo)(\/|$)/

/** Attacchi della pagina /attacco non sempre presenti nel mega-menu. */
const EXTRA_ATTACCO_PATHS = [
  '/attacco/e27',
  '/attacco/e14',
  '/attacco/gu10',
  '/attacco/gu5-3',
  '/attacco/r7s',
  '/attacco/g9',
  '/attacco/g4',
  '/attacco/t8',
  '/attacco/g13',
  '/attacco/gx53',
  '/attacco/2g11',
  '/attacco/g24',
] as const

const HREF_KEYS = new Set(['href', 'ctaHref', 'linkHref'])

function normalizeInternalPath(href: string): string | null {
  const raw = href.trim()
  if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) {
    return null
  }

  let pathname = raw
  try {
    pathname = /^https?:\/\//i.test(raw) ? new URL(raw).pathname : (raw.split('?')[0] ?? raw)
  } catch {
    pathname = raw.split('?')[0] ?? raw
  }

  if (!pathname.startsWith('/')) return null
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1)
  return pathname
}

function isCatalogLandingPath(path: string): boolean {
  return LANDING_PATH_RE.test(path)
}

function collectHrefKeys(value: unknown, out: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectHrefKeys(item, out)
    return
  }
  if (!value || typeof value !== 'object') return

  for (const [key, child] of Object.entries(value)) {
    if (HREF_KEYS.has(key) && typeof child === 'string') {
      const path = normalizeInternalPath(child)
      if (path && isCatalogLandingPath(path)) out.add(path)
      continue
    }
    collectHrefKeys(child, out)
  }
}

/** Path storefront (senza locale) di categorie, attacchi, ambienti e tassonomie da nav. */
export function listNavCatalogLandingPaths(): string[] {
  const paths = new Set<string>()
  collectHrefKeys(SITE_PAGE_DEFAULTS, paths)
  for (const extra of EXTRA_ATTACCO_PATHS) paths.add(extra)
  for (const room of AMBIENTI_ROOM_SLUGS) paths.add(`/ambienti/${room}`)
  paths.add('/attacco')
  paths.add('/ambienti')
  return [...paths].sort((a, b) => a.localeCompare(b, 'it'))
}

export function slugsFromLandingPaths(prefix: string): string[] {
  const needle = prefix.endsWith('/') ? prefix : `${prefix}/`
  const slugs = new Set<string>()
  for (const path of listNavCatalogLandingPaths()) {
    if (!path.startsWith(needle)) continue
    const slug = path.slice(needle.length)
    if (slug && !slug.includes('/')) slugs.add(slug)
  }
  return [...slugs].sort((a, b) => a.localeCompare(b, 'it'))
}

export function listNavAttaccoSlugs(): string[] {
  return slugsFromLandingPaths('/attacco')
}

export function listNavAmbienteSlugs(): string[] {
  return slugsFromLandingPaths('/ambienti')
}

export function listNavTipologiaSlugs(): string[] {
  return slugsFromLandingPaths('/tipologia')
}

export function listNavStileSlugs(): string[] {
  return slugsFromLandingPaths('/stile')
}

export function listNavCategoriaTecnicaSlugs(): string[] {
  return slugsFromLandingPaths('/categoria-tecnica')
}
