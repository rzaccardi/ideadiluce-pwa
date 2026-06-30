import type { PwaLocale } from '@/lib/locale'

export const IDEADILUCE_STORAGE_PREFIX = 'ideadiluce:'

export const IDEADILUCE_CART_MIRROR_KEY = `${IDEADILUCE_STORAGE_PREFIX}cart-mirror:v1`
export const IDEADILUCE_AUTH_SESSION_KEY = `${IDEADILUCE_STORAGE_PREFIX}auth-session:v1`
export const IDEADILUCE_THEME_KEY = `${IDEADILUCE_STORAGE_PREFIX}theme`
export const IDEADILUCE_SW_CLEAN_KEY = `${IDEADILUCE_STORAGE_PREFIX}sw-clean`

const CATALOG_SEARCH_RECENT_PREFIX = `${IDEADILUCE_STORAGE_PREFIX}catalog-search-recent:`

export function catalogSearchRecentKey(locale: PwaLocale): string {
  return `${CATALOG_SEARCH_RECENT_PREFIX}${locale}`
}

export function legacyCatalogSearchRecentKey(locale: PwaLocale): string {
  return `idl:catalog-search-recent:${locale}`
}

export const LEGACY_STORAGE_KEYS = {
  [IDEADILUCE_CART_MIRROR_KEY]: ['emil_cart_mirror_v1', 'emil_cart_v1'],
  [IDEADILUCE_AUTH_SESSION_KEY]: ['idl_auth_session_v1'],
  [IDEADILUCE_THEME_KEY]: ['idl-theme'],
  [IDEADILUCE_SW_CLEAN_KEY]: ['idl-sw-clean'],
} as const satisfies Record<string, readonly string[]>
