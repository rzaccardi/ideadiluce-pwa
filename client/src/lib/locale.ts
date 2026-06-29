export type PwaLocale = 'IT' | 'EN' | 'ES' | 'FR' | 'DE'

export const PWA_LOCALES: PwaLocale[] = ['IT', 'EN', 'ES', 'FR', 'DE']

export const LOCALE_LABEL: Record<PwaLocale, string> = {
  IT: 'IT',
  EN: 'EN',
  ES: 'ES',
  FR: 'FR',
  DE: 'DE',
}

export const LOCALE_NAME: Record<PwaLocale, string> = {
  IT: 'Italiano',
  EN: 'English',
  ES: 'Español',
  FR: 'Français',
  DE: 'Deutsch',
}

/** Attributo lang su <html> (BCP 47). */
export const HTML_LANG: Record<PwaLocale, string> = {
  IT: 'it',
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
}

/** Prefisso path URL (IT = radice) */
export const LOCALE_PATH_PREFIX: Record<PwaLocale, string> = {
  IT: '',
  EN: '/en',
  ES: '/es',
  FR: '/fr',
  DE: '/de',
}

const PREFIX_TO_LOCALE = new Map(
  PWA_LOCALES.filter((l) => LOCALE_PATH_PREFIX[l]).map((l) => [LOCALE_PATH_PREFIX[l], l]),
)

export function parseLocaleFromPathname(pathname: string): PwaLocale {
  for (const [prefix, locale] of PREFIX_TO_LOCALE) {
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return locale
    }
  }
  return 'IT'
}

export function stripLocalePrefix(pathname: string): string {
  const locale = parseLocaleFromPathname(pathname)
  const prefix = LOCALE_PATH_PREFIX[locale]
  if (!prefix) return pathname
  const rest = pathname.slice(prefix.length)
  return rest.startsWith('/') ? rest : '/'
}

export function localizePath(path: string, locale: PwaLocale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const prefix = LOCALE_PATH_PREFIX[locale]
  if (!prefix) return normalized
  if (normalized === '/') return prefix || '/'
  return `${prefix}${normalized}`
}

export function parseLocaleParam(value: unknown): PwaLocale {
  if (typeof value === 'string') {
    const up = value.toUpperCase()
    if (PWA_LOCALES.includes(up as PwaLocale)) return up as PwaLocale
  }
  return 'IT'
}

export function parseLocaleFromHeader(value: string | null | undefined): PwaLocale {
  if (!value) return 'IT'
  return parseLocaleParam(value)
}
