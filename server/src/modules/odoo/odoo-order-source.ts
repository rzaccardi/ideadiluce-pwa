export type OdooOrderSource = 'pwa' | 'odoo_manual' | 'other_ecommerce' | 'odoo_historical'

export const ODOO_ORDER_SOURCE_LABEL: Record<OdooOrderSource, string> = {
  pwa: 'E-commerce',
  odoo_manual: 'Odoo manuale',
  other_ecommerce: 'Altro e-commerce',
  odoo_historical: 'Storico Odoo',
}

const HISTORICAL_CUTOFF = new Date('2025-06-01T00:00:00Z')

export type OdooOrderSourceInput = {
  clientOrderRef?: string | null
  origin?: string | null
  websiteId?: number | null
  xPwaCartToken?: string | null
  xPwaSessionId?: string | null
  xPwaCheckoutStatus?: string | null
  dateOrder?: string | null
}

/** Domain XML-RPC: confermati + bozze PWA (client_order_ref `PWA …`). */
export function buildAccountSaleOrderDomain(input?: {
  partnerIds?: number[] | null
  includePwaDrafts?: boolean
  states?: string[]
}): unknown[] {
  const states = input?.states ?? ['sale', 'done']
  const domain: unknown[] = input?.includePwaDrafts
    ? [
        '|',
        ['state', 'in', states],
        '&',
        ['state', 'in', ['draft', 'sent']],
        ['client_order_ref', '=ilike', 'PWA%'],
      ]
    : [['state', 'in', states]]
  if (input?.partnerIds && input.partnerIds.length > 0) {
    domain.push(['partner_id', 'in', input.partnerIds])
  }
  return domain
}

export function detectOdooOrderSource(input: OdooOrderSourceInput): OdooOrderSource {
  const ref = input.clientOrderRef?.trim() ?? ''
  if (/^PWA\b/i.test(ref)) return 'pwa'
  if (input.xPwaCartToken || input.xPwaSessionId || input.xPwaCheckoutStatus) return 'pwa'
  const origin = input.origin?.trim() ?? ''
  if (input.websiteId != null && input.websiteId > 0) return 'other_ecommerce'
  if (origin && /website|shop|woocommerce|prestashop|magento|amazon|ebay/i.test(origin)) {
    return 'other_ecommerce'
  }
  if (input.dateOrder) {
    const d = new Date(input.dateOrder)
    if (!Number.isNaN(d.getTime()) && d < HISTORICAL_CUTOFF) return 'odoo_historical'
  }
  return 'odoo_manual'
}
