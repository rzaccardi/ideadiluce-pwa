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
}

export type OdooApiCustomerValidate = {
  normalized?: Record<string, string>
  changed?: Record<string, string>
  issues?: OdooApiIssue[]
  valid?: boolean
}

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
}

export type OdooApiOrderLineWrite = {
  product_id: number
  qty: number
  price_unit_net: number
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
  }
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
  reconciliation?: OdooApiReconciliation
  warnings?: string[]
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
}

export type OdooApiStockItem = {
  id: number
  free_qty?: number
  qty_available?: number
  in_stock?: boolean
  is_storable?: boolean
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
  state?: string
  carrier?: string | null
  carrier_name?: string | null
  tracking_number?: string | null
  tracking_ref?: string | null
  tracking_url?: string | null
  date_done?: string | null
  scheduled_date?: string | null
}
