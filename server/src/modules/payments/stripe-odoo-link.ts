/** Metadata Stripe → sale.order Odoo da confermare al webhook. */
export const STRIPE_ODOO_SALE_ORDER_ID_META = 'odoo_sale_order_id'

export function parseOdooSaleOrderIdFromStripeMetadata(
  metadata: Record<string, string> | null | undefined,
): number | null {
  const raw = metadata?.[STRIPE_ODOO_SALE_ORDER_ID_META]?.trim()
  if (!raw) return null
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

/**
 * L’id nella sessione Stripe è quello legato a questo pagamento.
 * Se manca (sessione creata prima della SO), si usa quello già in PWA.
 */
export function resolveOdooSaleOrderIdForFinalize(input: {
  fromStripe: number | null
  fromOrder: number | null
}): number | null {
  return input.fromStripe ?? input.fromOrder ?? null
}
