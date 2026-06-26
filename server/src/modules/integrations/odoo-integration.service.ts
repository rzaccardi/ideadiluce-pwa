import type { Request } from 'express'
import { logger } from '../../lib/logger.js'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { AppError } from '../../types/errors.js'
import {
  assertOdooConfigured,
  isOdooConfigured,
  odooExecuteKw,
  odooHttpGetSimple,
  odooRunPingDiagnostics,
  toAppError,
  type OdooCallContext,
} from '../../adapters/odoo/odooClient.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { createOdooOrderAdapter } from '../../adapters/odoo/odooOrderAdapter.js'
import { createOdooPaymentAdapter } from '../../adapters/odoo/odooPaymentAdapter.js'
import type {
  OdooCustomerPrefillQuery,
  OdooPaymentUrlBody,
  OdooTestCheckoutBody,
} from './integrations.validators.js'
import type { PaymentUrlDTO } from '../../types/dto.js'
import type { OdooCustomerPrefillDTO, TestCheckoutResponseDTO } from '../../types/integrations.dto.js'

const customerAdapter = createOdooCustomerAdapter()
const orderAdapter = createOdooOrderAdapter()
const paymentAdapter = createOdooPaymentAdapter()

function assertSession(req: Request) {
  const s = req.sessionRecord
  if (!s) {
    throw new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile.', 500, false)
  }
  return s
}

async function assertCartForRequest(req: Request, cartId: string) {
  const s = assertSession(req)
  const cart = await prisma.cart.findFirst({
    where: {
      id: cartId,
      status: 'ACTIVE',
      OR: [{ sessionId: s.id }, ...(s.userId ? [{ userId: s.userId }] : [])],
    },
    include: { items: true },
  })
  if (!cart) {
    throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato o non autorizzato.', 404, false)
  }
  if (cart.items.length === 0) {
    throw new AppError('EMPTY_CART', 'Cart empty', 'Carrello vuoto.', 400, false)
  }
  return cart
}

async function countryIdForCode(ctx: OdooCallContext, code: string): Promise<number | null> {
  const domain: unknown[] = [['code', '=', code.toUpperCase()]]
  const rows = await odooExecuteKw<Array<{ id: number }>>(
    ctx,
    'res.country',
    'search_read',
    [domain],
    { fields: ['id'], limit: 1 },
  )
  return rows[0]?.id ?? null
}

async function writePartnerAddress(
  ctx: OdooCallContext,
  partnerId: number,
  billing: OdooTestCheckoutBody['billingAddress'],
) {
  const street = [billing.line1, billing.line2].filter(Boolean).join(', ')
  const name = [billing.firstName, billing.lastName].filter(Boolean).join(' ').trim()
  const vals: Record<string, unknown> = {
    street,
    city: billing.city,
    zip: billing.postalCode,
  }
  if (name) vals.name = name
  if (billing.phone?.trim()) vals.phone = billing.phone.trim()
  const cid = await countryIdForCode(ctx, billing.country)
  if (cid) vals.country_id = cid
  await odooExecuteKw(ctx, 'res.partner', 'write', [[partnerId], vals], {})
}

async function persistOdooCustomerMap(params: {
  userId: string | null
  email: string
  odooPartnerId: number
}) {
  const emailLower = params.email.toLowerCase()
  if (params.userId) {
    await prisma.odooCustomerMap.upsert({
      where: { userId: params.userId },
      create: {
        userId: params.userId,
        odooPartnerId: params.odooPartnerId,
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
      },
      update: {
        odooPartnerId: params.odooPartnerId,
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
      },
    })
  } else {
    const existing = await prisma.odooCustomerMap.findFirst({
      where: { guestEmail: emailLower, userId: null },
    })
    if (existing) {
      await prisma.odooCustomerMap.update({
        where: { id: existing.id },
        data: {
          odooPartnerId: params.odooPartnerId,
          syncStatus: 'SYNCED',
          lastSyncAt: new Date(),
          guestEmail: emailLower,
        },
      })
    } else {
      await prisma.odooCustomerMap.create({
        data: {
          guestEmail: emailLower,
          odooPartnerId: params.odooPartnerId,
          syncStatus: 'SYNCED',
          lastSyncAt: new Date(),
        },
      })
    }
  }
}

export const odooIntegrationService = {
  async ping(correlationId: string) {
    const versionMode = 'odoo18-xmlrpc' as const
    const baseNotes: string[] = []

    if (!env.ODOO_ENABLED) {
      baseNotes.push('ODOO_ENABLED è false — nessuna chiamata remota.')
      return {
        success: true,
        ok: true,
        versionMode,
        odooEnabled: false,
        notes: baseNotes,
      }
    }
    if (!isOdooConfigured()) {
      baseNotes.push(
        'ODOO_ENABLED ma configurazione XML-RPC incompleta: servono ODOO_URL o ODOO_XMLRPC_URL (o ODOO_BASE_URL), ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD.',
      )
      return {
        success: false,
        ok: false,
        versionMode,
        odooEnabled: true,
        configured: false,
        notes: baseNotes,
      }
    }

    const ctx: OdooCallContext = { correlationId }
    try {
      const { version, uid, smokeSample } = await odooRunPingDiagnostics(ctx)
      const notes = [
        ...baseNotes,
        'common.authenticate: uid ottenuto',
        'execute_kw(res.lang/search_read): lettura minima OK',
        `Campioni attivi: ${Array.isArray(smokeSample) ? smokeSample.length : 0} record`,
      ]
      return {
        success: true,
        ok: true,
        versionMode,
        odooEnabled: true,
        configured: true,
        uid,
        serverVersion: version,
        smokeSample,
        notes,
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      return {
        success: false,
        ok: false,
        versionMode,
        odooEnabled: true,
        configured: true,
        notes: [...baseNotes, `ping_failed: ${errMsg}`],
      }
    }
  },

  async docCheck(correlationId: string) {
    const ping = await this.ping(correlationId)
    if (!env.ODOO_ENABLED || !isOdooConfigured()) {
      return {
        ...ping,
        docNote: 'Documentazione dinamica Odoo non richiesta (Odoo off o non configurato).',
      }
    }
    const ctx: OdooCallContext = { correlationId }
    const doc = await odooHttpGetSimple(ctx, '/doc')
    return {
      ...ping,
      docEndpoint: '/doc',
      docHttpStatus: doc.status,
      docReachable: doc.ok,
    }
  },

  async customerPrefill(
    req: Request,
    query: OdooCustomerPrefillQuery,
  ): Promise<OdooCustomerPrefillDTO> {
    if (!env.ODOO_ENABLED || !isOdooConfigured()) {
      return {
        source: 'none',
        profile: null,
        notes: ['Odoo non configurato: prefill disponibile solo dai dati profilo locali.'],
      }
    }

    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    try {
      const profile = await customerAdapter.getCustomerProfileByEmail(ctx, query.email)
      return {
        source: profile ? 'odoo' : 'none',
        profile,
        notes: profile ? ['Profilo cliente recuperato da res.partner.'] : ['Nessun partner Odoo trovato per email.'],
      }
    } catch (e) {
      throw toAppError(e, req.correlationId)
    }
  },

  async paymentUrl(
    correlationId: string,
    body: OdooPaymentUrlBody,
  ): Promise<PaymentUrlDTO> {
    assertOdooConfigured()
    const ctx: OdooCallContext = { correlationId }

    try {
      const result = await paymentAdapter.createPortalPaymentUrl(ctx, {
        documentModel: body.documentModel,
        documentId: body.documentId,
      })
      return { paymentUrl: result.paymentUrl }
    } catch (e) {
      if (e instanceof AppError) throw e
      throw toAppError(e, correlationId)
    }
  },

  async testCheckout(req: Request, body: OdooTestCheckoutBody): Promise<TestCheckoutResponseDTO> {
    assertOdooConfigured()
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const session = assertSession(req)
    const cart = await assertCartForRequest(req, body.cartId)

    const u = session.userId
      ? await prisma.user.findUnique({ where: { id: session.userId } })
      : null

    let partner
    try {
      partner = await customerAdapter.findOrCreateCustomer(ctx, {
        email: body.email,
        firstName: body.billingAddress.firstName ?? u?.firstName,
        lastName: body.billingAddress.lastName ?? u?.lastName,
        phone: body.billingAddress.phone ?? u?.phone,
      })
    } catch (e) {
      throw toAppError(e, req.correlationId)
    }

    try {
      await writePartnerAddress(ctx, partner.odooPartnerId, body.billingAddress)
    } catch (e) {
      throw toAppError(e, req.correlationId)
    }

    try {
      await persistOdooCustomerMap({
        userId: session.userId ?? null,
        email: body.email,
        odooPartnerId: partner.odooPartnerId,
      })
    } catch (e) {
      logger.warn('odoo.persistCustomerMap_failed', { err: String(e) }, req)
    }

    const existingCheckoutSession = await prisma.checkoutSession.findFirst({
      where: { cartId: body.cartId, state: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
    })

    let order
    try {
      order = await orderAdapter.createOrUpdateSaleOrder(ctx, {
        odooPartnerId: partner.odooPartnerId,
        odooSaleOrderId: existingCheckoutSession?.odooSaleOrderId ?? null,
        currencyCode: cart.currencyCode,
        lines: cart.items.map((i) => ({
          productRef: i.productRef,
          variantRef: i.variantRef,
          quantity: i.quantity,
          unitPriceCents: i.clientUnitPriceEstimate ?? undefined,
        })),
      })
    } catch (e) {
      throw toAppError(e, req.correlationId)
    }

    let checkoutSession = existingCheckoutSession

    if (!checkoutSession) {
      checkoutSession = await prisma.checkoutSession.create({
        data: {
          cartId: body.cartId,
          email: body.email,
          state: 'DRAFT',
          userId: session.userId ?? undefined,
          odooPartnerId: partner.odooPartnerId,
          odooSaleOrderId: order.odooSaleOrderId,
          billingAddressJson: body.billingAddress as object,
          shippingAddressJson: body.shippingAddress as object,
          expiresAt: new Date(Date.now() + 86400000),
        },
      })
    } else {
      checkoutSession = await prisma.checkoutSession.update({
        where: { id: checkoutSession.id },
        data: {
          email: body.email,
          odooPartnerId: partner.odooPartnerId,
          odooSaleOrderId: order.odooSaleOrderId,
          billingAddressJson: body.billingAddress as object,
          shippingAddressJson: body.shippingAddress as object,
        },
      })
    }

    let pay
    try {
      pay = await paymentAdapter.createCheckoutRedirect(ctx, {
        cartId: body.cartId,
        email: body.email,
        odooPartnerId: partner.odooPartnerId,
        odooSaleOrderId: order.odooSaleOrderId,
      })
    } catch (e) {
      pay = {
        redirectUrl: null,
        providerRef: 'payment-error',
        debug: { error: String(e) },
      }
    }

    const requestMode: 'mock' | 'real' =
      env.ODOO_ENABLED && isOdooConfigured() ? 'real' : 'mock'

    const notes: string[] = []
    if (!pay.redirectUrl) {
      notes.push(
        pay.providerRef === 'payment-error'
          ? 'redirectUrl assente: generazione URL pagamento Odoo fallita (vedi paymentDebug).'
          : 'redirectUrl assente: URL pagamento Odoo non disponibile (vedi paymentDebug).',
      )
    }
    if (order.odooSaleOrderId === 0) {
      notes.push('odooSaleOrderId=0: verifica adapter ordine o configurazione Odoo.')
    }

    return {
      success: true,
      odooPartnerId: String(partner.odooPartnerId),
      odooSaleOrderId: String(order.odooSaleOrderId),
      checkoutState: checkoutSession.state,
      redirectUrl: pay.redirectUrl,
      rawDebugSummary: {
        requestMode,
        correlationId: req.correlationId,
        checkoutSessionId: checkoutSession.id,
        cartSnapshot: {
          cartId: cart.id,
          currencyCode: cart.currencyCode,
          status: cart.status,
          itemCount: cart.items.length,
          items: cart.items.map((i) => ({
            id: i.id,
            productRef: i.productRef,
            variantRef: i.variantRef,
            quantity: i.quantity,
            clientUnitPriceEstimateCents: i.clientUnitPriceEstimate,
          })),
        },
        odooSummary: {
          partnerId: partner.odooPartnerId,
          saleOrderId: order.odooSaleOrderId,
          providerRef: pay.providerRef,
        },
        notes,
        legacyFields: {
          cartItemCount: cart.items.length,
          paymentDebug: pay.debug,
        },
      },
    }
  },
}
