import type { PwaOrder, Prisma } from '@prisma/client'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { createOdooOrderAdapter } from '../../adapters/odoo/odooOrderAdapter.js'
import {
  ensureOdooPortalUser,
  findOdooPortalUserByEmail,
} from '../../adapters/odoo/odooPortalUserAdapter.js'
import { registerPayment } from '../../adapters/odoo/odooPaymentLive.js'
import { syncSaleOrderFunnelState, type OdooFunnelState } from '../../adapters/odoo/odooFunnelSync.js'
import { isOdooLiveConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { isOdooApiV2Configured } from '../../adapters/odoo-api/odooApiClient.js'
import { env } from '../../config/env.js'
import { generateAccountPassword } from '../../lib/generate-password.js'
import { prisma } from '../../lib/prisma.js'
import { orderTransactionalMail } from '../orders/order-transactional-mail.service.js'
import { AppError } from '../../types/errors.js'
import type { CheckoutFiscalInput } from '../checkout/checkout-order.types.js'
import type { TestCheckoutAddressInput } from '../integrations/integrations.validators.js'
import {
  orderStatusToDTO,
  paymentMethodToDTO,
  paymentStatusToDTO,
} from '../payments/payment.types.js'
import { enqueueOdooSyncOperation } from './odoo-sync-queue.enqueue.js'
import {
  isPaidOrderStatus,
  type EnqueueOdooSyncInput,
  type OdooSyncQueueOperation,
} from './odoo-sync-operations.js'
import { isWebsitePartnerUsable } from './odoo-website-partner.js'

const customerAdapter = createOdooCustomerAdapter()
const orderAdapter = createOdooOrderAdapter()

type AddressJson = {
  firstName?: string
  lastName?: string
  phone?: string
  line1?: string
  streetNumber?: string
  isSnc?: boolean
  line2?: string
  city?: string
  postalCode?: string
  province?: string
  country?: string
}

function asAddress(value: unknown): AddressJson | null {
  if (!value || typeof value !== 'object') return null
  return value as AddressJson
}

function displayName(email: string, address: AddressJson | null): string {
  const name = [address?.firstName, address?.lastName].filter(Boolean).join(' ').trim()
  return name || email
}

async function persistOdooCustomerMap(email: string, odooPartnerId: number) {
  const emailLower = email.toLowerCase().trim()
  await prisma.odooCustomerMap.upsert({
    where: { odooPartnerId },
    create: {
      odooPartnerId,
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
      guestEmail: emailLower,
    },
    update: {
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
      guestEmail: emailLower,
    },
  })
}

function mergeMetadata(order: PwaOrder, patch: Record<string, unknown>): Prisma.InputJsonValue {
  const current = (order.metadataJson as Record<string, unknown> | null) ?? {}
  return { ...current, ...patch } as Prisma.InputJsonValue
}

async function loadOrder(pwaOrderId: string): Promise<PwaOrder> {
  const order = await prisma.pwaOrder.findUnique({ where: { id: pwaOrderId } })
  if (!order) {
    throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
  }
  return order
}

export async function executeEnsurePartner(
  ctx: OdooCallContext,
  input: { pwaOrderId?: string | null; odooPartnerId?: number | null; payload: unknown },
): Promise<void> {
  const payload = (input.payload ?? {}) as {
    email?: string
    firstName?: string
    lastName?: string
    phone?: string
  }

  if (input.pwaOrderId) {
    const order = await loadOrder(input.pwaOrderId)
    if (await isWebsitePartnerUsable(ctx, customerAdapter, order.odooPartnerId)) return
    const billing = asAddress(order.billingAddressJson)
    const partner = await customerAdapter.findOrCreateCustomer(ctx, {
      email: payload.email ?? order.email,
      firstName: payload.firstName ?? billing?.firstName,
      lastName: payload.lastName ?? billing?.lastName,
      phone: payload.phone ?? billing?.phone,
      billingAddress:
        billing?.line1 && billing.city
          ? {
              firstName: billing.firstName ?? '',
              lastName: billing.lastName ?? '',
              line1: billing.line1,
              streetNumber: billing.streetNumber ?? '',
              isSnc: billing.isSnc ?? false,
              line2: billing.line2,
              city: billing.city,
              postalCode: billing.postalCode ?? '',
              province: billing.province,
              country: billing.country ?? 'IT',
              phone: billing.phone,
            }
          : undefined,
    })
    await prisma.pwaOrder.update({
      where: { id: order.id },
      data: { odooPartnerId: partner.odooPartnerId },
    })
    await persistOdooCustomerMap(order.email, partner.odooPartnerId)
    return
  }

  if (input.odooPartnerId == null) {
    throw new AppError('SYNC_TARGET_MISSING', 'Missing partner', 'Manca partner per sync.', 409, false)
  }
  const customer = await prisma.customerSatellite.findUnique({
    where: { odooPartnerId: input.odooPartnerId },
  })
  if (!customer) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false)
  }
  if (await isWebsitePartnerUsable(ctx, customerAdapter, customer.odooPartnerId)) return

  const partner = await customerAdapter.findOrCreateCustomer(ctx, {
    email: payload.email ?? customer.email,
    firstName: payload.firstName ?? customer.firstName,
    lastName: payload.lastName ?? customer.lastName,
    phone: payload.phone ?? customer.phone,
  })
  await persistOdooCustomerMap(customer.email, partner.odooPartnerId)
}

export async function executeEnsureSaleOrder(ctx: OdooCallContext, pwaOrderId: string): Promise<void> {
  const order = await loadOrder(pwaOrderId)
  if (order.odooSaleOrderId) return
  if (!order.odooPartnerId) {
    throw new AppError(
      'ODOO_PARTNER_MISSING',
      'Missing odooPartnerId',
      'Partner Odoo assente: attendere ensure_partner.',
      409,
      true,
    )
  }

  const cart = await prisma.cart.findUnique({
    where: { id: order.cartId },
    include: { items: true, shippingSelection: true },
  })
  const fiscal = (order.fiscalJson as CheckoutFiscalInput | null) ?? null

  let result
  try {
    result = await orderAdapter.syncSaleOrderDraft(ctx, {
      odooPartnerId: order.odooPartnerId,
      odooSaleOrderId: order.odooSaleOrderId,
      pwaOrderId: order.id,
      clientOrderRef: order.clientOrderRef ?? `pwa-${order.id}`,
      orderNotes: order.orderNotes,
      courierNotes: order.courierNotes,
      paymentMethod: order.paymentMethod ? paymentMethodToDTO(order.paymentMethod) : null,
      billingAddress: (order.billingAddressJson as TestCheckoutAddressInput | null) ?? null,
      shippingAddress: (order.shippingAddressJson as TestCheckoutAddressInput | null) ?? null,
      dropshipAddress: (order.dropshipAddressJson as TestCheckoutAddressInput | null) ?? null,
      fiscal,
      currencyCode: order.currencyCode,
      lines:
        cart?.items.map((i) => ({
          productRef: i.productRef,
          variantRef: i.variantRef,
          quantity: i.quantity,
          unitPriceCents: i.clientUnitPriceEstimate ?? undefined,
        })) ?? [],
      shippingLine: cart?.shippingSelection
        ? {
            label: cart.shippingSelection.label,
            amountCents: cart.shippingSelection.amountCents,
            carrierCode: cart.shippingSelection.carrierCode,
            serviceCode: cart.shippingSelection.serviceCode,
          }
        : null,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (/customer_id|non appartenente al sito|Cliente .+ non trovato/i.test(message)) {
      await prisma.pwaOrder.update({
        where: { id: order.id },
        data: { odooPartnerId: null },
      })
    }
    throw e
  }

  await prisma.pwaOrder.update({
    where: { id: order.id },
    data: { odooSaleOrderId: result.odooSaleOrderId },
  })
}

export async function executeReconcileLines(
  ctx: OdooCallContext,
  pwaOrderId: string,
  payload: unknown,
): Promise<void> {
  if (isOdooApiV2Configured()) return
  const order = await loadOrder(pwaOrderId)
  if (!order.odooSaleOrderId) {
    throw new AppError(
      'ODOO_ORDER_MISSING',
      'Missing odooSaleOrderId',
      'Ordine senza sale.order Odoo collegato.',
      409,
      true,
    )
  }

  const data = payload as {
    lines?: Array<{
      productRef: string
      variantRef?: string | null
      quantity: number
      unitPriceCents?: number
    }>
    shippingLine?: {
      label: string
      amountCents: number
      carrierCode?: string
      serviceCode?: string
    } | null
  }

  if (Array.isArray(data.lines) && data.lines.length > 0) {
    if (!isOdooApiV2Configured()) {
      await orderAdapter.reconcileSaleOrderLines(ctx, order.odooSaleOrderId, data.lines, data.shippingLine ?? null)
    }
    return
  }

  const cart = await prisma.cart.findUnique({
    where: { id: order.cartId },
    include: { items: true, shippingSelection: true },
  })
  if (!cart?.items.length) {
    throw new AppError('EMPTY_CART', 'Cart empty', 'Carrello vuoto.', 400, false)
  }
  await orderAdapter.reconcileSaleOrderLines(
    ctx,
    order.odooSaleOrderId,
    cart.items.map((i) => ({
      productRef: i.productRef,
      variantRef: i.variantRef,
      quantity: i.quantity,
      unitPriceCents: i.clientUnitPriceEstimate ?? undefined,
    })),
    cart.shippingSelection
      ? {
          label: cart.shippingSelection.label,
          amountCents: cart.shippingSelection.amountCents,
          carrierCode: cart.shippingSelection.carrierCode,
          serviceCode: cart.shippingSelection.serviceCode,
        }
      : null,
  )
}

function funnelStateFromPayload(payload: unknown, order: PwaOrder): OdooFunnelState {
  const data = payload as {
    funnelState?: Partial<OdooFunnelState>
    orderStatus?: string
    paymentStatus?: string
    paymentMethod?: string | null
  }
  if (data.funnelState) {
    return {
      pwaOrderId: data.funnelState.pwaOrderId ?? order.id,
      orderStatus: data.funnelState.orderStatus ?? 'unknown',
      paymentStatus: data.funnelState.paymentStatus ?? 'unknown',
      paymentMethod: data.funnelState.paymentMethod ?? null,
      cartId: data.funnelState.cartId ?? null,
      sessionId: data.funnelState.sessionId ?? null,
      abandonedAt: data.funnelState.abandonedAt ?? null,
      lastPaymentError: data.funnelState.lastPaymentError ?? null,
      providerTransactionId: data.funnelState.providerTransactionId ?? null,
    }
  }
  return {
    pwaOrderId: order.id,
    orderStatus: data.orderStatus ?? orderStatusToDTO(order.orderStatus),
    paymentStatus: data.paymentStatus ?? paymentStatusToDTO(order.paymentStatus),
    paymentMethod: data.paymentMethod ?? (order.paymentMethod ? paymentMethodToDTO(order.paymentMethod) : null),
    cartId: order.cartId,
    sessionId: order.sessionId,
    abandonedAt: order.abandonedAt,
    lastPaymentError: order.lastPaymentError,
    providerTransactionId: order.providerTransactionId,
  }
}

export async function executeFunnelSync(
  ctx: OdooCallContext,
  pwaOrderId: string,
  payload: unknown,
): Promise<void> {
  const order = await loadOrder(pwaOrderId)
  if (!order.odooSaleOrderId) {
    throw new AppError(
      'ODOO_ORDER_MISSING',
      'Missing odooSaleOrderId',
      'Ordine senza sale.order Odoo collegato.',
      409,
      true,
    )
  }

  const paid = isPaidOrderStatus(order.orderStatus, order.paymentStatus)
  if (paid) {
    const result = await registerPayment(ctx, {
      saleOrderId: order.odooSaleOrderId,
      pwaOrderId: order.id,
      method: order.paymentMethod === 'BANK_TRANSFER' ? 'bank_transfer' : order.paymentMethod === 'PAYPAL' ? 'paypal' : 'stripe',
      amountCents: order.amountTotal ?? 0,
      transactionId: order.providerTransactionId,
      status: 'captured',
    })
    if (result.status === 'failed') throw new Error('Registrazione pagamento Odoo fallita')
    if (result.status === 'skipped') {
      throw new AppError('ODOO_DISABLED', 'Odoo sync skipped', 'Odoo non abilitato.', 503, false)
    }
    await prisma.pwaOrder.update({
      where: { id: order.id },
      data: { orderStatus: 'SYNCED', odooLastSyncStatus: 'SYNCED', odooLastSyncAt: new Date() },
    })
    return
  }

  const funnelState = funnelStateFromPayload(payload, order)
  const syncStatus = await syncSaleOrderFunnelState(ctx, order.odooSaleOrderId, funnelState)
  if (syncStatus === 'failed') throw new Error('Sync funnel Odoo fallita')
  if (syncStatus === 'skipped') {
    throw new AppError('ODOO_DISABLED', 'Odoo sync skipped', 'Odoo non abilitato.', 503, false)
  }
}

export async function executeEnsurePortalUser(
  ctx: OdooCallContext,
  input: { pwaOrderId?: string | null; odooPartnerId?: number | null; payload: unknown },
): Promise<void> {
  if (isOdooApiV2Configured()) return
  const payload = (input.payload ?? {}) as { email?: string; firstName?: string; lastName?: string }
  let email = payload.email?.toLowerCase().trim() ?? ''
  let partnerId: number | null = input.odooPartnerId ?? null
  let name = displayName(email, {
    firstName: payload.firstName,
    lastName: payload.lastName,
  })

  if (input.pwaOrderId) {
    const order = await loadOrder(input.pwaOrderId)
    email = email || order.email.toLowerCase().trim()
    partnerId = partnerId ?? order.odooPartnerId
    name = displayName(email, asAddress(order.billingAddressJson) ?? asAddress(order.shippingAddressJson))
  }

  if (!email) {
    throw new AppError('EMAIL_REQUIRED', 'Email required', 'Email obbligatoria per il portale Odoo.', 400, false)
  }

  if (partnerId == null) {
    const map = input.odooPartnerId != null
      ? await prisma.odooCustomerMap.findUnique({ where: { odooPartnerId: input.odooPartnerId } })
      : null
    partnerId = map?.odooPartnerId ?? null
  }

  if (!partnerId) {
    const existing = await findOdooPortalUserByEmail(ctx, email)
    if (existing) {
      partnerId = existing.odooPartnerId
      await persistOdooCustomerMap(email, partnerId)
      return
    }
    throw new AppError(
      'ODOO_PARTNER_MISSING',
      'Missing odooPartnerId',
      'Partner Odoo assente: attendere ensure_partner.',
      409,
      true,
    )
  }

  const existing = await findOdooPortalUserByEmail(ctx, email)
  if (existing) {
    await persistOdooCustomerMap(email, partnerId)
    return
  }

  await ensureOdooPortalUser(ctx, {
    email,
    partnerId,
    name,
    password: generateAccountPassword(),
  })
  await persistOdooCustomerMap(email, partnerId)
}

export async function executeSendMail(ctx: OdooCallContext, pwaOrderId: string): Promise<void> {
  if (!env.PWA_ORDER_CONFIRMATION_MAIL) return
  const order = await loadOrder(pwaOrderId)
  const paid = isPaidOrderStatus(order.orderStatus, order.paymentStatus)
  if (!paid) return

  // Template [PWA] Idea di Luce + URL shop (idempotente via metadata pwaMail).
  await orderTransactionalMail.sendOrderConfirmation(order, ctx.correlationId)
  await prisma.pwaOrder.update({
    where: { id: order.id },
    data: { metadataJson: mergeMetadata(order, { orderConfirmationMailAt: new Date().toISOString() }) },
  })
}

export async function executeQueueOperation(
  ctx: OdooCallContext,
  operation: string,
  pwaOrderId: string | null,
  odooPartnerId: number | null,
  payload: unknown,
): Promise<void> {
  switch (operation) {
    case 'ENSURE_PARTNER':
    case 'ensure_partner':
      await executeEnsurePartner(ctx, { pwaOrderId, odooPartnerId, payload })
      return
    case 'ENSURE_SALE_ORDER':
    case 'ensure_sale_order':
      if (!pwaOrderId) {
        throw new AppError('ORDER_REQUIRED', 'Order required', 'ensure_sale_order richiede un ordine PWA.', 409, false)
      }
      await executeEnsureSaleOrder(ctx, pwaOrderId)
      return
    case 'RECONCILE_LINES':
    case 'reconcile_lines':
      if (!pwaOrderId) {
        throw new AppError('ORDER_REQUIRED', 'Order required', 'reconcile_lines richiede un ordine PWA.', 409, false)
      }
      await executeReconcileLines(ctx, pwaOrderId, payload)
      return
    case 'ENSURE_PORTAL_USER':
    case 'ensure_portal_user':
      await executeEnsurePortalUser(ctx, { pwaOrderId, odooPartnerId, payload })
      return
    case 'SEND_MAIL':
    case 'send_mail':
      if (!pwaOrderId) {
        throw new AppError('ORDER_REQUIRED', 'Order required', 'send_mail richiede un ordine PWA.', 409, false)
      }
      await executeSendMail(ctx, pwaOrderId)
      return
    case 'FUNNEL_SYNC':
    case 'funnel_sync':
    default:
      if (!pwaOrderId) {
        throw new AppError('ORDER_REQUIRED', 'Order required', 'funnel_sync richiede un ordine PWA.', 409, false)
      }
      await executeFunnelSync(ctx, pwaOrderId, payload)
  }
}

export async function enqueueOrderOdooSaga(
  pwaOrderId: string,
  opts?: {
    includeMail?: boolean
    includePortal?: boolean
    lastError?: string
  },
): Promise<void> {
  if (!env.ODOO_ENABLED || !isOdooLiveConfigured()) return
  const order = await prisma.pwaOrder.findUnique({ where: { id: pwaOrderId } })
  if (!order) return

  const paid = isPaidOrderStatus(order.orderStatus, order.paymentStatus)
  const meta = (order.metadataJson as Record<string, unknown> | null) ?? {}
  const ops: OdooSyncQueueOperation[] = []
  const apiV2 = isOdooApiV2Configured()

  if (apiV2 || !order.odooPartnerId) ops.push('ensure_partner')
  if (!order.odooSaleOrderId) ops.push('ensure_sale_order')
  if (!apiV2 && (paid || order.odooSaleOrderId)) ops.push('reconcile_lines')
  if (paid) ops.push('funnel_sync')
  const includePortal = !apiV2 && (opts?.includePortal ?? Boolean(order.odooPartnerId || meta.createAccount))
  if (includePortal) ops.push('ensure_portal_user')
  const pwaMailMeta =
    meta.pwaMail && typeof meta.pwaMail === 'object'
      ? (meta.pwaMail as Record<string, unknown>)
      : null
  const confirmationAlreadySent = Boolean(
    meta.orderConfirmationMailAt || pwaMailMeta?.orderConfirmationSentAt,
  )
  const wantMail = opts?.includeMail ?? (paid && !confirmationAlreadySent)
  if (wantMail && env.PWA_ORDER_CONFIRMATION_MAIL) ops.push('send_mail')

  for (const operation of ops) {
    const input: EnqueueOdooSyncInput = {
      pwaOrderId,
      odooPartnerId: order.odooPartnerId,
      operation,
      lastError: opts?.lastError,
      immediate: true,
    }
    await enqueueOdooSyncOperation(input)
  }

  if (paid) {
    void import('../../jobs/odooSyncRetry.job.js')
      .then((mod) => mod.processOdooSyncRetryQueue())
      .catch(() => undefined)
  }
}

export async function enqueueUserOdooSaga(
  odooPartnerId: number,
  payload: { email: string; firstName?: string | null; lastName?: string | null; phone?: string | null },
  lastError?: string,
): Promise<void> {
  if (!env.ODOO_ENABLED || !isOdooLiveConfigured()) return
  await enqueueOdooSyncOperation({
    odooPartnerId,
    operation: 'ensure_partner',
    payload: {
      email: payload.email,
      firstName: payload.firstName ?? undefined,
      lastName: payload.lastName ?? undefined,
      phone: payload.phone ?? undefined,
    },
    lastError,
    immediate: true,
  })
  await enqueueOdooSyncOperation({
    odooPartnerId,
    operation: 'ensure_portal_user',
    payload: {
      email: payload.email,
      firstName: payload.firstName ?? undefined,
      lastName: payload.lastName ?? undefined,
    },
    lastError,
    immediate: true,
  })
}
