/** Normalizza il valore di ritorno di `create` via `execute_kw` (id singolo o lista). */
export function normalizeOdooCreateId(result: unknown): number {
  if (typeof result === 'number' && Number.isFinite(result)) return result
  if (Array.isArray(result) && typeof result[0] === 'number') return result[0]
  throw new Error('Risposta create Odoo non riconosciuta')
}
