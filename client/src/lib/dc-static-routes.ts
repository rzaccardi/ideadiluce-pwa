import { stripLocalePrefix } from '@/lib/locale'

/** Path storefront (senza prefisso lingua) serviti come HTML statico DC. */
export const DC_STATIC_PATHS = new Set([
  '/',
  '/categoria-prodotto/illuminazione-arredo',
  '/categoria-prodotto/illuminazione-tecnica',
])

export type DcActiveNavId = 'arredo' | 'tecnico' | 'attacco' | 'ambienti' | 'brand' | 'guide'

export function isDcStaticPath(pathname: string): boolean {
  const path = normalizeDcStaticPath(pathname)
  return DC_STATIC_PATHS.has(path)
}

/** Tutte le pagine storefront sono full-bleed (sfondi sezione edge-to-edge). */
export function isFullBleedStorefrontPath(_pathname: string): boolean {
  return true
}

export function normalizeDcStaticPath(pathname: string): string {
  const path = stripLocalePrefix(pathname)
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path
}

const NAV_DROPDOWN_HREFS: Record<string, string> = {
  arredo: '/categoria-prodotto/illuminazione-arredo',
  tecnico: '/categoria-prodotto/illuminazione-tecnica',
  attacco: '/attacco',
}

export function resolveNavDropdownHref(id: string, href?: string): string {
  return href ?? NAV_DROPDOWN_HREFS[id] ?? '/catalog'
}

export function resolveDcActiveNavId(pathname: string): DcActiveNavId | null {
  const path = normalizeDcStaticPath(pathname)
  if (path.startsWith('/categoria-prodotto/illuminazione-arredo')) return 'arredo'
  if (path.includes('/illuminazione-tecnica')) return 'tecnico'
  if (path.startsWith('/attacco')) return 'attacco'
  if (path.startsWith('/ambienti')) return 'ambienti'
  if (path.startsWith('/brand')) return 'brand'
  if (path.startsWith('/guide')) return 'guide'
  return null
}
