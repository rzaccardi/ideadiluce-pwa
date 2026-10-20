/** Contratto REST Odoo `/api/v2` (clienti, ordini, pagamenti, stock, fatture). */

export type OdooApiIssue = {
  code: string
  blocking: boolean
  message: string
}

export type OdooApiAddress = {
  id: number
  type?: string | null
  name: string
  street?: string | null
  street2?: string | null
  zip?: string | null
  city?: string | null
  state_code?: string | null
  country_code?: string | null
  phone?: string | null
  mobile?: string | null
  email?: string | null
  /** true = destinatario dropship (terzi), non indirizzo proprio del cliente. */
  dropship?: boolean | null
}

export type OdooApiCustomerWrite = {
  email: string
  name?: string
  street?: string
  street2?: string
  zip?: string
  city?: string
  country_code?: string
  state_code?: string
  phone?: string
  lang?: string
  vat?: string | null
  fiscal_code?: string | null
  pa_index?: string | null
  pec?: string | null
  company_name?: string | null
  is_company?: boolean
  marketing_optin?: boolean
}

export type OdooApiCustomer = OdooApiCustomerWrite & {
  id: number
  commercial_partner_id?: number | null
  mobile?: string | null
  site_id?: number
  has_login?: boolean
  data_state?: string | null
  data_issues?: OdooApiIssue[] | string | null
  main_address?: OdooApiAddress | null
  addresses?: OdooApiAddress[]
  payment_method?: string | null
  created?: boolean
  /** Condizioni B2B attive (P.IVA + listino dedicato): abilita dropship. */
  b2b_active?: boolean | null
}

export type OdooApiCustomerValidate = {
  normalized?: Record<string, string>
  changed?: Record<string, string>
  issues?: OdooApiIssue[]
  valid?: boolean
}

/** POST `/api/v2/auth/register` — crea utente portal legato al customer. */
export type OdooApiAuthRegisterWrite = {
  customer_id: number
  password: string
}

export type OdooApiAuthRegisterResult = {
  user_id: number
  login: string
  created?: boolean
}

export type OdooApiAddressRecipient = 'own' | 'third_party'

export type OdooApiAddressWrite = {
  name?: string
  street?: string
  street2?: string
  zip?: string
  city?: string
  country_code?: string
  state_code?: string
  phone?: string
  email?: string
  type?: string
  /** `own` = indirizzo del cliente; `third_party` = destinatario dropship. */
  recipient?: OdooApiAddressRecipient
}

export type OdooApiOrderLineWrite = {
  product_id: number
  qty: number
  /** Obbligatorio solo con `pricing.priced_from_cache`; altrimenti Odoo calcola. */
  price_unit_net?: number
}

export type OdooApiPaymentMethod = 'card' | 'paypal' | 'bank_transfer'

export type OdooApiOrderWrite = {
  client_ref: string
  customer_id: number
  shipping_address_id?: number
  invoice_address_id?: number
  currency?: string
  lines: OdooApiOrderLineWrite[]
  shipping?: {
    carrier: string
    amount_net: number
    label?: string
  }
  payment?: { method: OdooApiPaymentMethod }
  pricing?: {
    snapshot_at?: string
    charged_cents?: number
    /** Opzione 1 TLB: Odoo onora i price_unit_net inviati dalla cache PWA. */
    priced_from_cache?: boolean
  }
}

export type OdooApiPriceSource = 'public' | 'customer'

export type OdooApiPriceItem = {
  id: number
  list_price: number
  public_price?: number
  price: number
  discount_pct?: number
  source?: OdooApiPriceSource
}

export type OdooApiPricesResponse = {
  website?: { id: number; name?: string }
  qty?: number
  customer_id?: number | null
  snapshot_at?: string
  items: OdooApiPriceItem[]
}

export type OdooApiOrderTotalsLineWrite = {
  product_id: number
  qty: number
  /** Solo per probe/warning: Odoo avvisa se diverso dal prezzo calcolato. */
  price_unit_net?: number
}

export type OdooApiOrderTotalsWrite = {
  customer_id?: number | null
  currency?: string
  lines: OdooApiOrderTotalsLineWrite[]
  shipping?: {
    carrier?: string
    amount_net?: number
    label?: string
  }
}

export type OdooApiOrderTotalsLine = {
  product_id: number
  qty: number
  price_unit_net: number
  list_price?: number
  discount_pct?: number
  price_source?: OdooApiPriceSource | string
  tax_rate?: number
  subtotal_net?: number
  subtotal_net_cents?: number
}

export type OdooApiOrderTotalsResponse = {
  currency?: string
  snapshot_at?: string
  lines?: OdooApiOrderTotalsLine[]
  subtotal_net_cents?: number
  amount_tax_cents?: number
  amount_total_cents?: number
  tax_rates?: number | number[] | Record<string, number>
  warnings?: string[]
}

export type OdooApiOrderLine = {
  id?: number
  product_id?: number
  name?: string
  qty?: number
  qty_delivered?: number
  qty_invoiced?: number
  price_unit_net?: number
  tax_rate?: number
  subtotal_net?: number
  total_gross?: number
  is_delivery?: boolean
}

export type OdooApiOrderCustomer = {
  id: number
  name?: string
  email?: string
}

export type OdooApiReconciliation = {
  status?: string | null
  odoo_gross_cents?: number | null
  snapshot_gross_cents?: number | null
  charged_cents?: number | null
  diff_cents?: number | null
}

export type OdooApiOrder = {
  id: number
  name: string
  client_ref?: string | null
  state?: string
  date_order?: string | null
  customer?: OdooApiOrderCustomer | null
  shipping_address?: OdooApiAddress | null
  invoice_address?: OdooApiAddress | null
  currency?: string
  pricelist_id?: number | null
  totals?: {
    net?: number
    tax?: number
    gross?: number
    gross_cents?: number
  }
  lines?: OdooApiOrderLine[]
  shipping?: {
    carrier_id?: number | null
    carrier_name?: string | null
    amount_net?: number | null
    dropship?: boolean | null
  }
  payment?: {
    method_ade?: string | null
    charged_cents?: number | null
    provider_reference?: string | null
    reconciliation?: string | null
    transactions?: unknown[]
  }
  invoices?: unknown[]
  shipments?: OdooApiShipment[]
  /** Riepilogo consegna reale (tracking corriere). */
  delivery?: OdooApiOrderDelivery | null
  reconciliation?: OdooApiReconciliation
  warnings?: string[]
}

export type OdooApiDeliveryStatus =
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'exception'
  | null

export type OdooApiOrderDelivery = {
  status?: OdooApiDeliveryStatus
  /** UTC `YYYY-MM-DD HH:MM:SS`; null finché non consegnato. */
  delivered_at?: string | null
}

export type OdooApiOrderList = {
  items?: OdooApiOrder[]
  orders?: OdooApiOrder[]
  page?: number
  total?: number
}

export type OdooApiPaymentWrite = {
  provider: OdooApiPaymentMethod
  provider_reference?: string
  amount_cents: number
  currency?: string
}

export type OdooApiBankTransferDetails = {
  account_holder?: string
  intestatario?: string
  holder?: string
  iban?: string
  bank_name?: string
  banca?: string
  bank?: string
  amount?: number
  amount_cents?: number
  currency?: string
  currency_code?: string
  payment_reason?: string
  causale?: string
  reference?: string
}

export type OdooApiPaymentResult = {
  transaction_id?: number
  transaction_reference?: string
  transaction_state?: string
  provider?: string
  provider_reference?: string
  amount_cents?: number
  payment_id?: number
  payment_journal?: string
  order_id?: number
  order_name?: string
  order_state?: string
  idempotent?: boolean
  reconciliation?: OdooApiReconciliation
  bank_transfer?: OdooApiBankTransferDetails
}

export type OdooApiStockItem = {
  id: number
  free_qty?: number
  /** Compatibilità: non usare per la logica disponibilità. */
  qty_available?: number
  /** Compatibilità: non usare per la logica disponibilità. */
  in_stock?: boolean
  is_storable?: boolean
  lead_time_max?: number | null
  can_backorder?: boolean
  max_qty?: number | null
  sale_ok?: boolean
}

export type OdooApiInvoice = {
  id: number
  name?: string
  state?: string
  payment_state?: string
  currency?: string
  amount_total?: number
  amount_total_cents?: number
  invoice_date?: string | null
  payable_online?: boolean
  pdf_available?: boolean
}

export type OdooApiShipment = {
  id?: number
  name?: string
  picking?: string | null
  state?: string
  carrier?: string | null
  carrier_name?: string | null
  tracking_number?: string | null
  tracking_ref?: string | null
  tracking_url?: string | null
  date_done?: string | null
  scheduled_date?: string | null
  /** Stato tracking corriere (non confondere con `state` magazzino). */
  delivery_status?: OdooApiDeliveryStatus
  /** UTC `YYYY-MM-DD HH:MM:SS`; null finché non consegnato. */
  delivered_at?: string | null
}
