import type { PwaOrder } from '@prisma/client'
import { env } from '../../config/env.js'
import type { OdooApiPaymentResult } from '../../adapters/odoo-api/odooApi.types.js'
import { formatDisplayOrderNumber } from '../orders/order-display-number.js'

export type BankTransferInstructionsDTO = {
  holder: string
  iban: string
  bankName: string | null
  reference: string
  amount: number
  currencyCode: string
  note: string
}

/** Fallback MVP se le variabili d'ambiente non sono impostate. */
export const BANK_TRANSFER_CONFIG_DEFAULTS = {
  holder: 'TLB ITALY Srl',
  iban: 'IT33 J050 3403 2900 0000 0014 259',
  bankName: 'Banco BPM',
} as const

/** IBAN demo spesso restituito da Odoo finché il journal non è configurato. */
const ODOO_SAMPLE_IBAN = 'IT60X0542811101000000123456'

export function normalizeBankTransferIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase()
}

export function isOdooSampleBankTransferIban(iban: string | null | undefined): boolean {
  if (!iban?.trim()) return false
  return normalizeBankTransferIban(iban) === ODOO_SAMPLE_IBAN
}

function pickString(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return null
}

function readBankTransferPayload(
  odooResult: OdooApiPaymentResult | null | undefined,
): Record<string, unknown> | null {
  if (!odooResult || typeof odooResult !== 'object') return null
  const nested = odooResult.bank_transfer
  if (nested && typeof nested === 'object') return nested as Record<string, unknown>
  return odooResult as Record<string, unknown>
}

function namesFromAddressJson(json: unknown): { firstName: string; lastName: string } {
  if (!json || typeof json !== 'object') return { firstName: '', lastName: '' }
  const address = json as Record<string, unknown>
  return {
    firstName: typeof address.firstName === 'string' ? address.firstName.trim() : '',
    lastName: typeof address.lastName === 'string' ? address.lastName.trim() : '',
  }
}

export function orderCustomerAccountName(
  order: Pick<PwaOrder, 'billingAddressJson' | 'shippingAddressJson' | 'fiscalJson' | 'email'>,
): string {
  const fiscal = order.fiscalJson as { viesName?: unknown } | null
  const viesName = typeof fiscal?.viesName === 'string' ? fiscal.viesName.trim() : ''
  if (viesName) return viesName

  const billing = namesFromAddressJson(order.billingAddressJson)
  const shipping = namesFromAddressJson(order.shippingAddressJson)
  const firstName = billing.firstName || shipping.firstName
  const lastName = billing.lastName || shipping.lastName
  const person = `${firstName} ${lastName}`.trim()
  if (person) return person

  const emailLocal = order.email.split('@')[0]?.trim()
  return emailLocal || 'Cliente'
}

export function buildBankTransferPaymentReference(
  order: Pick<PwaOrder, 'id' | 'odooSaleOrderId' | 'odooSaleOrderName' | 'createdAt'>,
  customerAccountName: string,
): string {
  const orderNumber = formatDisplayOrderNumber(order)
  return `Saldo Ordine ${orderNumber} - ${customerAccountName}`
}

export function configuredBankTransferAccount(): Pick<
  BankTransferInstructionsDTO,
  'holder' | 'iban' | 'bankName'
> {
  return {
    holder: env.BANK_TRANSFER_HOLDER?.trim() || BANK_TRANSFER_CONFIG_DEFAULTS.holder,
    iban: env.BANK_TRANSFER_IBAN?.trim() || BANK_TRANSFER_CONFIG_DEFAULTS.iban,
    bankName: env.BANK_TRANSFER_BANK_NAME?.trim() || BANK_TRANSFER_CONFIG_DEFAULTS.bankName,
  }
}

export type BuildBankTransferInstructionsInput = {
  order: Pick<
    PwaOrder,
    | 'id'
    | 'odooSaleOrderId'
    | 'odooSaleOrderName'
    | 'createdAt'
    | 'billingAddressJson'
    | 'shippingAddressJson'
    | 'fiscalJson'
    | 'email'
    | 'currencyCode'
  >
  amountCents: number
  currencyCode?: string
  odooResult?: OdooApiPaymentResult | null
}

export function buildBankTransferInstructions(
  input: BuildBankTransferInstructionsInput,
): BankTransferInstructionsDTO {
  const configured = configuredBankTransferAccount()
  const payload = readBankTransferPayload(input.odooResult)
  const customerAccountName = orderCustomerAccountName(input.order)

  const odooHolder = pickString(
    payload && typeof payload.account_holder === 'string' ? payload.account_holder : null,
    payload && typeof payload.intestatario === 'string' ? payload.intestatario : null,
    payload && typeof payload.holder === 'string' ? payload.holder : null,
  )
  const odooIbanRaw = pickString(
    payload && typeof payload.iban === 'string' ? payload.iban : null,
  )
  const odooIban =
    odooIbanRaw && !isOdooSampleBankTransferIban(odooIbanRaw) ? odooIbanRaw : null
  const odooBankName = pickString(
    payload && typeof payload.bank_name === 'string' ? payload.bank_name : null,
    payload && typeof payload.banca === 'string' ? payload.banca : null,
    payload && typeof payload.bank === 'string' ? payload.bank : null,
    input.odooResult?.payment_journal,
  )
  const odooReference = pickString(
    payload && typeof payload.payment_reason === 'string' ? payload.payment_reason : null,
    payload && typeof payload.causale === 'string' ? payload.causale : null,
    payload && typeof payload.reference === 'string' ? payload.reference : null,
  )

  let amountCents = input.amountCents
  if (payload && typeof payload.amount_cents === 'number' && Number.isFinite(payload.amount_cents)) {
    amountCents = Math.round(payload.amount_cents)
  } else if (payload && typeof payload.amount === 'number' && Number.isFinite(payload.amount)) {
    amountCents = Math.round(payload.amount)
  } else if (
    input.odooResult?.amount_cents != null &&
    Number.isFinite(input.odooResult.amount_cents)
  ) {
    amountCents = Math.round(input.odooResult.amount_cents)
  }

  const currencyCode =
    pickString(
      payload && typeof payload.currency === 'string' ? payload.currency : null,
      payload && typeof payload.currency_code === 'string' ? payload.currency_code : null,
      input.currencyCode,
      input.order.currencyCode,
    ) ?? 'EUR'

  return {
    holder: odooHolder ?? configured.holder,
    iban: odooIban ?? configured.iban,
    bankName: odooBankName ?? configured.bankName,
    reference:
      odooReference ?? buildBankTransferPaymentReference(input.order, customerAccountName),
    amount: amountCents,
    currencyCode,
    note: 'Il pagamento verra confermato dopo verifica/ricezione del bonifico.',
  }
}

export function parseBankTransferInstructionsJson(
  raw: unknown,
): BankTransferInstructionsDTO | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const holder = typeof o.holder === 'string' ? o.holder : null
  const iban = typeof o.iban === 'string' ? o.iban : null
  const reference = typeof o.reference === 'string' ? o.reference : null
  const amount = typeof o.amount === 'number' ? o.amount : null
  const currencyCode = typeof o.currencyCode === 'string' ? o.currencyCode : null
  if (!holder || !iban || !reference || amount == null || !currencyCode) return null
  return {
    holder,
    iban,
    bankName: typeof o.bankName === 'string' ? o.bankName : null,
    reference,
    amount,
    currencyCode,
    note: typeof o.note === 'string' ? o.note : '',
  }
}
