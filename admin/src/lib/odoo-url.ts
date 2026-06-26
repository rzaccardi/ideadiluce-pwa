/** Default allineato a `ODOO_PRODUCT_ACTION_ID` lato server. */
export const DEFAULT_ODOO_PRODUCT_ACTION_ID = 497

/** Base web Odoo con segmento `/odoo` (evita doppio `/odoo/odoo` se `ODOO_URL` lo include già). */
export function normalizeOdooWebBaseUrl(baseUrl: string): string {
  let base = baseUrl.trim().replace(/\/$/, '')
  while (/\/odoo\/odoo$/.test(base)) {
    base = base.replace(/\/odoo\/odoo$/, '/odoo')
  }
  if (base.endsWith('/odoo')) return base
  return `${base}/odoo`
}

/** Form prodotto `product.template` nel client web Odoo (es. `/odoo/action-497/{id}`). */
export function buildOdooProductUrl(
  baseUrl: string,
  templateId: number,
  actionId: number = DEFAULT_ODOO_PRODUCT_ACTION_ID,
): string {
  const base = normalizeOdooWebBaseUrl(baseUrl)
  return `${base}/action-${actionId}/${templateId}`
}

/** Form contatto `res.partner` nel client web Odoo 17+ (path relativo a `ODOO_URL`). */
export function buildOdooPartnerUrl(baseUrl: string, partnerId: number): string {
  const base = baseUrl.replace(/\/$/, '')
  return `${base}/contacts/${partnerId}`
}

/** Form `sale.order` nel client web Odoo 18 (es. `/odoo/sales/{id}`). */
export function buildOdooSaleOrderUrl(baseUrl: string, saleOrderId: number): string {
  const base = normalizeOdooWebBaseUrl(baseUrl)
  return `${base}/sales/${saleOrderId}`
}
