import type { Prisma, PwaOrder, PwaPayment } from '@prisma/client'
import type { Request } from 'express'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import type {
  CheckoutStartDTO,
  PaymentConfirmDTO,
  PaymentSessionDTO,
  PwaOrderStatusResponseDTO,
  StripeClientConfigDTO,
  ThankYouOrderDTO,
} from '../../types/dto.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { createOdooOrderAdapter } from '../../adapters/odoo/odooOrderAdapter.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { isOdooConfigured } from '../../adapters/odoo/odooClient.js'
import { syncSaleOrderFunnelState } from '../../adapters/odoo/odooFunnelSync.js'
import { registerPayment } from '../../adapters/odoo/odooPaymentLive.js'
import { createProviderPaymentSession } from '../../adapters/payments/paymentProviderAdapter.js'
import { getStripePublishableKey, getStripeClientConfig, decodeStripeClientSecret } from '../../lib/stripe-config.js'
import { parseBankTransferInstructionsJson } from './bankTransferInstructions.js'
import {
  isStripeCheckoutSessionOpen,
  retrieveStripeCheckoutSession,
  type StripeLineItemInput,
} from '../../adapters/payments/stripeCheckoutAdapter.js'
import { shippingService } from '../shipping/shipping.service.js'
import { resolveCatalogProduct } from '../catalog/catalogResolver.service.js'
import { repriceCartFromOdoo } from '../catalog/odooPricing.service.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'
import {
  applyCheckoutPriceSnapshot,
  buildCheckoutPriceSnapshot,
  findActiveCheckoutPriceFreeze,
  parseCheckoutPriceSnapshot,
  saveCheckoutPriceSnapshot,
} from '../cart/cart-price-freeze.service.js'
import { assertCartLinesPurchasable } from '../catalog/catalog-stock.enrich.js'
import { env } from '../../config/env.js'
import type {
  CheckoutStartBody,
  ConfirmPaymentBody,
  CreatePaymentSessionBody,
  PrepareWalletCheckoutBody,
} from './payments.validators.js'
import {
  orderStatusToDTO,
  paymentMethodToDTO,
  paymentMethodToPrisma,
  paymentStatusToDTO,
} from './payment.types.js'
import { resolveCartEstimateTotals, subtotalCentsFromCartItems } from '../cart/cartTotals.js'
import { taxService } from '../tax/tax.service.js'
import { segmentFromDto } from '../tax/tax.validators.js'
import {
  assertEuVatRequirement,
  assertLocalTaxFields,
} from '../tax/tax-validation-guards.js'
import { recordAbandonedCartEvent, syncCartContactEmail } from '../cart/cart-contact.service.js'
import { cartService } from '../cart/cart.service.js'
import { parseShippingAddressJson } from '../users/user.mapper.js'
import { loadPwaOrderLines } from '../orders/pwa-order-lines.js'
import { enqueueOdooSyncFailure } from '../odoo/odoo-sync-queue.service.js'
import type { TestCheckoutAddressInput } from '../integrations/integrations.validators.js'
import { isCheckoutAddressValid, normalizeCheckoutAddress } from '../checkout/checkout-address.validators.js'
import {
  buildLinesSnapshot,
  findReusableCheckoutOrder,
  resolveIdempotencyKey,
} from '../checkout/checkout-order-sync.service.js'
import { assertOdooReadyForCheckoutFromRequest } from '../../lib/odoo-checkout-health.js'

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
  lastPricedAt: Date | null
  items: Array<{ quantity: number; clientUnitPriceEstimate: number | null }>
}) {
  const computed = subtotalCentsFromCartItems(cart.items)
  const totals = resolveCartEstimateTotals(cart, computed)
  return totals.estimatedTotal ?? 0
}

async function stripeLineItemsForOrder(
  req: Request,
  cart: Awaited<ReturnType<typeof activeCartForRequest>>,
  currencyCode: string,
): Promise<StripeLineItemInput[]> {
  const lines: StripeLineItemInput[] = []
  for (const item of cart.items) {
    const p = await resolveCatalogProduct(req, item.productRef)
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

async function loadOrderWithLatestPayment(orderId: string) {
  return prisma.pwaOrder.findFirst({
    where: { id: orderId },
    include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
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

/** Dopo redirect Stripe la sessione cookie può non coincidere: prova session_id Stripe come prova d'accesso. */
async function assertOrderAccessOrStripeSession(
  req: Request,
  orderId: string,
  stripeSessionId?: string | null,
) {
  try {
    return await assertOrderAccess(req, orderId)
  } catch (e) {
    if (!(e instanceof AppError && e.code === 'ORDER_NOT_FOUND')) throw e
    if (!stripeSessionId?.trim()) throw e

    const stripeSession = await retrieveStripeCheckoutSession(stripeSessionId.trim())
    if (stripeSession.metadata?.pwa_order_id !== orderId) throw e

    const order = await loadOrderWithLatestPayment(orderId)
    if (!order) throw e

    const sessionUserId = req.sessionRecord?.user?.id
    if (sessionUserId && !order.userId) {
      await prisma.pwaOrder.update({
        where: { id: order.id },
        data: { userId: sessionUserId },
      })
      order.userId = sessionUserId
    }

    return order
  }
}

async function syncOrderToOdoo(ctx: OdooCallContext, order: PwaOrder) {
  const funnelState = {
    pwaOrderId: order.id,
    orderStatus: orderStatusToDTO(order.orderStatus),
    paymentStatus: paymentStatusToDTO(order.paymentStatus),
    paymentMethod: order.paymentMethod ? paymentMethodToDTO(order.paymentMethod) : null,
    cartId: order.cartId,
    sessionId: order.sessionId,
    abandonedAt: order.abandonedAt,
    lastPaymentError: order.lastPaymentError,
    providerTransactionId: order.providerTransactionId,
  }
  const syncStatus = await syncSaleOrderFunnelState(ctx, order.odooSaleOrderId, funnelState)
  if (syncStatus !== 'skipped') {
    await prisma.pwaOrder.update({
      where: { id: order.id },
      data: {
        odooLastSyncAt: new Date(),
        odooLastSyncStatus: syncStatus === 'synced' ? 'SYNCED' : 'FAILED',
      },
    })
    if (syncStatus === 'failed') {
      await enqueueOdooSyncFailure({
        pwaOrderId: order.id,
        operation: 'funnel_sync',
        payload: { pwaOrderId: order.id, funnelState },
        lastError: order.lastPaymentError ?? 'Sync funnel Odoo fallita',
      })
    }
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

function isCheckoutAddressComplete(address: TestCheckoutAddressInput) {
  return isCheckoutAddressValid(address)
}

function resolveWalletCheckoutStart(
  req: Request,
  body: PrepareWalletCheckoutBody,
): CheckoutStartBody | null {
  const user = req.sessionRecord?.user ?? null
  const shippingRaw = body.shippingAddress ?? (user ? parseShippingAddressJson(user.shippingAddressJson) : null)
  if (!shippingRaw) return null
  const shipping = normalizeCheckoutAddress(shippingRaw)
  if (!isCheckoutAddressComplete(shipping)) return null

  const email = body.email ?? user?.email
  if (!email) return null

  const firstName = shipping.firstName.trim() || user?.firstName?.trim() || 'Cliente'
  const lastName = shipping.lastName.trim() || user?.lastName?.trim() || 'Checkout'
  const normalizedShipping = { ...shipping, firstName, lastName }
  const billing = body.billingAddress
    ? normalizeCheckoutAddress(body.billingAddress)
    : shipping

  return {
    email,
    shippingAddress: normalizedShipping,
    billingAddress: billing,
  }
}

async function syncCartProductLine(
  req: Request,
  input: { productRef: string; quantity: number; variantRef?: string | null },
) {
  const cart = await cartService.get(req)
  const variantRef = input.variantRef ?? null
  const existing = cart.items.find(
    (line) =>
      (line.productSlug === input.productRef || line.productRef === input.productRef) &&
      (line.variantRef ?? null) === variantRef,
  )
  if (existing) {
    await cartService.patchItem(req, existing.id, input.quantity)
    return
  }
  await cartService.addItem(req, {
    productRef: input.productRef,
    quantity: input.quantity,
    variantRef,
  })
}

async function autoSelectShippingForWallet(req: Request, shippingAddress: TestCheckoutAddressInput) {
  const quotesRes = await shippingService.quotes(req, { shippingAddress })
  const pick = quotesRes.quotes[0]
  if (!pick) {
    throw new AppError(
      'SHIPPING_UNAVAILABLE',
      'No shipping methods',
      'Nessun metodo di spedizione disponibile per il pagamento rapido.',
      400,
      false,
    )
  }
  await shippingService.select(req, { shippingAddress, methodRef: pick.methodRef })
}

function mapPaymentSession(payment: PwaPayment): PaymentSessionDTO {
  const publishableKey =
    payment.method === 'STRIPE' && payment.provider === 'stripe' ? getStripePublishableKey() : null
  const clientSecret = payment.clientSecret?.trim()
    ? decodeStripeClientSecret(payment.clientSecret)
    : payment.clientSecret
  return {
    paymentId: payment.id,
    orderId: payment.orderId,
    method: paymentMethodToDTO(payment.method),
    status: paymentStatusToDTO(payment.status),
    provider: payment.provider,
    amount: payment.amount,
    currencyCode: payment.currencyCode,
    redirectUrl: payment.redirectUrl,
    clientSecret,
    publishableKey,
    instructions: payment.instructionsJson as Record<string, unknown> | null,
  }
}

/** Pagamento DB creato prima della sessione provider (es. Stripe fallito) non va riusato così com'è. */
function isPaymentSessionComplete(payment: PwaPayment): boolean {
  if (payment.method === 'STRIPE') {
    return payment.provider === 'stripe' && Boolean(payment.clientSecret?.trim())
  }
  if (payment.method === 'BANK_TRANSFER') {
    return payment.provider === 'bank_transfer' && payment.instructionsJson != null
  }
  return payment.provider !== 'pending'
}

function formatDisplayOrderNumber(odooSaleOrderId: number | null, orderId: string): string {
  const year = new Date().getFullYear()
  if (odooSaleOrderId != null) {
    return `#IDL-${year}-${String(odooSaleOrderId).padStart(5, '0')}`
  }
  return `#${orderId.slice(0, 8).toUpperCase()}`
}

function mapOrderStatus(
  order: PwaOrder,
  latestPayment?: { method: string; instructionsJson: unknown } | null,
): PwaOrderStatusResponseDTO {
  const bankTransferInstructions =
    order.paymentMethod === 'BANK_TRANSFER' && latestPayment?.method === 'BANK_TRANSFER'
      ? parseBankTransferInstructionsJson(latestPayment.instructionsJson)
      : null

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
    bankTransferInstructions,
  }
}

export const paymentsService = {
  async startCheckout(req: Request, body: CheckoutStartBody): Promise<CheckoutStartDTO> {
    const s = assertSession(req)
    assertLocalTaxFields(body)
    assertEuVatRequirement(body)
    if (!s.userId) {
      throw new AppError(
        'AUTH_REQUIRED',
        'Login required',
        'Accedi per completare l’ordine.',
        401,
        false,
      )
    }
    const cart = await activeCartForRequest(req)
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const idempotencyKey = resolveIdempotencyKey(req, body.idempotencyKey, cart.updatedAt)
    const reusable = await findReusableCheckoutOrder(cart.id, idempotencyKey)
    if (reusable && idempotencyKey && reusable.idempotencyKey === idempotencyKey && reusable.checkoutSessionId) {
      return mapCheckoutStart(reusable, reusable.checkoutSessionId)
    }
    const pricing = await resolvePricingContext(req)
    if (reusable?.orderStatus !== 'CHECKOUT_LOCKED') {
      await repriceCartFromOdoo(req, cart.id, pricing)
    }
    const cartFresh = await activeCartForRequest(req)
    if (reusable?.orderStatus !== 'CHECKOUT_LOCKED') {
      await assertCartLinesPurchasable(
        ctx,
        cartFresh.items.map((i) => ({
          productRef: i.productRef,
          variantRef: i.variantRef,
          quantity: i.quantity,
        })),
      )
    }
    const shippingSel = await shippingService.requireSelection(cartFresh.id)
    const cartForSnapshot = await prisma.cart.findUnique({
      where: { id: cartFresh.id },
      include: { items: true, shippingSelection: true },
    })
    if (!cartForSnapshot) {
      throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
    }

    const subtotal = subtotalCentsFromCartItems(cartForSnapshot.items) ?? 0
    const segment =
      segmentFromDto(body.customerSegment) ??
      (body.isProfessional ? 'PROFESSIONAL' : pricing.segment)
    const taxOrder = await taxService.calculateForOrder({
      netCents: subtotal,
      billingCountry: body.billingAddress.country,
      shippingCountry: body.shippingAddress.country,
      customerSegment: segment,
      isProfessional: body.isProfessional ?? segment === 'PROFESSIONAL',
      vatValid: body.vatValidated ?? null,
      vatForceAccepted: body.vatForceAccepted,
    })

    await prisma.cart.update({
      where: { id: cartForSnapshot.id },
      data: {
        estimatedSubtotal: subtotal,
        estimatedTax: taxOrder.taxCents,
        estimatedShipping: cartForSnapshot.shippingSelection?.amountCents ?? cartForSnapshot.estimatedShipping,
        estimatedTotal:
          subtotal +
          taxOrder.taxCents +
          (cartForSnapshot.shippingSelection?.amountCents ?? cartForSnapshot.estimatedShipping ?? 0),
        lastPricedAt: new Date(),
      },
    })

    const cartPriced = await prisma.cart.findUnique({
      where: { id: cartFresh.id },
      include: { items: true, shippingSelection: true },
    })
    if (!cartPriced) {
      throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
    }

    const total = subtotal + taxOrder.taxCents + (cartPriced.shippingSelection?.amountCents ?? 0)
    const vatWarning =
      body.vatForceAccepted && body.business?.vatNumber
        ? `[VAT forzato] P.IVA ${body.business.vatNumber} non validata VIES — proseguimento manuale.`
        : null
    const priceSnapshot = buildCheckoutPriceSnapshot(cartPriced, {
      estimatedTax: taxOrder.taxCents,
      taxRatePct: taxOrder.taxRatePct,
      taxLabel: taxOrder.taxLabel,
      disclaimerKey: taxOrder.disclaimerKey,
      odooFiscalPositionId: taxOrder.odooFiscalPositionId,
      vatForceAccepted: body.vatForceAccepted,
    })

    const isBusiness =
      body.customerSegment === 'business' ||
      body.isProfessional === true ||
      segment === 'BUSINESS' ||
      segment === 'PROFESSIONAL'
    const businessProfile = isBusiness
      ? {
          companyName: body.business?.companyName ?? null,
          vatNumber: body.business?.vatNumber ?? null,
          fiscalCode: body.business?.fiscalCode ?? null,
          pec: body.business?.pec ?? null,
          sdiCode: body.business?.sdiCode ?? null,
          viesName: body.business?.viesName ?? null,
          viesAddress: body.business?.viesAddress ?? null,
          viesRequestDate: body.business?.viesRequestDate ?? null,
          isCompany: true,
        }
      : null

    const partner = await customerAdapter.findOrCreateCustomer(ctx, {
      email: body.email,
      firstName: body.billingAddress.firstName,
      lastName: body.billingAddress.lastName,
      phone: body.billingAddress.phone,
      business: businessProfile,
      billingAddress: body.billingAddress,
    })

    if (businessProfile) {
      await customerAdapter.updateCustomerBusiness(ctx, partner.odooPartnerId, businessProfile)
    }

    if (s.userId) {
      const isProFromOdoo = await customerAdapter.syncProfessionalFlagFromPartner(
        ctx,
        partner.odooPartnerId,
      )
      const userUpdate: {
        customerSegment?: 'RETAIL' | 'BUSINESS' | 'PROFESSIONAL'
        isProfessional?: boolean
        companyName?: string | null
        vatNumber?: string | null
        fiscalCode?: string | null
        pec?: string | null
        sdiCode?: string | null
      } = {}
      if (body.customerSegment === 'business') userUpdate.customerSegment = 'BUSINESS'
      if (body.customerSegment === 'retail') userUpdate.customerSegment = 'RETAIL'
      if (isProFromOdoo || body.isProfessional) userUpdate.isProfessional = true
      if (businessProfile?.companyName) userUpdate.companyName = businessProfile.companyName
      if (businessProfile?.vatNumber) userUpdate.vatNumber = businessProfile.vatNumber
      if (businessProfile?.fiscalCode) userUpdate.fiscalCode = businessProfile.fiscalCode
      if (businessProfile?.pec) userUpdate.pec = businessProfile.pec
      if (businessProfile?.sdiCode) userUpdate.sdiCode = businessProfile.sdiCode
      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({ where: { id: s.userId }, data: userUpdate })
      }
    }

    const dropshipAddress = body.dropshipAddress ?? body.deliveryRecipient ?? null
    let odooPartnerShippingId: number | null = null
    if (dropshipAddress && env.ODOO_ENABLED && isOdooConfigured()) {
      const delivery = await customerAdapter.createDeliveryPartner(ctx, partner.odooPartnerId, {
        firstName: dropshipAddress.firstName,
        lastName: dropshipAddress.lastName,
        line1: dropshipAddress.line1,
        streetNumber: dropshipAddress.streetNumber ?? '',
        isSnc: dropshipAddress.isSnc ?? false,
        line2: dropshipAddress.line2,
        city: dropshipAddress.city,
        postalCode: dropshipAddress.postalCode,
        country: dropshipAddress.country,
        phone: dropshipAddress.phone,
      })
      odooPartnerShippingId = delivery.odooPartnerId
    }

    const existing = reusable ?? (await prisma.pwaOrder.findFirst({
      where: {
        cartId: cartFresh.id,
        orderStatus: {
          in: [
            'DRAFT',
            'CART_CREATED',
            'CHECKOUT_STARTED',
            'CHECKOUT_LOCKED',
            'PAYMENT_STARTED',
            'PAYMENT_PENDING',
            'PAYMENT_FAILED',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    }))

    let odooSaleOrderId = existing?.odooSaleOrderId ?? null
    const clientOrderRef =
      body.clientOrderRef?.trim() ||
      existing?.clientOrderRef ||
      (existing?.id ? `PWA ${existing.id}` : undefined)
    if (env.ODOO_ENABLED && isOdooConfigured()) {
      const orderResult = await orderAdapter.createOrUpdateSaleOrder(ctx, {
        odooPartnerId: partner.odooPartnerId,
        odooPartnerShippingId,
        odooSaleOrderId,
        clientOrderRef,
        orderNotes: [body.orderNotes?.trim(), vatWarning].filter(Boolean).join('\n') || undefined,
        courierNotes: body.shippingAddress.courierNotes,
        fiscalPositionId: taxOrder.odooFiscalPositionId ?? undefined,
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
      odooSaleOrderId = orderResult.odooSaleOrderId
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
              priceSnapshotJson: priceSnapshot,
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
              priceSnapshotJson: priceSnapshot,
              expiresAt: new Date(Date.now() + 86400000),
            },
          })

    const metadataJson = jsonValue({
      ...((existing?.metadataJson as Record<string, unknown> | null) ?? {}),
      ...(vatWarning ? { vatForceWarning: vatWarning, orderNotes: vatWarning } : {}),
      taxDisclaimerKey: taxOrder.disclaimerKey ?? null,
      taxLabel: taxOrder.taxLabel,
      taxCents: taxOrder.taxCents,
    })

    const lockPrices = Boolean(body.lockPrices)
    const linesSnapshot = lockPrices ? buildLinesSnapshot(cartPriced) : null
    const orderStatus = lockPrices ? ('CHECKOUT_LOCKED' as const) : ('CHECKOUT_STARTED' as const)

    const data = {
      cartId: cartFresh.id,
      checkoutSessionId: checkoutSession.id,
      userId: s.userId,
      sessionId: s.id,
      email: body.email,
      orderStatus,
      paymentStatus: 'NOT_STARTED' as const,
      currencyCode: cartFresh.currencyCode,
      amountTotal: total,
      billingAddressJson: jsonValue(body.billingAddress),
      shippingAddressJson: jsonValue(body.shippingAddress),
      dropshipAddressJson: dropshipAddress ? jsonValue(dropshipAddress) : undefined,
      clientOrderRef: body.clientOrderRef?.trim() || existing?.clientOrderRef || null,
      orderNotes: body.orderNotes?.trim() || vatWarning || existing?.orderNotes || null,
      courierNotes: body.shippingAddress.courierNotes?.trim() || existing?.courierNotes || null,
      fiscalJson: jsonValue({
        vatNumber: body.business?.vatNumber ?? null,
        fiscalPositionId: taxOrder.odooFiscalPositionId ?? null,
        vatWarningForced: body.vatForceAccepted ?? false,
        viesName: body.business?.viesName ?? null,
        viesAddress: body.business?.viesAddress ?? null,
        viesValid: body.business?.viesValid ?? body.vatValidated ?? null,
        viesRequestDate: body.business?.viesRequestDate ?? null,
      }),
      linesSnapshotJson: linesSnapshot ? jsonValue(linesSnapshot) : existing?.linesSnapshotJson ?? undefined,
      odooPartnerId: partner.odooPartnerId,
      odooSaleOrderId,
      checkoutStartedAt: existing?.checkoutStartedAt ?? new Date(),
      metadataJson,
      idempotencyKey: idempotencyKey ?? existing?.idempotencyKey ?? undefined,
    }

    const order = existing
      ? await prisma.pwaOrder.update({ where: { id: existing.id }, data })
      : await prisma.pwaOrder.create({ data })

    if (lockPrices) {
      await saveCheckoutPriceSnapshot(checkoutSession.id, cartPriced, {
        estimatedTax: taxOrder.taxCents,
        taxRatePct: taxOrder.taxRatePct,
        taxLabel: taxOrder.taxLabel,
        disclaimerKey: taxOrder.disclaimerKey,
        odooFiscalPositionId: taxOrder.odooFiscalPositionId,
        vatForceAccepted: body.vatForceAccepted,
      })
    }

    await syncCartContactEmail(cartFresh.id)
    await syncOrderToOdoo(ctx, order)
    return mapCheckoutStart(order, checkoutSession.id)
  },

  async createPaymentSession(req: Request, body: CreatePaymentSessionBody): Promise<PaymentSessionDTO> {
    const s = assertSession(req)
    if (!s.userId) {
      throw new AppError(
        'AUTH_REQUIRED',
        'Login required',
        'Accedi per completare l’ordine.',
        401,
        false,
      )
    }
    const order = await assertOrderAccess(req, body.orderId)
    await assertOdooReadyForCheckoutFromRequest(req, {
      userId: s.userId,
      cartId: order.cartId,
      orderId: order.id,
      step: 'create_payment_session',
    })
    const cart = await prisma.cart.findUnique({
      where: { id: order.cartId },
      include: { items: true, shippingSelection: true },
    })
    if (!cart) throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
    await shippingService.requireSelection(cart.id)
    const priceLocked = order.orderStatus === 'CHECKOUT_LOCKED'
    const frozen = priceLocked ? await findActiveCheckoutPriceFreeze(cart.id) : null
    if (frozen?.priceSnapshotJson) {
      const snapshot = parseCheckoutPriceSnapshot(frozen.priceSnapshotJson)
      if (snapshot) await applyCheckoutPriceSnapshot(cart.id, snapshot)
    } else if (!priceLocked) {
      const pricingCheckout = await resolvePricingContext(req)
      await repriceCartFromOdoo(req, cart.id, pricingCheckout)
    }
    if (!priceLocked) {
      const ctx: OdooCallContext = { correlationId: req.correlationId, req }
      await assertCartLinesPurchasable(
        ctx,
        cart.items.map((i) => ({
          productRef: i.productRef,
          variantRef: i.variantRef,
          quantity: i.quantity,
        })),
      )
    }
    const cartPriced = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: true, shippingSelection: true },
    })
    if (!cartPriced) throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
    const pricedTotal = totalFromCart(cartPriced)
    if (!priceLocked && pricedTotal !== (order.amountTotal ?? 0)) {
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
    let active = await prisma.pwaPayment.findFirst({
      where: {
        orderId: order.id,
        method,
        status: { in: ['CREATED', 'PENDING', 'AUTHORIZED'] },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (active && isPaymentSessionComplete(active)) {
      if (active.provider === 'stripe' && active.providerSessionId) {
        let sessionOpen = false
        try {
          sessionOpen = await isStripeCheckoutSessionOpen(active.providerSessionId)
        } catch {
          sessionOpen = false
        }
        if (sessionOpen) return mapPaymentSession(active)
        await prisma.pwaPayment.update({
          where: { id: active.id },
          data: { status: 'CANCELLED', failedAt: new Date() },
        })
        active = null
      } else {
        return mapPaymentSession(active)
      }
    }

    const amount = order.amountTotal ?? pricedTotal
    if (amount <= 0) {
      throw new AppError('PAYMENT_AMOUNT_INVALID', 'Invalid amount', 'Importo ordine non valido.', 409, false)
    }

    const reusedIncomplete = Boolean(active && !isPaymentSessionComplete(active))
    let payment: PwaPayment =
      active ??
      (await prisma.pwaPayment.create({
        data: {
          orderId: order.id,
          method,
          status: 'CREATED',
          provider: 'pending',
          amount,
          currencyCode: order.currencyCode,
        },
      }))

    const stripeLines =
      body.paymentMethod === 'stripe'
        ? await stripeLineItemsForOrder(req, cartPriced, order.currencyCode)
        : undefined

    let provider
    try {
      provider = await createProviderPaymentSession({
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
    } catch (err) {
      if (!reusedIncomplete && payment.provider === 'pending') {
        await prisma.pwaPayment.delete({ where: { id: payment.id } }).catch(() => {})
      }
      throw err
    }

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

    if (orderStatus === 'PAYMENT_PENDING' && payment.method === 'BANK_TRANSFER') {
      await prisma.cart.update({
        where: { id: updated.cartId },
        data: { status: 'CONVERTED', convertedOrderId: updated.id },
      })
      if (env.ODOO_ENABLED && updated.odooSaleOrderId) {
        const reg = await registerPayment(
          { correlationId: req.correlationId, req },
          {
            saleOrderId: updated.odooSaleOrderId,
            pwaOrderId: updated.id,
            method: 'bank_transfer',
            amountCents: updated.amountTotal ?? payment.amount,
            transactionId: payment.providerSessionId,
            status: 'pending',
          },
        )
        if (reg === 'failed') {
          await prisma.pwaOrder.update({
            where: { id: updated.id },
            data: { odooLastSyncStatus: 'FAILED' },
          })
        }
      }
    }

    if (orderStatus === 'PAID' || orderStatus === 'PAYMENT_PENDING') {
      /* account creato al checkout step 1 */
    }

    return {
      orderId: updated.id,
      paymentId: payment.id,
      orderStatus: orderStatusToDTO(updated.orderStatus),
      paymentStatus: paymentStatusToDTO(updated.paymentStatus),
    }
  },

  async status(req: Request, orderId: string): Promise<PwaOrderStatusResponseDTO> {
    const order = await assertOrderAccess(req, orderId)
    const latestPayment = order.payments[0] ?? null
    return mapOrderStatus(order, latestPayment)
  },

  async thankYou(
    req: Request,
    orderId: string,
    options?: { stripeSessionId?: string | null },
  ): Promise<ThankYouOrderDTO> {
    const order = await assertOrderAccessOrStripeSession(req, orderId, options?.stripeSessionId)
    const latestPayment = order.payments[0] ?? null
    const base = mapOrderStatus(order, latestPayment)
    const shippingAddress = parseShippingAddressJson(order.shippingAddressJson)
    const lines = await loadPwaOrderLines(order.id)
    const cart = await prisma.cart.findUnique({
      where: { id: order.cartId },
      include: { shippingSelection: true },
    })
    const subtotalCents = lines.reduce((sum, line) => sum + (line.lineTotalCents ?? 0), 0)
    const shippingCents = cart?.shippingSelection?.amountCents ?? null
    const shippingMethodRef = cart?.shippingSelection?.methodRef ?? null
    const isStorePickup = cart?.shippingSelection?.serviceCode === 'pickup_roma'
    const meta = (order.metadataJson ?? {}) as Record<string, unknown>
    const checkoutSession = order.checkoutSessionId
      ? await prisma.checkoutSession.findUnique({ where: { id: order.checkoutSessionId } })
      : null
    const snapshot = parseCheckoutPriceSnapshot(checkoutSession?.priceSnapshotJson)
    const taxCents =
      typeof meta.taxCents === 'number' ? meta.taxCents : snapshot?.estimatedTax ?? null
    const taxLabel =
      typeof meta.taxLabel === 'string' ? meta.taxLabel : snapshot?.taxLabel ?? null
    const disclaimerKey =
      typeof meta.taxDisclaimerKey === 'string'
        ? meta.taxDisclaimerKey
        : snapshot?.disclaimerKey ?? null

    return {
      ...base,
      displayOrderNumber: formatDisplayOrderNumber(order.odooSaleOrderId, order.id),
      email: order.email,
      customerFirstName: shippingAddress?.firstName?.trim() || null,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() ?? null,
      shippingAddress,
      lines,
      subtotalCents: subtotalCents > 0 ? subtotalCents : null,
      shippingCents,
      shippingMethodRef,
      isStorePickup,
      taxCents,
      taxLabel,
      disclaimerKey,
    }
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
    await recordAbandonedCartEvent(updated.cartId, 'pwa_order_abandoned', {
      orderId: updated.id,
      correlationId: req.correlationId,
    })
    await syncOrderToOdoo({ correlationId: req.correlationId, req }, updated)
    return mapOrderStatus(updated)
  },

  stripeClientConfig(): StripeClientConfigDTO {
    return getStripeClientConfig()
  },

  async prepareWalletCheckout(req: Request, body: PrepareWalletCheckoutBody): Promise<PaymentSessionDTO> {
    if (!getStripeClientConfig().enabled) {
      throw new AppError(
        'PAYMENT_PROVIDER_NOT_CONFIGURED',
        'Stripe not configured',
        'Pagamento rapido non disponibile.',
        409,
        false,
      )
    }

    if (body.productRef && body.quantity) {
      await syncCartProductLine(req, {
        productRef: body.productRef,
        quantity: body.quantity,
        variantRef: body.variantRef,
      })
    }

    const checkoutStart = resolveWalletCheckoutStart(req, body)
    if (!checkoutStart) {
      throw new AppError(
        'WALLET_ADDRESS_REQUIRED',
        'Shipping address required',
        'Per Apple Pay e Google Pay serve un indirizzo di spedizione. Completa il checkout.',
        400,
        false,
      )
    }

    await autoSelectShippingForWallet(req, checkoutStart.shippingAddress)
    const started = await paymentsService.startCheckout(req, checkoutStart)
    return paymentsService.createPaymentSession(req, {
      orderId: started.orderId,
      paymentMethod: 'stripe',
    })
  },
}

