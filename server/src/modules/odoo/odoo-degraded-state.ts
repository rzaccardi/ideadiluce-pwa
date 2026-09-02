/** Stato transitorio: Odoo catalogo REST non raggiungibile, usare cache locale. */

let catalogDegradedUntil = 0

const DEFAULT_TTL_MS = 60_000

export function markCatalogDegraded(ttlMs = DEFAULT_TTL_MS): void {
  catalogDegradedUntil = Math.max(catalogDegradedUntil, Date.now() + ttlMs)
}

export function clearCatalogDegraded(): void {
  catalogDegradedUntil = 0
}

export function isCatalogDegraded(): boolean {
  return Date.now() < catalogDegradedUntil
}
