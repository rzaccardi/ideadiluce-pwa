import { env } from '../../config/env.js'
import {
  getOdooPublicBaseUrl,
  odooExecuteKw,
  type OdooCallContext,
} from './odooClient.js'
import { syncSaleOrderFunnelState } from './odooFunnelSync.js'
import { AppError } from '../../types/errors.js'
import type {
  OdooPaymentAdapter,
  PaymentRedirectInput,
  PortalPaymentUrlInput,
  PortalPaymentUrlResult,
} from './odooPaymentAdapter.js'

type SaleOrderPaymentInfo = {
  id: number
  name?: string
  state?: string
  amount_total?: number
  currency_id?: unknown
}

type PortalDocumentRow = {
  id: number
  name?: string
  state?: string
  payment_state?: string
  amount_total?: number
  amount_residual?: number
  currency_id?: unknown
  access_url?: string | false
  access_token?: string | false
  move_type?: string
}

function absoluteOdooWebUrl(pathOrUrl: string): string {
  const value = pathOrUrl.trim()
  const base = getOdooPublicBaseUrl().replace(/\/$/, '')
  if (!value) return base

  const baseUrl = new URL(base)
  const sourceUrl = /^https?:\/\//i.test(value) ? new URL(value) : null
  const sourcePath = sourceUrl ? `${sourceUrl.pathname}${sourceUrl.search}${sourceUrl.hash}` : value
  const normalizedPath = sourcePath.startsWith('/') ? sourcePath : `/${sourcePath}`
  const basePath = baseUrl.pathname.replace(/\/$/, '')

  if (basePath && normalizedPath.startsWith(`${basePath}/`)) {
    return `${baseUrl.origin}${normalizedPath}`
  }

  return `${base}${normalizedPath}`
}

function assertPublicPortalUrl(paymentUrl: string, documentModel: PortalPaymentUrlInput['documentModel']) {
  const base = new URL(getOdooPublicBaseUrl())
  const url = new URL(paymentUrl)

  if (url.origin !== base.origin) {
    throw new AppError(
      'ODOO_PAYMENT_URL_INVALID_DOMAIN',
      `Portal URL origin mismatch: ${url.origin}`,
      'La URL di pagamento Odoo non punta al dominio pubblico configurato.',
      502,
      false,
      { expectedOrigin: base.origin, actualOrigin: url.origin },
    )
  }

  if (url.pathname.includes('/web')) {
    throw new AppError(
      'ODOO_PAYMENT_URL_BACKEND',
      `Backend Odoo URL returned for ${documentModel}: ${paymentUrl}`,
      'Odoo ha restituito una URL backend che richiede login. Serve una URL portale pubblica.',
      502,
      false,
      { paymentUrl },
    )
  }

  const expectedPath = documentModel === 'sale.order' ? '/my/orders/' : '/my/invoices/'
  if (!url.pathname.includes(expectedPath)) {
    throw new AppError(
      'ODOO_PAYMENT_URL_NOT_PORTAL',
      `Unexpected Odoo portal URL for ${documentModel}: ${paymentUrl}`,
      'Odoo non ha restituito una URL portale valida per il pagamento.',
      502,
      false,
      { paymentUrl, expectedPath },
    )
  }

  if (!url.searchParams.get('access_token')) {
    throw new AppError(
      'ODOO_PAYMENT_URL_MISSING_TOKEN',
      `Missing access_token in portal URL for ${documentModel}`,
      'Odoo non ha restituito una URL tokenizzata per il pagamento.',
      502,
      false,
      { paymentUrl },
    )
  }
}

function tokenizedPortalUrl(pathOrUrl: string, accessToken: string | false | undefined): string {
  const paymentUrl = absoluteOdooWebUrl(pathOrUrl)
  const url = new URL(paymentUrl)
  if (!url.searchParams.get('access_token') && accessToken) {
    url.searchParams.set('access_token', accessToken)
  }
  return url.toString()
}

async function assertPaymentProviderConfigured(ctx: OdooCallContext): Promise<void> {
  let count = 0
  try {
    count = await odooExecuteKw<number>(
      ctx,
      'payment.provider',
      'search_count',
      [[['state', 'in', ['enabled', 'test']]]],
      {},
    )
  } catch (e) {
    throw new AppError(
      'ODOO_PAYMENT_PROVIDER_NOT_CONFIGURED',
      e instanceof Error ? e.message : String(e),
      'Provider di pagamento Odoo non configurato o non accessibile.',
      409,
      false,
    )
  }

  if (count <= 0) {
    throw new AppError(
      'ODOO_PAYMENT_PROVIDER_NOT_CONFIGURED',
      'No enabled Odoo payment.provider found',
      'Nessun provider di pagamento Odoo risulta configurato.',
      409,
      false,
    )
  }
}

async function readSaleOrderPaymentInfo(
  ctx: OdooCallContext,
  saleOrderId: number,
): Promise<SaleOrderPaymentInfo | null> {
  const rows = await odooExecuteKw<SaleOrderPaymentInfo[]>(
    ctx,
    'sale.order',
    'read',
    [[saleOrderId]],
    { fields: ['id', 'name', 'state', 'amount_total', 'currency_id'] },
  )
  return rows[0] ?? null
}

function isXmlRpcNoneMarshalError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  return msg.includes('cannot marshal None unless allow_none is enabled')
}

async function markSaleOrderAsSent(ctx: OdooCallContext, saleOrderId: number): Promise<void> {
  try {
    await odooExecuteKw<unknown>(
      ctx,
      'sale.order',
      'action_quotation_sent',
      [[saleOrderId]],
      {},
    )
  } catch (e) {
    if (!isXmlRpcNoneMarshalError(e)) throw e

    await odooExecuteKw<boolean>(
      ctx,
      'sale.order',
      'write',
      [[saleOrderId], { state: 'sent' }],
      {},
    )
  }
}

async function ensureSaleOrderPortalPayable(
  ctx: OdooCallContext,
  saleOrderId: number,
): Promise<{ before: SaleOrderPaymentInfo | null; after: SaleOrderPaymentInfo | null }> {
  const before = await readSaleOrderPaymentInfo(ctx, saleOrderId)

  if (before?.state === 'draft') {
    await markSaleOrderAsSent(ctx, saleOrderId)
  }

  const after = await readSaleOrderPaymentInfo(ctx, saleOrderId)
  return { before, after }
}

function portalFieldsFor(model: PortalPaymentUrlInput['documentModel']): string[] {
  if (model === 'sale.order') {
    return ['id', 'name', 'state', 'amount_total', 'currency_id', 'access_url', 'access_token']
  }
  return [
    'id',
    'name',
    'state',
    'payment_state',
    'amount_total',
    'amount_residual',
    'currency_id',
    'access_url',
    'access_token',
    'move_type',
  ]
}

async function readPortalDocument(
  ctx: OdooCallContext,
  input: PortalPaymentUrlInput,
): Promise<PortalDocumentRow> {
  const rows = await odooExecuteKw<PortalDocumentRow[]>(
    ctx,
    input.documentModel,
    'read',
    [[input.documentId]],
    { fields: portalFieldsFor(input.documentModel) },
  )
  const row = rows[0]
  if (!row) {
    throw new AppError(
      'ODOO_PAYMENT_DOCUMENT_NOT_FOUND',
      `${input.documentModel} ${String(input.documentId)} not found`,
      'Documento Odoo non trovato.',
      404,
      false,
      input,
    )
  }
  return row
}

function assertDocumentPayable(
  input: PortalPaymentUrlInput,
  row: PortalDocumentRow,
): void {
  if (input.documentModel === 'account.move') {
    if (row.state !== 'posted') {
      throw new AppError(
        'ODOO_PAYMENT_DOCUMENT_NOT_PAYABLE',
        `Invoice ${row.id} is not posted`,
        'La fattura non è ancora pagabile.',
        409,
        false,
        { document: row },
      )
    }
    if (row.payment_state === 'paid' || Number(row.amount_residual ?? 1) <= 0) {
      throw new AppError(
        'ODOO_PAYMENT_DOCUMENT_ALREADY_PAID',
        `Invoice ${row.id} already paid`,
        'Documento già pagato.',
        409,
        false,
        { document: row },
      )
    }
    return
  }

  if (row.state === 'cancel') {
    throw new AppError(
      'ODOO_PAYMENT_DOCUMENT_NOT_PAYABLE',
      `Sale order ${row.id} is cancelled`,
      'Ordine Odoo annullato e non pagabile.',
      409,
      false,
      { document: row },
    )
  }
}

async function portalUrlFromOdoo(
  ctx: OdooCallContext,
  input: PortalPaymentUrlInput,
  row: PortalDocumentRow,
): Promise<string> {
  try {
    const portalUrl = await odooExecuteKw<unknown>(
      ctx,
      input.documentModel,
      'get_portal_url',
      [[input.documentId]],
      {},
    )
    if (typeof portalUrl === 'string' && portalUrl.trim()) {
      const firstUrl = tokenizedPortalUrl(portalUrl, row.access_token)
      if (new URL(firstUrl).searchParams.get('access_token')) return firstUrl

      const refreshed = await readPortalDocument(ctx, input)
      return tokenizedPortalUrl(portalUrl, refreshed.access_token)
    }
  } catch (e) {
    if (!isXmlRpcNoneMarshalError(e)) throw e
  }

  if (typeof row.access_url === 'string' && row.access_url.trim()) {
    let paymentUrl = tokenizedPortalUrl(row.access_url, row.access_token)
    if (new URL(paymentUrl).searchParams.get('access_token')) return paymentUrl

    const refreshed = await readPortalDocument(ctx, input)
    paymentUrl = tokenizedPortalUrl(row.access_url, refreshed.access_token)
    if (new URL(paymentUrl).searchParams.get('access_token')) return paymentUrl
  }

  throw new AppError(
    'ODOO_PAYMENT_URL_UNAVAILABLE',
    `Cannot generate portal URL for ${input.documentModel} ${String(input.documentId)}`,
    'Impossibile generare la URL portale Odoo per il pagamento.',
    502,
    false,
    { document: row },
  )
}

async function createPortalPaymentUrl(
  ctx: OdooCallContext,
  input: PortalPaymentUrlInput,
): Promise<PortalPaymentUrlResult> {
  if (input.documentModel === 'sale.order') {
    await ensureSaleOrderPortalPayable(ctx, input.documentId)
  }

  const document = await readPortalDocument(ctx, input)
  assertDocumentPayable(input, document)
  await assertPaymentProviderConfigured(ctx)

  const paymentUrl = await portalUrlFromOdoo(ctx, input, document)
  assertPublicPortalUrl(paymentUrl, input.documentModel)

  return {
    paymentUrl,
    providerRef: `odoo-portal-${input.documentModel}`,
    debug: {
      note: 'URL portale Odoo pubblica e tokenizzata per pagamento gestito da Odoo.',
      documentModel: input.documentModel,
      documentId: input.documentId,
      document,
    },
  }
}

export type RegisterPaymentMethod = 'stripe' | 'bank_transfer'

export type RegisterPaymentInput = {
  saleOrderId: number
  pwaOrderId: string
  method: RegisterPaymentMethod
  amountCents: number
  transactionId?: string | null
  status: 'captured' | 'pending'
}

/**
 * Registra il pagamento PWA su Odoo (campi custom + sync funnel).
 * Per bonifico: stato pending; per Stripe catturato: stato paid/captured.
 */
export async function registerPayment(
  ctx: OdooCallContext,
  input: RegisterPaymentInput,
): Promise<'synced' | 'skipped' | 'failed'> {
  if (!env.ODOO_ENABLED) return 'skipped'

  const orderStatus = input.status === 'captured' ? 'paid' : 'payment_pending'
  const paymentStatus = input.status === 'captured' ? 'captured' : 'pending'

  const result = await syncSaleOrderFunnelState(ctx, input.saleOrderId, {
    pwaOrderId: input.pwaOrderId,
    orderStatus,
    paymentStatus,
    paymentMethod: input.method,
    providerTransactionId: input.transactionId ?? null,
  })

  if (result === 'failed') return 'failed'

  try {
    const fields = await odooExecuteKw<Record<string, unknown>>(
      ctx,
      'sale.order',
      'fields_get',
      [],
      { attributes: ['string'] },
    )
    const fieldNames = new Set(Object.keys(fields))
    const vals: Record<string, unknown> = {}
    if (fieldNames.has('x_pwa_payment_amount_cents')) {
      vals.x_pwa_payment_amount_cents = input.amountCents
    }
    if (Object.keys(vals).length > 0) {
      await odooExecuteKw<boolean>(ctx, 'sale.order', 'write', [[input.saleOrderId], vals], {})
    }
  } catch {
    /* campi custom opzionali */
  }

  return result
}

/**
 * Pagamenti Odoo / website_sale: redirect alla pagina portale del `sale.order`.
 * Da lì Odoo mostra i provider abilitati e gestisce la transazione.
 */
export function createLiveOdooPaymentAdapter(): OdooPaymentAdapter {
  return {
    async createCheckoutRedirect(ctx: OdooCallContext, input: PaymentRedirectInput) {
      if (input.odooSaleOrderId != null && input.odooSaleOrderId > 0) {
        const portalPayment = await createPortalPaymentUrl(ctx, {
          documentModel: 'sale.order',
          documentId: input.odooSaleOrderId,
        })

        return {
          redirectUrl: portalPayment.paymentUrl,
          providerRef: portalPayment.providerRef,
          debug: {
            ...portalPayment.debug,
            correlationId: ctx.correlationId,
            odooPartnerId: input.odooPartnerId,
            odooSaleOrderId: input.odooSaleOrderId,
          },
        }
      }

      if (env.CHECKOUT_REDIRECT_BASE?.trim()) {
        const base = env.CHECKOUT_REDIRECT_BASE.replace(/\/$/, '')
        const redirectUrl = `${base}?sale_order=${input.odooSaleOrderId != null ? String(input.odooSaleOrderId) : ''}&cart=${encodeURIComponent(input.cartId)}`
        return {
          redirectUrl,
          providerRef: 'checkout-redirect-base',
          debug: {
            note: 'URL costruito da CHECKOUT_REDIRECT_BASE (bridge manuale).',
            correlationId: ctx.correlationId,
            odooSaleOrderId: input.odooSaleOrderId,
          },
        }
      }

      return {
        redirectUrl: null,
        providerRef: 'odoo-live-placeholder',
        debug: {
          note: 'Redirect Odoo non disponibile: manca odooSaleOrderId.',
          correlationId: ctx.correlationId,
          odooPartnerId: input.odooPartnerId,
          odooSaleOrderId: input.odooSaleOrderId,
        },
      }
    },

    createPortalPaymentUrl,

    async getPaymentStatus(_ctx: OdooCallContext, _externalPaymentId: string) {
      return { status: 'pending' as const }
    },
  }
}
