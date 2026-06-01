import type { Prisma, PwaOrder, PwaPayment } from '@prisma/client'
import type { Request } from 'express'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import type {
  CheckoutStartDTO,
  PaymentConfirmDTO,
  PaymentSessionDTO,
  PwaOrderStatusResponseDTO,
} from '../../types/dto.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { createOdooOrderAdapter } from '../../adapters/odoo/odooOrderAdapter.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { syncSaleOrderFunnelState } from '../../adapters/odoo/odooFunnelSync.js'
import { createProviderPaymentSession } from '../../adapters/payments/paymentProviderAdapter.js'
import type { StripeLineItemInput } from '../../adapters/payments/stripeCheckoutAdapter.js'
import { shippingService } from '../shipping/shipping.service.js'
import { catalogRepository } from '../catalog/catalog.repository.js'
import { repriceCartFromOdoo } from '../catalog/odooPricing.service.js'
import { checkCartStock } from '../../adapters/odoo/odooInventoryAdapter.js'
import { env } from '../../config/env.js'
import type {
  CheckoutStartBody,
  ConfirmPaymentBody,
  CreatePaymentSessionBody,
} from './payments.validators.js'
import {
  orderStatusToDTO,
  paymentMethodToDTO,
  paymentMethodToPrisma,
  paymentStatusToDTO,
} from './payment.types.js'

const customerAdapter = createOdooCustomerAdapter()
const orderAdapter = createOdooOrderAdapter()

function assertSession(req: Request) {
  const s = req.sessionRecord
  if (!s) throw new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile.', 500, false)
  return s
}

async function activeCartForRequest(req: Request) {
  const s = assertSession(req)
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

function totalFromCart(cart: {
  estimatedTotal: number | null
  estimatedSubtotal: number | null
  estimatedTax: number | null
  estimatedShipping: number | null
  items: Array<{ quantity: number; clientUnitPriceEstimate: number | null }>
}) {
  if (cart.estimatedTotal != null) return cart.estimatedTotal
  const subtotal = cart.items.reduce((sum, item) => sum + (item.clientUnitPriceEstimate ?? 0) * item.quantity, 0)
  const tax = cart.estimatedTax ?? Math.round(subtotal * 0.22)
  const shipping = cart.estimatedShipping ?? 0
  return subtotal + tax + shipping
}

async function stripeLineItemsForOrder(
  req: Request,
  cart: Awaited<ReturnType<typeof activeCartForRequest>>,
  currencyCode: string,
): Promise<StripeLineItemInput[]> {
  const lines: StripeLineItemInput[] = []
  for (const item of cart.items) {
    const p = await catalogRepository.findProductBySlug(req.correlationId, item.productRef)
    const unit = item.clientUnitPriceEstimate ?? p?.priceCents ?? 0
    if (unit <= 0) continue
    lines.push({
      name: p?.name ?? item.productRef,
      amountCents: unit,
      quantity: item.quantity,
      currencyCode,
      metadata: {
        product_ref: item.productRef,
        variant_ref: item.variantRef ?? '',
      },
    })
  }
  const ship = cart.shippingSelection
  if (ship && ship.amountCents > 0) {
    lines.push({
      name: `Spedizione — ${ship.label}`,
      amountCents: ship.amountCents,
      quantity: 1,
      currencyCode: ship.currencyCode,
      metadata: {
        shipping_method_ref: ship.methodRef,
        carrier_code: ship.carrierCode,
        service_code: ship.serviceCode,
      },
    })
  }
  return lines
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

async function assertOrderAccess(req: Request, orderId: string) {
  const s = assertSession(req)
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

async function syncOrderToOdoo(ctx: OdooCallContext, order: PwaOrder) {
  const syncStatus = await syncSaleOrderFunnelState(ctx, order.odooSaleOrderId, {
    pwaOrderId: order.id,
    orderStatus: orderStatusToDTO(order.orderStatus),
    paymentStatus: paymentStatusToDTO(order.paymentStatus),
    paymentMethod: order.paymentMethod ? paymentMethodToDTO(order.paymentMethod) : null,
    cartId: order.cartId,
    sessionId: order.sessionId,
    abandonedAt: order.abandonedAt,
    lastPaymentError: order.lastPaymentError,
    providerTransactionId: order.providerTransactionId,
  })
  if (syncStatus !== 'skipped') {
    await prisma.pwaOrder.update({
      where: { id: order.id },
      data: {
        odooLastSyncAt: new Date(),
        odooLastSyncStatus: syncStatus === 'synced' ? 'SYNCED' : 'FAILED',
      },
    })
  }
}

function mapCheckoutStart(order: PwaOrder, checkoutSessionId: string): CheckoutStartDTO {
  return {
    orderId: order.id,
    checkoutSessionId,
    cartId: order.cartId,
    odooSaleOrderId: order.odooSaleOrderId,
    orderStatus: orderStatusToDTO(order.orderStatus),
    paymentStatus: paymentStatusToDTO(order.paymentStatus),
    currencyCode: order.currencyCode,
    amountTotal: order.amountTotal,
  }
}

function mapPaymentSession(payment: PwaPayment): PaymentSessionDTO {
  return {
    paymentId: payment.id,
    orderId: payment.orderId,
    method: paymentMethodToDTO(payment.method),
    status: paymentStatusToDTO(payment.status),
    provider: payment.provider,
    amount: payment.amount,
    currencyCode: payment.currencyCode,
    redirectUrl: payment.redirectUrl,
    clientSecret: payment.clientSecret,
    instructions: payment.instructionsJson as Record<string, unknown> | null,
  }
}

function mapOrderStatus(order: PwaOrder): PwaOrderStatusResponseDTO {
  return {
    orderId: order.id,
    cartId: order.cartId,
    odooSaleOrderId: order.odooSaleOrderId,
    orderStatus: orderStatusToDTO(order.orderStatus),
    paymentStatus: paymentStatusToDTO(order.paymentStatus),
    paymentMethod: order.paymentMethod ? paymentMethodToDTO(order.paymentMethod) : null,
    amountTotal: order.amountTotal,
    currencyCode: order.currencyCode,
    lastPaymentError: order.lastPaymentError,
  }
}

export const paymentsService = {
  async startCheckout(req: Request, body: CheckoutStartBody): Promise<CheckoutStartDTO> {
    const s = assertSession(req)
    const cart = await activeCartForRequest(req)
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    await repriceCartFromOdoo(req, cart.id)
    const cartFresh = await activeCartForRequest(req)
    const stock = await checkCartStock(
      ctx,
      cartFresh.items.map((i) => ({
        productRef: i.productRef,
        variantRef: i.variantRef,
        quantity: i.quantity,
      })),
    )
    if (!stock.ok) {
      const first = stock.insufficient[0]
      throw new AppError(
        'STOCK_UNAVAILABLE',
        'Insufficient stock',
        first
          ? `Disponibilità insufficiente per ${first.productRef} (richiesti ${first.requested}, disponibili ${first.available}).`
          : 'Prodotto non disponibile.',
        409,
        false,
        { insufficient: stock.insufficient },
      )
    }
    const shippingSel = await shippingService.requireSelection(cartFresh.id)
    const total = totalFromCart(cartFresh)

    const partner = await customerAdapter.findOrCreateCustomer(ctx, {
      email: body.email,
      firstName: body.billingAddress.firstName,
      lastName: body.billingAddress.lastName,
      phone: body.billingAddress.phone,
    })

    const existing = await prisma.pwaOrder.findFirst({
      where: {
        cartId: cartFresh.id,
        orderStatus: { in: ['CART_CREATED', 'CHECKOUT_STARTED', 'PAYMENT_STARTED', 'PAYMENT_PENDING', 'PAYMENT_FAILED'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    let odooSaleOrderId = existing?.odooSaleOrderId ?? null
    if (!odooSaleOrderId) {
      const order = await orderAdapter.createOrUpdateSaleOrder(ctx, {
        odooPartnerId: partner.odooPartnerId,
        currencyCode: cartFresh.currencyCode,
        lines: cartFresh.items.map((i) => ({
          productRef: i.productRef,
          variantRef: i.variantRef,
          quantity: i.quantity,
          unitPriceCents: i.clientUnitPriceEstimate ?? undefined,
        })),
        shippingLine: {
          label: shippingSel.label,
          amountCents: shippingSel.amountCents,
          carrierCode: shippingSel.carrierCode,
          serviceCode: shippingSel.serviceCode,
        },
      })
      odooSaleOrderId = order.odooSaleOrderId
    }

    const checkoutSession =
      existing?.checkoutSessionId
        ? await prisma.checkoutSession.update({
            where: { id: existing.checkoutSessionId },
            data: {
              email: body.email,
              odooPartnerId: partner.odooPartnerId,
              odooSaleOrderId,
              shippingMethodRef: shippingSel.methodRef,
              billingAddressJson: body.billingAddress as object,
              shippingAddressJson: body.shippingAddress as object,
            },
          })
        : await prisma.checkoutSession.create({
            data: {
              cartId: cartFresh.id,
              email: body.email,
              state: 'COMMITTED',
              userId: s.userId ?? undefined,
              odooPartnerId: partner.odooPartnerId,
              odooSaleOrderId,
              shippingMethodRef: shippingSel.methodRef,
              billingAddressJson: body.billingAddress as object,
              shippingAddressJson: body.shippingAddress as object,
              expiresAt: new Date(Date.now() + 86400000),
            },
          })

    const data = {
      cartId: cartFresh.id,
      checkoutSessionId: checkoutSession.id,
      userId: s.userId ?? null,
      sessionId: s.id,
      email: body.email,
      orderStatus: 'CHECKOUT_STARTED' as const,
      paymentStatus: 'NOT_STARTED' as const,
      currencyCode: cartFresh.currencyCode,
      amountTotal: total,
      billingAddressJson: jsonValue(body.billingAddress),
      shippingAddressJson: jsonValue(body.shippingAddress),
      odooPartnerId: partner.odooPartnerId,
      odooSaleOrderId,
      checkoutStartedAt: new Date(),
    }

    const order = existing
      ? await prisma.pwaOrder.update({ where: { id: existing.id }, data })
      : await prisma.pwaOrder.create({ data })

    await syncOrderToOdoo(ctx, order)
    return mapCheckoutStart(order, checkoutSession.id)
  },

  async createPaymentSession(req: Request, body: CreatePaymentSessionBody): Promise<PaymentSessionDTO> {
    const order = await assertOrderAccess(req, body.orderId)
    const cart = await prisma.cart.findUnique({
      where: { id: order.cartId },
      include: { items: true, shippingSelection: true },
    })
    if (!cart) throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
    await shippingService.requireSelection(cart.id)
    await repriceCartFromOdoo(req, cart.id)
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const stock = await checkCartStock(
      ctx,
      cart.items.map((i) => ({
        productRef: i.productRef,
        variantRef: i.variantRef,
        quantity: i.quantity,
      })),
    )
    if (!stock.ok) {
      throw new AppError(
        'STOCK_UNAVAILABLE',
        'Insufficient stock',
        'Uno o più prodotti non sono più disponibili. Aggiorna il carrello.',
        409,
        false,
      )
    }
    const cartPriced = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: true, shippingSelection: true },
    })
    if (!cartPriced) throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
    const pricedTotal = totalFromCart(cartPriced)
    if (pricedTotal !== (order.amountTotal ?? 0)) {
      await prisma.pwaOrder.update({
        where: { id: order.id },
        data: { amountTotal: pricedTotal },
      })
      order.amountTotal = pricedTotal
    }
    if (['PAID', 'CONFIRMED', 'COMPLETED'].includes(order.orderStatus)) {
      throw new AppError('PAYMENT_ALREADY_COMPLETED', 'Already paid', 'Pagamento già completato.', 409, false)
    }

    const method = paymentMethodToPrisma(body.paymentMethod)
    const active = await prisma.pwaPayment.findFirst({
      where: {
        orderId: order.id,
        method,
        status: { in: ['CREATED', 'PENDING', 'AUTHORIZED'] },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (active) return mapPaymentSession(active)

    const amount = order.amountTotal ?? pricedTotal
    if (amount <= 0) {
      throw new AppError('PAYMENT_AMOUNT_INVALID', 'Invalid amount', 'Importo ordine non valido.', 409, false)
    }

    const payment = await prisma.pwaPayment.create({
      data: {
        orderId: order.id,
        method,
        status: 'CREATED',
        provider: 'pending',
        amount,
        currencyCode: order.currencyCode,
      },
    })

    const stripeLines =
      body.paymentMethod === 'stripe'
        ? await stripeLineItemsForOrder(req, cartPriced, order.currencyCode)
        : undefined

    const provider = await createProviderPaymentSession({
      orderId: order.id,
      pwaPaymentId: payment.id,
      cartId: cart.id,
      odooSaleOrderId: order.odooSaleOrderId,
      method: body.paymentMethod,
      amount,
      currencyCode: order.currencyCode,
      email: order.email,
      correlationId: req.correlationId,
      lineItems: stripeLines,
    })

    const paymentStatus = provider.status === 'pending' ? 'PENDING' : 'CREATED'
    const orderStatus = provider.status === 'pending' ? 'PAYMENT_PENDING' : 'PAYMENT_STARTED'

    const paymentRecord = await prisma.pwaPayment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        provider: provider.provider,
        providerSessionId: provider.providerSessionId,
        providerTransactionId: provider.providerTransactionId,
        redirectUrl: provider.redirectUrl ?? null,
        clientSecret: provider.clientSecret ?? null,
        instructionsJson: provider.instructions ? jsonValue(provider.instructions) : undefined,
        rawProviderJson: provider.raw ? jsonValue(provider.raw) : undefined,
      },
    })

    const updated = await prisma.pwaOrder.update({
      where: { id: order.id },
      data: {
        orderStatus,
        paymentStatus,
        paymentMethod: method,
        providerTransactionId: provider.providerTransactionId ?? null,
        paymentStartedAt: new Date(),
        lastPaymentError: null,
      },
    })
    await syncOrderToOdoo({ correlationId: req.correlationId, req }, updated)

    return mapPaymentSession(paymentRecord)
  },

  async confirmPayment(req: Request, body: ConfirmPaymentBody): Promise<PaymentConfirmDTO> {
    const s = assertSession(req)
    if (body.mockStatus && env.NODE_ENV === 'production') {
      const payProbe = await prisma.pwaPayment.findUnique({ where: { id: body.paymentId } })
      if (payProbe?.method === 'STRIPE') {
        throw new AppError(
          'MOCK_PAYMENT_FORBIDDEN',
          'Mock not allowed',
          'Conferma mock non consentita per Stripe in produzione.',
          403,
          false,
        )
      }
    }
    const payment = await prisma.pwaPayment.findFirst({
      where: {
        id: body.paymentId,
        order: { OR: [{ sessionId: s.id }, ...(s.userId ? [{ userId: s.userId }] : [])] },
      },
      include: { order: true },
    })
    if (!payment) throw new AppError('PAYMENT_NOT_FOUND', 'Payment not found', 'Pagamento non trovato.', 404, false)

    let paymentStatus: 'PENDING' | 'CAPTURED' | 'FAILED' | 'CANCELLED' = 'PENDING'
    if (payment.method === 'BANK_TRANSFER') paymentStatus = 'PENDING'
    if (body.mockStatus === 'captured') paymentStatus = 'CAPTURED'
    if (body.mockStatus === 'failed') paymentStatus = 'FAILED'
    if (body.mockStatus === 'cancelled') paymentStatus = 'CANCELLED'

    const orderStatus =
      paymentStatus === 'CAPTURED'
        ? 'PAID'
        : paymentStatus === 'FAILED'
          ? 'PAYMENT_FAILED'
          : paymentStatus === 'CANCELLED'
            ? 'CANCELLED'
            : 'PAYMENT_PENDING'

    await prisma.pwaPayment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        capturedAt: paymentStatus === 'CAPTURED' ? new Date() : undefined,
        failedAt: paymentStatus === 'FAILED' ? new Date() : undefined,
        cancelledAt: paymentStatus === 'CANCELLED' ? new Date() : undefined,
      },
    })

    const updated = await prisma.pwaOrder.update({
      where: { id: payment.orderId },
      data: {
        orderStatus,
        paymentStatus,
        paidAt: paymentStatus === 'CAPTURED' ? new Date() : undefined,
        cancelledAt: paymentStatus === 'CANCELLED' ? new Date() : undefined,
        lastPaymentError: paymentStatus === 'FAILED' ? 'Pagamento non riuscito o rifiutato dal provider.' : null,
      },
    })
    await syncOrderToOdoo({ correlationId: req.correlationId, req }, updated)

    return {
      orderId: updated.id,
      paymentId: payment.id,
      orderStatus: orderStatusToDTO(updated.orderStatus),
      paymentStatus: paymentStatusToDTO(updated.paymentStatus),
    }
  },

  async status(req: Request, orderId: string): Promise<PwaOrderStatusResponseDTO> {
    return mapOrderStatus(await assertOrderAccess(req, orderId))
  },

  async abandon(req: Request, orderId: string): Promise<PwaOrderStatusResponseDTO> {
    const order = await assertOrderAccess(req, orderId)
    const updated = await prisma.pwaOrder.update({
      where: { id: order.id },
      data: {
        orderStatus: 'ABANDONED',
        abandonedAt: new Date(),
      },
    })
    await prisma.cart.update({
      where: { id: updated.cartId },
      data: { status: 'ABANDONED', abandonedAt: new Date() },
    })
    await prisma.abandonedCartEvent.create({
      data: {
        cartId: updated.cartId,
        eventType: 'pwa_order_abandoned',
        payloadJson: jsonValue({ orderId: updated.id, correlationId: req.correlationId }),
      },
    })
    await syncOrderToOdoo({ correlationId: req.correlationId, req }, updated)
    return mapOrderStatus(updated)
  },
}

