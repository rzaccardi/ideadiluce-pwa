import type { PwaOrder, Prisma } from '@prisma/client'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { createOdooOrderAdapter } from '../../adapters/odoo/odooOrderAdapter.js'
import {
  ensureOdooPortalUser,
  findOdooPortalUserByEmail,
} from '../../adapters/odoo/odooPortalUserAdapter.js'
import { registerPayment } from '../../adapters/odoo/odooPaymentLive.js'
import { sendPwaMail } from '../../adapters/odoo/odooMailAdapter.js'
import { syncSaleOrderFunnelState, type OdooFunnelState } from '../../adapters/odoo/odooFunnelSync.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'
import { generateAccountPassword } from '../../lib/generate-password.js'
import { publicAppUrl } from '../../lib/mail.js'
import { prisma } from '../../lib/prisma.js'
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

async function persistOdooCustomerMap(userId: string, email: string, odooPartnerId: number) {
  const emailLower = email.toLowerCase().trim()
  await prisma.odooCustomerMap.upsert({
    where: { userId },
    create: {
      userId,
      odooPartnerId,
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
      guestEmail: emailLower,
    },
    update: {
      odooPartnerId,
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
  input: { pwaOrderId?: string | null; userId?: string | null; payload: unknown },
): Promise<void> {
  const payload = (input.payload ?? {}) as {
    email?: string
    firstName?: string
    lastName?: string
    phone?: string
  }

  if (input.pwaOrderId) {
    const order = await loadOrder(input.pwaOrderId)
    if (order.odooPartnerId) return
    const billing = asAddress(order.billingAddressJson)
    const partner = await customerAdapter.findOrCreateCustomer(ctx, {
      email: payload.email ?? order.email,
      firstName: payload.firstName ?? billing?.firstName,
      lastName: payload.lastName ?? billing?.lastName,
      phone: payload.phone ?? billing?.phone,
    })
    await prisma.pwaOrder.update({
      where: { id: order.id },
      data: { odooPartnerId: partner.odooPartnerId },
    })
    if (order.userId) {
      await persistOdooCustomerMap(order.userId, order.email, partner.odooPartnerId)
    }
    return
  }

  if (!input.userId) {
    throw new AppError('SYNC_TARGET_MISSING', 'Missing user', 'Manca utente per sync partner.', 409, false)
  }
  const user = await prisma.user.findUnique({ where: { id: input.userId } })
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false)
  }
  const existingMap = await prisma.odooCustomerMap.findUnique({ where: { userId: user.id } })
  if (existingMap?.odooPartnerId) return

  const partner = await customerAdapter.findOrCreateCustomer(ctx, {
    email: payload.email ?? user.email,
    firstName: payload.firstName ?? user.firstName,
    lastName: payload.lastName ?? user.lastName,
    phone: payload.phone ?? user.phone,
  })
  await persistOdooCustomerMap(user.id, user.email, partner.odooPartnerId)
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

  const result = await orderAdapter.syncSaleOrderDraft(ctx, {
    odooPartnerId: order.odooPartnerId,
    odooSaleOrderId: order.odooSaleOrderId,
    pwaOrderId: order.id,
    clientOrderRef: order.clientOrderRef ?? `PWA ${order.id}`,
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
    await orderAdapter.reconcileSaleOrderLines(ctx, order.odooSaleOrderId, data.lines, data.shippingLine ?? null)
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
      method: order.paymentMethod === 'BANK_TRANSFER' ? 'bank_transfer' : 'stripe',
      amountCents: order.amountTotal ?? 0,
      transactionId: order.providerTransactionId,
      status: 'captured',
    })
    if (result === 'failed') throw new Error('Registrazione pagamento Odoo fallita')
    if (result === 'skipped') {
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
  input: { pwaOrderId?: string | null; userId?: string | null; payload: unknown },
): Promise<void> {
  const payload = (input.payload ?? {}) as { email?: string; firstName?: string; lastName?: string }
  let email = payload.email?.toLowerCase().trim() ?? ''
  let partnerId: number | null = null
  let name = displayName(email, {
    firstName: payload.firstName,
    lastName: payload.lastName,
  })
  let userId = input.userId ?? null

  if (input.pwaOrderId) {
    const order = await loadOrder(input.pwaOrderId)
    email = email || order.email.toLowerCase().trim()
    partnerId = order.odooPartnerId
    userId = userId ?? order.userId
    name = displayName(email, asAddress(order.billingAddressJson) ?? asAddress(order.shippingAddressJson))
  }

  if (!email) {
    throw new AppError('EMAIL_REQUIRED', 'Email required', 'Email obbligatoria per il portale Odoo.', 400, false)
  }

  if (!partnerId && userId) {
    const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })
    partnerId = map?.odooPartnerId ?? null
  }

  if (!partnerId) {
    const existing = await findOdooPortalUserByEmail(ctx, email)
    if (existing) {
      partnerId = existing.odooPartnerId
      if (userId) await persistOdooCustomerMap(userId, email, partnerId)
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
    if (userId) await persistOdooCustomerMap(userId, email, partnerId)
    return
  }

  await ensureOdooPortalUser(ctx, {
    email,
    partnerId,
    name,
    password: generateAccountPassword(),
  })
  if (userId) await persistOdooCustomerMap(userId, email, partnerId)
}

export async function executeSendMail(ctx: OdooCallContext, pwaOrderId: string): Promise<void> {
  const order = await loadOrder(pwaOrderId)
  const meta = (order.metadataJson as Record<string, unknown> | null) ?? {}
  if (meta.orderConfirmationMailAt) return

  const paid = isPaidOrderStatus(order.orderStatus, order.paymentStatus)
  if (!paid) return

  const billing = asAddress(order.billingAddressJson)
  const amount =
    order.amountTotal != null
      ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: order.currencyCode || 'EUR' }).format(
          order.amountTotal / 100,
        )
      : ''
  const orderNumber = order.clientOrderRef?.trim() || order.id
  await sendPwaMail(ctx, {
    templateKey: 'order_confirmation',
    emailTo: order.email,
    vars: {
      first_name_suffix: billing?.firstName ? ` ${billing.firstName}` : '',
      order_number: orderNumber,
      amount,
      order_url: publicAppUrl(`/account/orders/${order.id}`),
    },
  })
  await prisma.pwaOrder.update({
    where: { id: order.id },
    data: { metadataJson: mergeMetadata(order, { orderConfirmationMailAt: new Date().toISOString() }) },
  })
}

export async function executeQueueOperation(
  ctx: OdooCallContext,
  operation: string,
  pwaOrderId: string | null,
  userId: string | null,
  payload: unknown,
): Promise<void> {
  switch (operation) {
    case 'ENSURE_PARTNER':
    case 'ensure_partner':
      await executeEnsurePartner(ctx, { pwaOrderId, userId, payload })
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
      await executeEnsurePortalUser(ctx, { pwaOrderId, userId, payload })
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
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return
  const order = await prisma.pwaOrder.findUnique({ where: { id: pwaOrderId } })
  if (!order) return

  const paid = isPaidOrderStatus(order.orderStatus, order.paymentStatus)
  const meta = (order.metadataJson as Record<string, unknown> | null) ?? {}
  const ops: OdooSyncQueueOperation[] = []

  if (!order.odooPartnerId) ops.push('ensure_partner')
  if (!order.odooSaleOrderId) ops.push('ensure_sale_order')
  if (paid || order.odooSaleOrderId) ops.push('reconcile_lines')
  if (paid) ops.push('funnel_sync')
  const includePortal = opts?.includePortal ?? Boolean(order.userId || meta.createAccount)
  if (includePortal) ops.push('ensure_portal_user')
  const includeMail = opts?.includeMail ?? (paid && !meta.orderConfirmationMailAt)
  if (includeMail) ops.push('send_mail')

  for (const operation of ops) {
    const input: EnqueueOdooSyncInput = {
      pwaOrderId,
      userId: order.userId,
      operation,
      lastError: opts?.lastError,
      immediate: true,
    }
    await enqueueOdooSyncOperation(input)
  }
}

export async function enqueueUserOdooSaga(
  userId: string,
  payload: { email: string; firstName?: string | null; lastName?: string | null; phone?: string | null },
  lastError?: string,
): Promise<void> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return
  await enqueueOdooSyncOperation({
    userId,
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
    userId,
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
