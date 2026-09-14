/** Sorgente del numero ordine visibile a cliente (codice Odoo, non l’ID interno). */
export type OrderNumberSource = {
  id: string
  odooSaleOrderId?: number | null
  odooSaleOrderName?: string | null
  createdAt?: Date | string | null
}

function yearFrom(createdAt?: Date | string | null): number {
  if (!createdAt) return new Date().getFullYear()
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt)
  return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear()
}

/** Numero ordine assegnato (es. 4CSVKG). Fallback solo se il codice Odoo non c’è ancora. */
export function formatDisplayOrderNumber(order: OrderNumberSource): string {
  const name = order.odooSaleOrderName?.trim()
  if (name) return name
  if (/^[A-Z0-9]{6}$/i.test(order.id.trim())) return order.id.trim()
  const year = yearFrom(order.createdAt)
  if (order.odooSaleOrderId != null && order.odooSaleOrderId > 0) {
    return `#IDL-${year}-${String(order.odooSaleOrderId).padStart(5, '0')}`
  }
  const rawId = order.id.startsWith('pwa-') ? order.id.slice(4) : order.id
  return `#${rawId.slice(0, 8).toUpperCase()}`
}
