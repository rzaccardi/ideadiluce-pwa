import type { Prisma, PwaOrder, CustomerSegment } from '@prisma/client'
import type { Request } from 'express'
import { createHash } from 'node:crypto'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { createOdooOrderAdapter } from '../../adapters/odoo/odooOrderAdapter.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'
import { isOdooConfigured } from '../../adapters/odoo/odooClient.js'
import { syncCartContactEmail } from '../cart/cart-contact.service.js'
import {
  buildCheckoutPriceSnapshot,
  saveCheckoutPriceSnapshot,
} from '../cart/cart-price-freeze.service.js'
import { paymentMethodToDTO, paymentMethodToPrisma } from '../payments/payment.types.js'
import { subtotalCentsFromCartItems } from '../cart/cartTotals.js'
import type { TestCheckoutAddressInput } from '../integrations/integrations.validators.js'
import type { CheckoutStartDTO, PwaPaymentMethodDTO } from '../../types/dto.js'
import {
  ACTIVE_DRAFT_ORDER_STATUSES,
  PRICE_LOCKED_ORDER_STATUSES,
  type CheckoutFiscalInput,
  type CheckoutOrderLinesSnapshot,
} from './checkout-order.types.js'
import { syncSaleOrderFunnelState } from '../../adapters/odoo/odooFunnelSync.js'
import { writeIntegrationLog } from '../../lib/integration-log.js'
import { taxService } from '../tax/tax.service.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'

const customerAdapter = createOdooCustomerAdapter()
const orderAdapter = createOdooOrderAdapter()

export function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

export function buildCheckoutIdempotencyKey(sessionId: string, cartUpdatedAt: Date): string {
  const hash = createHash('sha256')
    .update(`${sessionId}:${cartUpdatedAt.toISOString()}`)
    .digest('hex')
    .slice(0, 32)
  return `chk_${hash}`
}

export function resolveIdempotencyKey(
  req: Request,
  bodyKey?: string | null,
  cartUpdatedAt?: Date | null,
): string | null {
  const header = req.headers['idempotency-key']
  const fromHeader = typeof header === 'string' ? header.trim() : null
  const fromBody = bodyKey?.trim() || null
  if (fromHeader) return fromHeader
  if (fromBody) return fromBody
  if (cartUpdatedAt) {
    const sessionId = req.sessionRecord?.id
    if (sessionId) return buildCheckoutIdempotencyKey(sessionId, cartUpdatedAt)
  }
  return null
}

export function buildLinesSnapshot(
  cart: Parameters<typeof buildCheckoutPriceSnapshot>[0],
): CheckoutOrderLinesSnapshot {
  const priceSnapshot = buildCheckoutPriceSnapshot(cart)
  return {
    lockedAt: new Date().toISOString(),
    currencyCode: cart.currencyCode,
    items: priceSnapshot.items.map((line) => ({
      ...line,
      lineTotalCents: line.unitPriceCents * line.quantity,
    })),
    estimatedSubtotal: priceSnapshot.estimatedSubtotal,
    estimatedTax: priceSnapshot.estimatedTax,
    estimatedShipping: priceSnapshot.estimatedShipping,
    estimatedTotal: priceSnapshot.estimatedTotal,
  }
}

export async function isCartCheckoutPriceLocked(cartId: string): Promise<boolean> {
  const order = await prisma.pwaOrder.findFirst({
    where: {
      cartId,
      orderStatus: { in: [...PRICE_LOCKED_ORDER_STATUSES] },
    },
    select: { id: true },
  })
  return order != null
}

export async function findReusableCheckoutOrder(cartId: string, idempotencyKey?: string | null) {
  if (idempotencyKey) {
    const byKey = await prisma.pwaOrder.findUnique({ where: { idempotencyKey } })
    if (byKey && byKey.cartId === cartId) return byKey
  }
  return prisma.pwaOrder.findFirst({
    where: {
      cartId,
      orderStatus: { in: [...ACTIVE_DRAFT_ORDER_STATUSES] },
    },
    orderBy: { createdAt: 'desc' },
  })
}

type DraftSyncInput = {
  email: string
  billingAddress: TestCheckoutAddressInput
  shippingAddress: TestCheckoutAddressInput
  dropshipAddress?: TestCheckoutAddressInput | null
  clientOrderRef?: string | null
  orderNotes?: string | null
  courierNotes?: string | null
  paymentMethod?: PwaPaymentMethodDTO | null
  fiscal?: CheckoutFiscalInput | null
  customerSegment?: CustomerSegment | null
  isProfessional?: boolean | null
  vatValidated?: boolean | null
  vatForceAccepted?: boolean | null
  createAccount?: boolean
  idempotencyKey?: string | null
  lockPrices?: boolean
  requireShipping?: boolean
}

export async function syncCheckoutDraftOrder(
  req: Request,
  cart: Awaited<ReturnType<typeof loadActiveCart>>,
  input: DraftSyncInput,
  options?: { existingOrder?: PwaOrder | null; orderStatus?: PwaOrder['orderStatus'] },
): Promise<{ order: PwaOrder; checkoutSessionId: string }> {
  const s = req.sessionRecord
  if (!s) throw new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile.', 500, false)

  const ctx: OdooCallContext = { correlationId: req.correlationId, req }
  const shippingSel = cart.shippingSelection ?? null
  if (input.requireShipping && !shippingSel) {
    throw new AppError(
      'SHIPPING_REQUIRED',
      'Shipping not selected',
      'Seleziona un metodo di spedizione.',
      400,
      false,
    )
  }
  const cartForTotals = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: true, shippingSelection: true },
  })
  if (!cartForTotals) {
    throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
  }

  const pricing = await resolvePricingContext(req)
  const segment =
    input.customerSegment ?? (input.isProfessional ? 'PROFESSIONAL' : pricing.segment)
  const subtotal = subtotalCentsFromCartItems(cartForTotals.items) ?? 0
  const shippingCents = shippingSel?.amountCents ?? cartForTotals.estimatedShipping ?? 0
  const vatValidForTax = input.vatForceAccepted ? false : (input.vatValidated ?? null)
  const taxOrder = await taxService.calculateForOrder({
    netCents: subtotal,
    billingCountry: input.billingAddress.country,
    shippingCountry: input.shippingAddress.country,
    customerSegment: segment,
    isProfessional: input.isProfessional ?? segment === 'PROFESSIONAL',
    vatValid: vatValidForTax,
    vatForceAccepted: input.vatForceAccepted ?? false,
  })

  await prisma.cart.update({
    where: { id: cartForTotals.id },
    data: {
      estimatedSubtotal: subtotal,
      estimatedTax: taxOrder.taxCents,
      estimatedShipping: shippingCents,
      estimatedTotal: subtotal + taxOrder.taxCents + shippingCents,
      lastPricedAt: new Date(),
    },
  })

  const cartPriced = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: true, shippingSelection: true },
  })
  if (!cartPriced) {
    throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
  }

  const total = subtotal + taxOrder.taxCents + shippingCents
  const taxMeta = {
    estimatedTax: taxOrder.taxCents,
    taxRatePct: taxOrder.taxRatePct,
    taxLabel: taxOrder.taxLabel,
    disclaimerKey: taxOrder.disclaimerKey,
    odooFiscalPositionId: taxOrder.odooFiscalPositionId,
    vatForceAccepted: input.vatForceAccepted ?? false,
  }
  const priceSnapshot = buildCheckoutPriceSnapshot(cartPriced, taxMeta)
  const idempotencyKey = input.idempotencyKey ?? null

  const fiscalPayload: CheckoutFiscalInput = {
    vatNumber: input.fiscal?.vatNumber ?? null,
    fiscalPositionId: taxOrder.odooFiscalPositionId ?? null,
    vatWarningForced: input.fiscal?.vatWarningForced ?? input.vatForceAccepted ?? false,
    viesName: input.fiscal?.viesName ?? null,
    viesAddress: input.fiscal?.viesAddress ?? null,
    viesValid: input.fiscal?.viesValid ?? null,
    viesRequestDate: input.fiscal?.viesRequestDate ?? null,
  }

  const partner = await customerAdapter.findOrCreateCustomer(ctx, {
    email: input.email,
    firstName: input.billingAddress.firstName,
    lastName: input.billingAddress.lastName,
    phone: input.billingAddress.phone,
  })

  let existing = options?.existingOrder ?? (await findReusableCheckoutOrder(cart.id, idempotencyKey))

  let orderId = existing?.id
  if (!orderId) {
    const stub = await prisma.pwaOrder.create({
      data: {
        cartId: cart.id,
        userId: s.userId ?? null,
        sessionId: s.id,
        email: input.email,
        orderStatus: options?.orderStatus ?? 'DRAFT',
        currencyCode: cart.currencyCode,
        idempotencyKey: idempotencyKey ?? undefined,
      },
    })
    orderId = stub.id
    existing = stub
  }

  if (!existing) {
    throw new AppError('ORDER_CREATE_FAILED', 'Order create failed', 'Impossibile creare ordine.', 500, false)
  }

  const orderRow = existing

  let odooSaleOrderId = orderRow.odooSaleOrderId ?? null

  const draftPayload = {
    odooPartnerId: partner.odooPartnerId,
    odooSaleOrderId,
    pwaOrderId: orderId,
    clientOrderRef: input.clientOrderRef ?? orderRow.clientOrderRef ?? undefined,
    orderNotes: input.orderNotes ?? orderRow.orderNotes ?? undefined,
    courierNotes: input.courierNotes ?? orderRow.courierNotes ?? undefined,
    paymentMethod:
      input.paymentMethod ??
      (orderRow.paymentMethod ? paymentMethodToDTO(orderRow.paymentMethod) : null),
    billingAddress: input.billingAddress,
    shippingAddress: input.shippingAddress,
    dropshipAddress: input.dropshipAddress ?? undefined,
    fiscal: fiscalPayload,
    currencyCode: cart.currencyCode,
    lines: cart.items.map((i) => ({
      productRef: i.productRef,
      variantRef: i.variantRef,
      quantity: i.quantity,
      unitPriceCents: i.clientUnitPriceEstimate ?? undefined,
    })),
    shippingLine: shippingSel
      ? {
          label: shippingSel.label,
          amountCents: shippingSel.amountCents,
          carrierCode: shippingSel.carrierCode,
          serviceCode: shippingSel.serviceCode,
        }
      : null,
  }

  if (env.ODOO_ENABLED && isOdooConfigured()) {
    try {
      const orderResult = await orderAdapter.syncSaleOrderDraft(ctx, draftPayload)
      odooSaleOrderId = orderResult.odooSaleOrderId
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      void writeIntegrationLog({
        service: 'odoo',
        operation: 'checkout_draft_sync',
        correlationId: req.correlationId,
        success: false,
        statusCode: input.lockPrices ? 503 : 502,
        requestRedacted: {
          pwaOrderId: orderId,
          cartId: cart.id,
          step: input.lockPrices ? 'lock' : 'draft',
        },
        responseRedacted: { message },
        startedAt: new Date(),
        finishedAt: new Date(),
      })
      if (input.lockPrices) {
        throw new AppError(
          'ODOO_UNAVAILABLE',
          'Odoo unavailable',
          'Il sistema ordini non è momentaneamente disponibile. Riprova tra qualche minuto.',
          503,
          true,
        )
      }
    }
  }

  const checkoutSession =
    orderRow.checkoutSessionId
      ? await prisma.checkoutSession.update({
          where: { id: orderRow.checkoutSessionId },
          data: {
            email: input.email,
            odooPartnerId: partner.odooPartnerId,
            odooSaleOrderId,
            shippingMethodRef: shippingSel?.methodRef ?? null,
            billingAddressJson: input.billingAddress as object,
            shippingAddressJson: input.shippingAddress as object,
            priceSnapshotJson: priceSnapshot,
          },
        })
      : await prisma.checkoutSession.create({
          data: {
            cartId: cart.id,
            email: input.email,
            state: 'COMMITTED',
            userId: s.userId ?? undefined,
            odooPartnerId: partner.odooPartnerId,
            odooSaleOrderId,
            shippingMethodRef: shippingSel?.methodRef ?? null,
            billingAddressJson: input.billingAddress as object,
            shippingAddressJson: input.shippingAddress as object,
            priceSnapshotJson: priceSnapshot,
            expiresAt: new Date(Date.now() + 86400000),
          },
        })

  const lockPrices = Boolean(input.lockPrices)
  const linesSnapshot = lockPrices ? buildLinesSnapshot(cartPriced) : null

  const orderStatus =
    options?.orderStatus ??
    (lockPrices ? 'CHECKOUT_LOCKED' : orderRow.orderStatus ?? 'DRAFT')

  const createAccount = Boolean(input.createAccount) && !s.userId
  const metadataJson = jsonValue({
    ...((orderRow.metadataJson as Record<string, unknown> | null) ?? {}),
    createAccount,
    ...(createAccount ? {} : { guestAccountCreated: undefined }),
    taxDisclaimerKey: taxOrder.disclaimerKey ?? null,
    taxLabel: taxOrder.taxLabel,
    taxCents: taxOrder.taxCents,
  })

  const order = await prisma.pwaOrder.update({
    where: { id: orderId },
    data: {
      cartId: cart.id,
      checkoutSessionId: checkoutSession.id,
      userId: s.userId ?? null,
      sessionId: s.id,
      email: input.email,
      orderStatus,
      paymentStatus: orderRow.paymentStatus ?? 'NOT_STARTED',
      currencyCode: cart.currencyCode,
      amountTotal: total,
      billingAddressJson: jsonValue(input.billingAddress),
      shippingAddressJson: jsonValue(input.shippingAddress),
      dropshipAddressJson: input.dropshipAddress ? jsonValue(input.dropshipAddress) : undefined,
      clientOrderRef: input.clientOrderRef?.trim() || orderRow.clientOrderRef || null,
      orderNotes: input.orderNotes?.trim() || orderRow.orderNotes || null,
      courierNotes: input.courierNotes?.trim() || orderRow.courierNotes || null,
      fiscalJson: jsonValue(fiscalPayload),
      linesSnapshotJson: linesSnapshot ? jsonValue(linesSnapshot) : orderRow.linesSnapshotJson ?? undefined,
      odooPartnerId: partner.odooPartnerId,
      odooSaleOrderId,
      checkoutStartedAt: orderRow.checkoutStartedAt ?? new Date(),
      metadataJson,
      idempotencyKey: idempotencyKey ?? orderRow.idempotencyKey ?? undefined,
      paymentMethod: input.paymentMethod
        ? paymentMethodToPrisma(input.paymentMethod)
        : orderRow.paymentMethod,
    },
  })

  if (lockPrices) {
    await saveCheckoutPriceSnapshot(checkoutSession.id, cartPriced, taxMeta)
  }

  await syncCartContactEmail(cart.id)

  if (odooSaleOrderId) {
    await syncSaleOrderFunnelState(ctx, odooSaleOrderId, {
      pwaOrderId: order.id,
      orderStatus: orderStatus.toLowerCase(),
      paymentStatus: 'not_started',
      paymentMethod: input.paymentMethod ?? null,
      cartId: cart.id,
      sessionId: s.id,
    })
  }

  return { order, checkoutSessionId: checkoutSession.id }
}

export async function loadActiveCart(req: Request) {
  const s = req.sessionRecord
  if (!s) throw new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile.', 500, false)
  const cart = await prisma.cart.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [{ sessionId: s.id }, ...(s.userId ? [{ userId: s.userId }] : [])],
    },
    include: { items: true, shippingSelection: true },
    orderBy: { updatedAt: 'desc' },
  })
  if (!cart) throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
  if (cart.items.length === 0) throw new AppError('EMPTY_CART', 'Cart empty', 'Il carrello è vuoto.', 400, false)
  return cart
}

export function mapCheckoutStart(order: PwaOrder, checkoutSessionId: string): CheckoutStartDTO {
  return {
    orderId: order.id,
    checkoutSessionId,
    cartId: order.cartId,
    odooSaleOrderId: order.odooSaleOrderId,
    orderStatus: order.orderStatus.toLowerCase() as CheckoutStartDTO['orderStatus'],
    paymentStatus: order.paymentStatus.toLowerCase() as CheckoutStartDTO['paymentStatus'],
    currencyCode: order.currencyCode,
    amountTotal: order.amountTotal,
  }
}

export async function assertOrderAccess(req: Request, orderId: string) {
  const s = req.sessionRecord
  if (!s) throw new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile.', 500, false)
  const order = await prisma.pwaOrder.findFirst({
    where: {
      id: orderId,
      OR: [{ sessionId: s.id }, ...(s.userId ? [{ userId: s.userId }] : [])],
    },
    include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  if (!order) throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
  return order
}
