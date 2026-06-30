import type { Request } from 'express'
import { AppError } from '../../types/errors.js'
import { repriceCartFromOdoo } from '../catalog/odooPricing.service.js'
import { assertCartLinesPurchasable } from '../catalog/catalog-stock.enrich.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { CheckoutStartDTO } from '../../types/dto.js'
import type { CheckoutDraftBody } from './checkout-draft.validators.js'
import { isCheckoutAddressValid } from './checkout-address.validators.js'
import { assertOdooReadyForCheckoutFromRequest } from '../../lib/odoo-checkout-health.js'
import { segmentFromDto } from '../tax/tax.validators.js'
import {
  assertOrderAccess,
  findReusableCheckoutOrder,
  isCartCheckoutPriceLocked,
  loadActiveCart,
  mapCheckoutStart,
  resolveIdempotencyKey,
  syncCheckoutDraftOrder,
} from './checkout-order-sync.service.js'

function orderStatusForStep(step: CheckoutDraftBody['step']) {
  if (step === 'lock') return 'CHECKOUT_LOCKED' as const
  if (step === 'payment_method') return 'CHECKOUT_STARTED' as const
  return 'DRAFT' as const
}

export const checkoutDraftService = {
  async patchDraft(req: Request, body: CheckoutDraftBody): Promise<CheckoutStartDTO> {
    const cart = await loadActiveCart(req)
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const priceLocked = await isCartCheckoutPriceLocked(cart.id)

    if (!priceLocked && body.step !== 'lock' && body.step !== 'shipping') {
      const pricing = await resolvePricingContext(req)
      await repriceCartFromOdoo(req, cart.id, pricing)
    }

    const cartFresh = await loadActiveCart(req)

    if (body.step === 'shipping' || body.step === 'lock') {
      const orderLocked = priceLocked || body.orderId != null
      if (!orderLocked) {
        await assertCartLinesPurchasable(
          ctx,
          cartFresh.items.map((i) => ({
            productRef: i.productRef,
            variantRef: i.variantRef,
            quantity: i.quantity,
          })),
        )
      }
    }

    const idempotencyKey = resolveIdempotencyKey(req, body.idempotencyKey, cartFresh.updatedAt)
    let existing = body.orderId
      ? await assertOrderAccess(req, body.orderId)
      : await findReusableCheckoutOrder(cartFresh.id, idempotencyKey)

    if (existing && existing.cartId !== cartFresh.id) {
      throw new AppError('ORDER_MISMATCH', 'Order mismatch', 'Ordine non valido per questo carrello.', 409, false)
    }

    const email = body.email ?? existing?.email
    if (!email) {
      throw new AppError('EMAIL_REQUIRED', 'Email required', 'Email obbligatoria.', 400, false)
    }

    const billing =
      body.billingAddress ??
      (existing?.billingAddressJson as CheckoutDraftBody['billingAddress'] | undefined)
    const shipping =
      body.shippingAddress ??
      (existing?.shippingAddressJson as CheckoutDraftBody['shippingAddress'] | undefined)

    if (!billing || !shipping) {
      throw new AppError(
        'ADDRESS_REQUIRED',
        'Address required',
        'Indirizzi di fatturazione e spedizione obbligatori.',
        400,
        false,
      )
    }

    if (
      body.step === 'details' &&
      (!isCheckoutAddressValid(billing) || !isCheckoutAddressValid(shipping))
    ) {
      throw new AppError(
        'ADDRESS_INCOMPLETE',
        'Address incomplete',
        'Completa gli indirizzi prima di continuare.',
        400,
        false,
      )
    }

    if (body.step === 'lock' || body.step === 'payment_method') {
      await assertOdooReadyForCheckoutFromRequest(req, {
        userId: req.sessionRecord?.userId,
        cartId: cartFresh.id,
        orderId: existing?.id,
        step: body.step,
      })
    }

    const dropship = body.dropshipAddress ?? body.deliveryRecipient ?? undefined
    const vatWarning =
      body.vatForceAccepted && body.business?.vatNumber
        ? `[VAT forzato] P.IVA ${body.business.vatNumber} non validata VIES.`
        : null

    const pricing = await resolvePricingContext(req)
    const segment = segmentFromDto(body.customerSegment) ?? pricing.segment

    const { order, checkoutSessionId } = await syncCheckoutDraftOrder(
      req,
      cartFresh,
      {
        email,
        billingAddress: billing,
        shippingAddress: shipping,
        dropshipAddress: dropship,
        clientOrderRef: body.clientOrderRef,
        orderNotes: [body.orderNotes?.trim(), vatWarning].filter(Boolean).join('\n') || undefined,
        courierNotes: shipping.courierNotes,
        paymentMethod: body.paymentMethod,
        customerSegment: segment,
        isProfessional: body.isProfessional ?? segment === 'PROFESSIONAL',
        vatValidated: body.vatValidated,
        vatForceAccepted: body.vatForceAccepted,
        fiscal: {
          vatNumber: body.business?.vatNumber,
          vatWarningForced: body.vatForceAccepted,
        },
        createAccount: body.createAccount,
        idempotencyKey,
        lockPrices: body.step === 'lock',
        requireShipping: body.step !== 'details',
      },
      {
        existingOrder: existing,
        orderStatus: orderStatusForStep(body.step),
      },
    )

    return mapCheckoutStart(order, checkoutSessionId)
  },
}
