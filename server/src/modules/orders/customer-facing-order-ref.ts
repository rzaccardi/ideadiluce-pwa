/**
 * Riferimento ordine del cliente per l’area account.
 * Esclude i fallback tecnici usati in sync Odoo (`PWA …`, `pwa-…`, quote auto).
 */
export function customerFacingOrderRef(ref: string | null | undefined): string | null {
  const trimmed = ref?.trim()
  if (!trimmed) return null
  if (/^pwa([\s_-]|$)/i.test(trimmed)) return null
  if (/^odoo-quote-/i.test(trimmed)) return null
  return trimmed
}
