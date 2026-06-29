import { getSiteUrl } from '@/lib/env'
import { localizePath, PWA_LOCALES, type PwaLocale } from '@/lib/locale'
import type { ProductAlternateDTO } from '@/types/dto'

const HREFLANG: Record<PwaLocale, string> = {
  IT: 'it',
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
}

/** Canonical + hreflang per pagine statiche localizzate (categoria, brand, …). */
export function buildLocalizedPageSeo(input: {
  pathForLocale: (locale: PwaLocale) => string
  currentLocale: PwaLocale
}): { canonical: string; alternates: ProductAlternateDTO[] } {
  const site = getSiteUrl().replace(/\/$/, '')
  const alternates: ProductAlternateDTO[] = PWA_LOCALES.map((loc) => ({
    locale: HREFLANG[loc],
    href: `${site}${localizePath(input.pathForLocale(loc), loc)}`,
  }))
  const canonical = `${site}${localizePath(input.pathForLocale(input.currentLocale), input.currentLocale)}`
  return { canonical, alternates }
}

export function categorySeoPath(slug: string): string {
  return `/categoria/${slug}`
}

export function brandSeoPath(slug: string): string {
  return `/brand/${slug}`
}

function hasNonEmptyParam(
  searchParams: Record<string, string | string[] | undefined>,
  keys: string[],
): boolean {
  return keys.some((k) => {
    const v = searchParams[k]
    if (v == null) return false
    if (Array.isArray(v)) return v.some((x) => String(x).trim() !== '')
    return String(v).trim() !== ''
  })
}

/** true se il catalogo ha filtri query non indicizzabili. */
export function catalogHasFilterQuery(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  return hasNonEmptyParam(searchParams, [
    'category',
    'brand',
    'q',
    'inStock',
    'sort',
    'minPrice',
    'maxPrice',
    'world',
    'attacco',
    'colorTemp',
    'priceBucket',
  ])
}

/** true se una landing categoria-prodotto ha filtri query non indicizzabili. */
export function landingHasFilterQuery(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  return hasNonEmptyParam(searchParams, ['f', 'brand', 'sort', 'inStock', 'minPrice', 'maxPrice'])
}
