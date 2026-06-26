import type { QuoteRequest } from '@prisma/client'
import type { Request } from 'express'
import { env } from '../../config/env.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { createOdooOrderAdapter } from '../../adapters/odoo/odooOrderAdapter.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { sendMail } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import type { QuoteCheckoutDTO, QuoteDetailDTO, QuoteRequestDTO } from '../../types/dto.js'
import {
  buildLinesSnapshot,
  jsonValue,
  loadActiveCart,
} from '../checkout/checkout-order-sync.service.js'
import type { CheckoutOrderLinesSnapshot } from '../checkout/checkout-order.types.js'
import { cartRepository } from '../cart/cart.repository.js'
import { writeStructuredIntegrationLog } from '../../lib/integration-log-context.js'
import {
  applyFrozenQuoteSnapshotToCart,
  linesSnapshotFromOdooQuotation,
} from './quotes-frozen.helper.js'
import {
  parseQuoteId,
  quotePayabilityErrorCode,
  quotePayabilityUserMessage,
  resolveOdooQuotePayability,
  type QuotePayableReason,
  type QuoteRequestBody,
} from './quotes.validators.js'
import type { TestCheckoutAddressInput } from '../integrations/integrations.validators.js'
import { odooSalesService } from '../odoo/odoo-sales.service.js'
import { syncRetryJobService } from '../sync-retry/sync-retry.service.js'

const customerAdapter = createOdooCustomerAdapter()
const orderAdapter = createOdooOrderAdapter()

const INQUIRY_TO = 'info@ideadiluce.com'

function placeholderAddress(firstName: string, lastName: string): TestCheckoutAddressInput {
  return {
    firstName,
    lastName,
    line1: 'Da definire',
    streetNumber: '',
    isSnc: true,
    city: '—',
    postalCode: '00000',
    country: 'IT',
  }
}

function mapOdooQuoteListItem(doc: {
  id: number
  name: string
  state: string
  dateOrder: string | null
  amountTotalCents: number | null
  amountUntaxedCents?: number | null
  amountTaxCents?: number | null
  currencyCode: string | null
  partnerEmail: string | null
  validityDate: string | null
}): QuoteRequestDTO {
  const payability = resolveOdooQuotePayability({
    state: doc.state,
    validityDate: doc.validityDate,
  })
  const status =
    doc.state === 'sent'
      ? 'sent'
      : doc.state === 'cancel'
        ? 'cancelled'
        : doc.state === 'sale' || doc.state === 'done'
          ? 'converted'
          : doc.state === 'draft'
            ? 'draft'
            : 'requested'

  return {
    id: `odoo-${doc.id}`,
    status,
    email: doc.partnerEmail ?? '',
    currencyCode: doc.currencyCode ?? 'EUR',
    estimatedSubtotal: doc.amountUntaxedCents ?? null,
    estimatedTax: doc.amountTaxCents ?? null,
    estimatedTotal: doc.amountTotalCents,
    odooSaleOrderId: doc.id,
    pwaOrderId: null,
    notes: null,
    createdAt: doc.dateOrder ?? new Date(0).toISOString(),
    updatedAt: doc.dateOrder ?? new Date(0).toISOString(),
    source: 'odoo',
    payable: payability.payable,
    payableReason: payability.reason,
    expired: payability.expired,
    validityDate: doc.validityDate ?? null,
    odooReference: doc.name,
  }
}

async function logQuotePayabilityDenied(
  req: Request,
  input: {
    userId: string
    odooSaleOrderId: number
    quoteId: string
    reason: QuotePayableReason
    state: string
    validityDate?: string | null
  },
) {
  await writeStructuredIntegrationLog({
    service: 'quotes',
    operation: `quote_not_payable_${input.reason}`,
    correlationId: req.correlationId,
    success: false,
    userId: input.userId,
    quoteId: input.quoteId,
    odooSaleOrderId: input.odooSaleOrderId,
    extra: { state: input.state, validityDate: input.validityDate ?? null },
  })
}

function assertOdooQuotePayable(
  req: Request,
  input: {
    userId: string
    odooSaleOrderId: number
    quoteId: string
    state: string
    validityDate?: string | null
  },
): void {
  const payability = resolveOdooQuotePayability({
    state: input.state,
    validityDate: input.validityDate,
  })
  if (payability.payable) return

  void logQuotePayabilityDenied(req, { ...input, reason: payability.reason })

  throw new AppError(
    quotePayabilityErrorCode(payability.reason),
    'Quote not payable',
    quotePayabilityUserMessage(payability.reason),
    409,
    false,
    { reason: payability.reason, expired: payability.expired },
  )
}

function odooQuotationSnapshot(detail: {
  currencyCode: string | null
  amountTotalCents: number | null
  amountUntaxedCents?: number | null
  amountTaxCents?: number | null
  lines: Array<{
    productId: number | null
    productName: string | null
    quantity: number
    unitPriceCents: number | null
    subtotalCents: number | null
  }>
}) {
  return linesSnapshotFromOdooQuotation({
    currencyCode: detail.currencyCode ?? 'EUR',
    amountTotalCents: detail.amountTotalCents ?? 0,
    amountUntaxedCents: detail.amountUntaxedCents,
    amountTaxCents: detail.amountTaxCents,
    lines: detail.lines.map((line) => ({
      productId: line.productId,
      productName: line.productName ?? '',
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents ?? 0,
      subtotalCents: line.subtotalCents ?? 0,
    })),
  })
}

function mapQuoteRow(row: QuoteRequest, extra?: Partial<QuoteRequestDTO>): QuoteRequestDTO {
  return {
    id: row.id,
    status: row.status.toLowerCase() as QuoteRequestDTO['status'],
    email: row.email,
    currencyCode: row.currencyCode,
    estimatedSubtotal: row.estimatedSubtotal,
    estimatedTax: row.estimatedTax,
    estimatedTotal: row.estimatedTotal,
    odooSaleOrderId: row.odooSaleOrderId,
    pwaOrderId: row.pwaOrderId,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    source: 'pwa',
    payable: row.status === 'SENT' || row.status === 'CHECKOUT_STARTED',
    ...extra,
  }
}

function parseSnapshot(row: QuoteRequest): CheckoutOrderLinesSnapshot {
  return row.linesSnapshotJson as CheckoutOrderLinesSnapshot
}

async function assertQuoteOwner(userId: string, id: string): Promise<QuoteRequest> {
  const row = await prisma.quoteRequest.findFirst({ where: { id, userId } })
  if (!row) {
    throw new AppError('QUOTE_NOT_FOUND', 'Quote not found', 'Preventivo non trovato.', 404, false)
  }
  return row
}

async function assertUserPartnerId(userId: string, correlationId: string): Promise<number> {
  const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })
  if (map) return map.odooPartnerId
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (!user?.email) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false)
  }
  const resolved = await odooSalesService.resolvePartnerIdForUserOrEmail(
    { correlationId },
    { userId, email: user.email },
  )
  return resolved.partnerId
}

async function createFrozenQuoteOrder(input: {
  req: Request
  userId: string
  email: string
  cartId: string
  currencyCode: string
  amountTotal: number | null
  odooSaleOrderId: number | null
  snapshot: CheckoutOrderLinesSnapshot
  billingAddressJson?: unknown
  shippingAddressJson?: unknown
  clientOrderRef: string
  quoteId: string
  quoteKind: 'pwa' | 'odoo'
}): Promise<QuoteCheckoutDTO> {
  const s = input.req.sessionRecord
  if (!s) {
    throw new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile.', 500, false)
  }

  const existing = await prisma.pwaOrder.findFirst({
    where: {
      userId: input.userId,
      odooSaleOrderId: input.odooSaleOrderId ?? undefined,
      orderStatus: {
        in: ['CHECKOUT_LOCKED', 'PAYMENT_STARTED', 'PAYMENT_PENDING', 'PAYMENT_FAILED'],
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (existing?.checkoutSessionId) {
    return {
      quoteId: input.quoteId,
      orderId: existing.id,
      checkoutSessionId: existing.checkoutSessionId,
      orderStatus: existing.orderStatus.toLowerCase() as QuoteCheckoutDTO['orderStatus'],
    }
  }

  const checkoutSession = await prisma.checkoutSession.create({
    data: {
      cartId: input.cartId,
      userId: input.userId,
      email: input.email,
      state: 'COMMITTED',
      odooSaleOrderId: input.odooSaleOrderId,
      billingAddressJson: input.billingAddressJson
        ? jsonValue(input.billingAddressJson)
        : undefined,
      shippingAddressJson: input.shippingAddressJson
        ? jsonValue(input.shippingAddressJson)
        : undefined,
    },
  })

  const order = await prisma.pwaOrder.create({
    data: {
      cartId: input.cartId,
      checkoutSessionId: checkoutSession.id,
      userId: input.userId,
      sessionId: s.id,
      email: input.email,
      orderStatus: 'CHECKOUT_LOCKED',
      currencyCode: input.currencyCode,
      amountTotal: input.amountTotal,
      odooSaleOrderId: input.odooSaleOrderId,
      linesSnapshotJson: jsonValue(input.snapshot),
      billingAddressJson: input.billingAddressJson
        ? jsonValue(input.billingAddressJson)
        : undefined,
      shippingAddressJson: input.shippingAddressJson
        ? jsonValue(input.shippingAddressJson)
        : undefined,
      clientOrderRef: input.clientOrderRef,
    },
  })

  try {
    await applyFrozenQuoteSnapshotToCart(input.cartId, checkoutSession.id, input.snapshot)
    await writeStructuredIntegrationLog({
      service: 'quotes',
      operation: 'frozen_checkout_created',
      correlationId: input.req.correlationId,
      success: true,
      userId: input.userId,
      cartId: input.cartId,
      orderId: order.id,
      quoteId: input.quoteId,
      odooSaleOrderId: input.odooSaleOrderId,
      extra: { quoteKind: input.quoteKind },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    await writeStructuredIntegrationLog({
      service: 'quotes',
      operation: 'frozen_checkout_snapshot_failed',
      correlationId: input.req.correlationId,
      success: false,
      userId: input.userId,
      cartId: input.cartId,
      orderId: order.id,
      quoteId: input.quoteId,
      odooSaleOrderId: input.odooSaleOrderId,
      error: message,
    })
    throw e
  }

  return {
    quoteId: input.quoteId,
    orderId: order.id,
    checkoutSessionId: checkoutSession.id,
    orderStatus: 'checkout_locked',
  }
}

export const quotesService = {
  async request(req: Request, userId: string, input: QuoteRequestBody): Promise<QuoteRequestDTO> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false)
    }

    const cart = await loadActiveCart(req)
    const snapshot = buildLinesSnapshot(cart)
    const billingAddress =
      input.billingAddress ??
      (user.shippingAddressJson as QuoteRequestBody['billingAddress']) ??
      undefined
    const shippingAddress = input.shippingAddress ?? billingAddress

    let row = await prisma.quoteRequest.create({
      data: {
        userId,
        cartId: cart.id,
        email: user.email,
        notes: input.notes?.trim() || null,
        billingAddressJson: billingAddress ? jsonValue(billingAddress) : undefined,
        shippingAddressJson: shippingAddress ? jsonValue(shippingAddress) : undefined,
        linesSnapshotJson: jsonValue(snapshot),
        currencyCode: cart.currencyCode,
        estimatedSubtotal: snapshot.estimatedSubtotal ?? null,
        estimatedTax: snapshot.estimatedTax ?? null,
        estimatedTotal: snapshot.estimatedTotal ?? null,
        status: 'REQUESTED',
      },
    })

    const ctx: OdooCallContext = { correlationId: req.correlationId, req }

    if (env.ODOO_ENABLED && isOdooConfigured()) {
      try {
        const partner = await customerAdapter.findOrCreateCustomer(ctx, {
          email: user.email,
          firstName: user.firstName ?? billingAddress?.firstName ?? 'Cliente',
          lastName: user.lastName ?? billingAddress?.lastName ?? '',
          phone: user.phone ?? billingAddress?.phone ?? undefined,
        })

        const draftResult = await orderAdapter.syncSaleOrderDraft(ctx, {
          odooPartnerId: partner.odooPartnerId,
          pwaOrderId: row.id,
          clientOrderRef: `PWA-QUOTE-${row.id.slice(-8).toUpperCase()}`,
          orderNotes: input.notes?.trim() || `Richiesta preventivo PWA ${row.id}`,
          billingAddress:
            billingAddress ??
            placeholderAddress(user.firstName ?? 'Cliente', user.lastName ?? ''),
          shippingAddress:
            shippingAddress ??
            placeholderAddress(user.firstName ?? 'Cliente', user.lastName ?? ''),
          currencyCode: cart.currencyCode,
          lines: snapshot.items.map((line) => ({
            productRef: line.productRef,
            variantRef: line.variantRef,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
          })),
          shippingLine: null,
        })

        row = await prisma.quoteRequest.update({
          where: { id: row.id },
          data: { odooSaleOrderId: draftResult.odooSaleOrderId, status: 'SENT' },
        })
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        logger.warn('quotes.odoo_create_failed', { quoteId: row.id, err: message })
        await syncRetryJobService.enqueue({
          service: 'odoo',
          operation: 'quote_create',
          entityType: 'quote_request',
          entityId: row.id,
          payload: { quoteRequestId: row.id },
        })
      }
    }

    const lines = [
      'Tipo: Richiesta preventivo carrello PWA',
      `ID: ${row.id}`,
      `Cliente: ${user.email}`,
      `Totale stimato: ${((row.estimatedTotal ?? 0) / 100).toFixed(2)} ${row.currencyCode}`,
      row.odooSaleOrderId ? `Odoo SO: ${row.odooSaleOrderId}` : 'Odoo: sync in coda',
      '',
      row.notes || '(nessuna nota)',
    ]

    void sendMail({
      to: INQUIRY_TO,
      subject: `[Idea di Luce] Richiesta preventivo — ${user.email}`,
      text: lines.join('\n'),
    }).catch((err) => logger.warn('quotes.notify_email_failed', { err: String(err) }))

    if (row.odooSaleOrderId && env.ODOO_ENABLED && isOdooConfigured()) {
      void sendMail({
        to: user.email,
        subject: '[Idea di Luce] Richiesta preventivo ricevuta',
        text: [
          'Abbiamo ricevuto la tua richiesta di preventivo.',
          row.odooSaleOrderId ? `Riferimento Odoo: SO${row.odooSaleOrderId}` : '',
          'Ti contatteremo a breve con il preventivo definitivo.',
        ]
          .filter(Boolean)
          .join('\n'),
      }).catch((err) => logger.warn('quotes.customer_email_failed', { err: String(err) }))
    }

    await prisma.userNotification.create({
      data: {
        userId,
        type: 'quote_requested',
        title: 'Richiesta preventivo inviata',
        body: 'Abbiamo registrato la tua richiesta. Riceverai il preventivo via email.',
        payloadJson: { quoteRequestId: row.id, odooSaleOrderId: row.odooSaleOrderId },
      },
    })

    return mapQuoteRow(row)
  },

  async list(userId: string, correlationId: string): Promise<QuoteRequestDTO[]> {
    const rows = await prisma.quoteRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const local = rows.map((row) => mapQuoteRow(row))

    if (!isOdooConfigured()) return local

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
      const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })
      const odoo = await odooSalesService.listQuotations(
        { correlationId },
        map
          ? { page: 1, pageSize: 50, partnerId: map.odooPartnerId }
          : { page: 1, pageSize: 50, email: user?.email },
      )
      for (const doc of odoo.items) {
        if (local.some((q) => q.odooSaleOrderId === doc.id)) continue
        local.push(mapOdooQuoteListItem(doc))
      }
    } catch (e) {
      logger.warn('quotes.odoo_list_failed', { userId, err: String(e) })
    }

    return local.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  },

  async getById(userId: string, id: string, correlationId: string): Promise<QuoteDetailDTO> {
    const parsed = parseQuoteId(id)
    if (parsed.kind === 'odoo') {
      return this.getOdooById(userId, parsed.odooSaleOrderId, correlationId)
    }

    const row = await assertQuoteOwner(userId, parsed.id)
    const snapshot = parseSnapshot(row)
    return {
      ...mapQuoteRow(row),
      billingAddress: row.billingAddressJson as QuoteDetailDTO['billingAddress'],
      shippingAddress: row.shippingAddressJson as QuoteDetailDTO['shippingAddress'],
      lines: snapshot.items.map((line) => ({
        productRef: line.productRef,
        variantRef: line.variantRef,
        productName: line.productRef,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        lineTotalCents: line.lineTotalCents,
      })),
      frozen: true,
    }
  },

  async getOdooById(
    userId: string,
    odooSaleOrderId: number,
    correlationId: string,
  ): Promise<QuoteDetailDTO> {
    if (!isOdooConfigured()) {
      throw new AppError('ODOO_UNAVAILABLE', 'Odoo not configured', 'Odoo non configurato.', 503, true)
    }

    const partnerId = await assertUserPartnerId(userId, correlationId)
    const ctx: OdooCallContext = { correlationId }
    const detail = await odooSalesService.getQuotationDetail(ctx, odooSaleOrderId)
    if (!detail) {
      throw new AppError('QUOTE_NOT_FOUND', 'Quote not found', 'Preventivo non trovato.', 404, false)
    }
    if (detail.partnerId !== partnerId) {
      throw new AppError('QUOTE_FORBIDDEN', 'Quote forbidden', 'Preventivo non disponibile.', 403, false)
    }

    const snapshot = odooQuotationSnapshot(detail)
    const payability = resolveOdooQuotePayability({
      state: detail.state,
      validityDate: detail.validityDate,
    })
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
    let billingAddress: QuoteDetailDTO['billingAddress'] = null
    let shippingAddress: QuoteDetailDTO['shippingAddress'] = null
    if (user?.email) {
      const profile = await customerAdapter.getCustomerProfileByEmail(ctx, user.email)
      if (profile) {
        const addr = {
          firstName: profile.firstName,
          lastName: profile.lastName,
          line1: profile.line1,
          streetNumber: profile.streetNumber ?? '',
          isSnc: profile.isSnc ?? false,
          line2: profile.line2 ?? undefined,
          city: profile.city,
          postalCode: profile.postalCode,
          country: profile.country,
          phone: profile.phone,
        }
        billingAddress = addr
        shippingAddress = addr
      }
    }

    const status =
      detail.state === 'sent'
        ? 'sent'
        : detail.state === 'cancel'
          ? 'cancelled'
          : detail.state === 'sale' || detail.state === 'done'
            ? 'converted'
            : detail.state === 'draft'
              ? 'draft'
              : 'requested'

    return {
      id: `odoo-${detail.id}`,
      status,
      email: detail.partnerEmail ?? '',
      currencyCode: detail.currencyCode ?? 'EUR',
      estimatedSubtotal: snapshot.estimatedSubtotal,
      estimatedTax: snapshot.estimatedTax,
      estimatedTotal: snapshot.estimatedTotal,
      odooSaleOrderId: detail.id,
      pwaOrderId: null,
      notes: detail.note,
      createdAt: detail.dateOrder ?? new Date(0).toISOString(),
      updatedAt: detail.dateOrder ?? new Date(0).toISOString(),
      source: 'odoo',
      payable: payability.payable,
      payableReason: payability.reason,
      expired: payability.expired,
      validityDate: detail.validityDate ?? null,
      odooReference: detail.name,
      billingAddress,
      shippingAddress,
      lines: snapshot.items.map((line) => ({
        productRef: line.productRef,
        variantRef: line.variantRef,
        productName:
          detail.lines.find(
            (l: { productId: number | null; productName: string | null }) =>
              String(l.productId) === line.productRef,
          )?.productName ?? line.productRef,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        lineTotalCents: line.lineTotalCents,
      })),
      frozen: true,
    }
  },

  async startCheckout(req: Request, userId: string, id: string): Promise<QuoteCheckoutDTO> {
    const parsed = parseQuoteId(id)
    if (parsed.kind === 'odoo') {
      return this.startOdooCheckout(req, userId, parsed.odooSaleOrderId)
    }

    const quote = await assertQuoteOwner(userId, parsed.id)
    if (quote.status !== 'SENT' && quote.status !== 'CHECKOUT_STARTED') {
      throw new AppError(
        'QUOTE_NOT_PAYABLE',
        'Quote not payable',
        'Questo preventivo non è ancora pagabile.',
        409,
        false,
      )
    }

    const snapshot = parseSnapshot(quote)
    return createFrozenQuoteOrder({
      req,
      userId,
      email: quote.email,
      cartId: quote.cartId,
      currencyCode: quote.currencyCode,
      amountTotal: quote.estimatedTotal,
      odooSaleOrderId: quote.odooSaleOrderId,
      snapshot,
      billingAddressJson: quote.billingAddressJson,
      shippingAddressJson: quote.shippingAddressJson,
      clientOrderRef: `PWA-QUOTE-${quote.id.slice(-8).toUpperCase()}`,
      quoteId: quote.id,
      quoteKind: 'pwa',
    }).then(async (result) => {
      await prisma.quoteRequest.update({
        where: { id: quote.id },
        data: { status: 'CHECKOUT_STARTED', pwaOrderId: result.orderId },
      })
      return result
    })
  },

  async startOdooCheckout(
    req: Request,
    userId: string,
    odooSaleOrderId: number,
  ): Promise<QuoteCheckoutDTO> {
    if (!isOdooConfigured()) {
      throw new AppError('ODOO_UNAVAILABLE', 'Odoo not configured', 'Odoo non configurato.', 503, true)
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false)
    }

    const partnerId = await assertUserPartnerId(userId, req.correlationId)
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const detail = await odooSalesService.getQuotationDetail(ctx, odooSaleOrderId)
    if (!detail) {
      throw new AppError('QUOTE_NOT_FOUND', 'Quote not found', 'Preventivo non trovato.', 404, false)
    }
    if (detail.partnerId !== partnerId) {
      throw new AppError('QUOTE_FORBIDDEN', 'Quote forbidden', 'Preventivo non disponibile.', 403, false)
    }

    const quoteId = `odoo-${detail.id}`
    assertOdooQuotePayable(req, {
      userId,
      odooSaleOrderId: detail.id,
      quoteId,
      state: detail.state,
      validityDate: detail.validityDate,
    })

    const snapshot = odooQuotationSnapshot(detail)

    const s = req.sessionRecord
    if (!s) {
      throw new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile.', 500, false)
    }

    await writeStructuredIntegrationLog({
      service: 'quotes',
      operation: 'odoo_checkout_start',
      correlationId: req.correlationId,
      success: true,
      userId,
      quoteId,
      odooSaleOrderId: detail.id,
      extra: { state: detail.state, validityDate: detail.validityDate },
    })

    const cart = await cartRepository.create({
      session: { connect: { id: s.id } },
      user: { connect: { id: userId } },
      status: 'ACTIVE',
      currencyCode: snapshot.currencyCode,
      estimatedSubtotal: snapshot.estimatedSubtotal,
      estimatedTax: snapshot.estimatedTax,
      estimatedShipping: snapshot.estimatedShipping,
      estimatedTotal: snapshot.estimatedTotal,
      items: {
        create: snapshot.items.map((line) => ({
          productRef: line.productRef,
          variantRef: line.variantRef,
          quantity: line.quantity,
          clientUnitPriceEstimate: line.unitPriceCents,
        })),
      },
    })

    return createFrozenQuoteOrder({
      req,
      userId,
      email: user.email,
      cartId: cart.id,
      currencyCode: snapshot.currencyCode,
      amountTotal: snapshot.estimatedTotal,
      odooSaleOrderId: detail.id,
      snapshot,
      clientOrderRef: detail.clientOrderRef ?? `ODOO-QUOTE-${detail.id}`,
      quoteId: `odoo-${detail.id}`,
      quoteKind: 'odoo',
    })
  },
}
