export type HubLocale = 'IT' | 'EN' | 'ES' | 'FR' | 'DE'

export const HUB_LOCALES: HubLocale[] = ['IT', 'EN', 'ES', 'FR', 'DE']

export const LOCALE_PATH: Record<HubLocale, string> = {
  IT: '',
  EN: '/en',
  ES: '/es',
  FR: '/fr',
  DE: '/de',
}

/** BCP 47 per hreflang */
export const HREFLANG_CODE: Record<HubLocale, string> = {
  IT: 'it',
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
}

const LOCALE_SET = new Set<string>(HUB_LOCALES)

export function parseHubLocale(value: unknown, fallback: HubLocale = 'IT'): HubLocale {
  if (typeof value === 'string' && LOCALE_SET.has(value.toUpperCase())) {
    return value.toUpperCase() as HubLocale
  }
  return fallback
}

export function productPath(slug: string, locale: HubLocale): string {
  const prefix = LOCALE_PATH[locale]
  return `${prefix}/prodotto/${slug}/`
}

export function catalogPath(locale: HubLocale): string {
  const prefix = LOCALE_PATH[locale]
  return `${prefix}/catalogo`
}

export function categoryPath(slug: string, locale: HubLocale): string {
  const prefix = LOCALE_PATH[locale]
  return `${prefix}/categoria/${slug}`
}

export function brandsIndexPath(locale: HubLocale): string {
  const prefix = LOCALE_PATH[locale]
  return `${prefix}/brand`
}

export function brandPath(slug: string, locale: HubLocale): string {
  const prefix = LOCALE_PATH[locale]
  return `${prefix}/brand/${slug}`
}

export function homePath(locale: HubLocale): string {
  const prefix = LOCALE_PATH[locale]
  return prefix || '/'
}

export function absoluteUrl(siteBase: string, path: string): string {
  const base = siteBase.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
