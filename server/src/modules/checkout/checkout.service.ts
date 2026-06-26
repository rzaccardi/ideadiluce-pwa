import type { Request } from 'express'
import type { Prisma } from '@prisma/client'
import { AppError, isAppError } from '../../types/errors.js'
import type { CheckoutSessionDTO, PaymentUrlDTO } from '../../types/dto.js'
import { checkoutRepository } from './checkout.repository.js'
import { cartService } from '../cart/cart.service.js'
import { syncCartContactEmail } from '../cart/cart-contact.service.js'
import { createOdooCheckoutAdapter } from '../../adapters/odoo/odooCheckoutAdapter.js'
import { buildCheckoutPriceSnapshot } from '../cart/cart-price-freeze.service.js'
import { prisma } from '../../lib/prisma.js'

const checkoutAdapter = createOdooCheckoutAdapter()

function toDTO(row: {
  id: string
  cartId: string
  state: string
  email: string
  paymentRedirectUrl: string | null
  expiresAt: Date | null
}): CheckoutSessionDTO {
  return {
    id: row.id,
    cartId: row.cartId,
    state: row.state,
    email: row.email,
    paymentRedirectUrl: row.paymentRedirectUrl,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  }
}

function assertSession(req: Request) {
  const s = req.sessionRecord
  if (!s) {
    throw new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile.', 500, false)
  }
  return s
}

function assertCheckoutAccess(
  req: Request,
  row: NonNullable<Awaited<ReturnType<typeof checkoutRepository.findById>>>,
) {
  const s = assertSession(req)
  if (row.userId && row.userId !== s.userId) {
    throw new AppError('FORBIDDEN', 'Forbidden', 'Non hai accesso a questa sessione.', 403, false)
  }
  if (!row.userId && row.cart.sessionId !== s.id) {
    throw new AppError('FORBIDDEN', 'Forbidden', 'Non hai accesso a questa sessione.', 403, false)
  }
}

function assertNotExpired(row: { id: string; expiresAt: Date | null }) {
  if (row.expiresAt && row.expiresAt < new Date()) {
    throw new AppError('CHECKOUT_EXPIRED', 'Expired', 'Sessione scaduta.', 410, false)
  }
}

function requirePaymentUrl(redirectUrl: string | null): string {
  if (!redirectUrl) {
    throw new AppError(
      'ODOO_PAYMENT_URL_UNAVAILABLE',
      'Odoo payment URL missing',
      'Impossibile generare la URL portale Odoo per il pagamento.',
      502,
      false,
    )
  }
  return redirectUrl
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

export const checkoutService = {
  async createSession(req: Request, email: string): Promise<CheckoutSessionDTO> {
    const cart = await cartService.get(req)
    if (cart.items.length === 0) {
      throw new AppError('EMPTY_CART', 'Cart empty', 'Il carrello è vuoto.', 400, false)
    }
    const s = assertSession(req)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)
    const cartRow = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: true, shippingSelection: true },
    })
    const priceSnapshot = cartRow ? buildCheckoutPriceSnapshot(cartRow) : undefined
    const row = await checkoutRepository.create({
      email,
      state: 'DRAFT',
      expiresAt,
      cart: { connect: { id: cart.id } },
      ...(priceSnapshot ? { priceSnapshotJson: priceSnapshot } : {}),
      ...(s.userId ? { user: { connect: { id: s.userId } } } : {}),
    })
    await syncCartContactEmail(cart.id)
    return toDTO(row)
  },

  async getSession(req: Request, id: string): Promise<CheckoutSessionDTO> {
    const row = await checkoutRepository.findById(id)
    if (!row) {
      throw new AppError('CHECKOUT_NOT_FOUND', 'Not found', 'Sessione non trovata.', 404, false)
    }
    assertCheckoutAccess(req, row)
    if (row.expiresAt && row.expiresAt < new Date()) {
      await checkoutRepository.update(id, { state: 'EXPIRED' })
      throw new AppError('CHECKOUT_EXPIRED', 'Expired', 'Sessione scaduta.', 410, false)
    }
    return toDTO(row)
  },

  async redirect(req: Request, id: string): Promise<CheckoutSessionDTO> {
    const row = await checkoutRepository.findById(id)
    if (!row) {
      throw new AppError('CHECKOUT_NOT_FOUND', 'Not found', 'Sessione non trovata.', 404, false)
    }
    assertCheckoutAccess(req, row)

    let n = await checkoutRepository.nextAttemptNo(id)
    await checkoutRepository.addAttempt({
      checkoutSessionId: id,
      attemptNo: n,
      status: 'STARTED',
    })

    try {
      const { redirectUrl, providerRef } = await checkoutAdapter.createCheckoutRedirect({
        cartId: row.cartId,
        email: row.email,
        odooPartnerId: row.odooPartnerId,
        odooSaleOrderId: row.odooSaleOrderId,
        correlationId: req.correlationId,
      })

      const updated = await checkoutRepository.update(id, {
        state: 'REDIRECTING',
        paymentRedirectUrl: redirectUrl,
      })

      n = await checkoutRepository.nextAttemptNo(id)
      await checkoutRepository.addAttempt({
        checkoutSessionId: id,
        attemptNo: n,
        status: 'SUCCEEDED',
        provider: providerRef,
        redirectUrl,
        rawSnapshotJson: { redirectUrl, providerRef, correlationId: req.correlationId },
      })

      return toDTO(updated)
    } catch (e) {
      n = await checkoutRepository.nextAttemptNo(id)
      await checkoutRepository.addAttempt({
        checkoutSessionId: id,
        attemptNo: n,
        status: 'FAILED',
        failureReason: String(e),
      })
      if (isAppError(e)) throw e
      throw new AppError(
        'CHECKOUT_REDIRECT_FAILED',
        'Redirect failed',
        'Impossibile avviare il pagamento.',
        502,
        true,
      )
    }
  },

  async paymentUrl(req: Request, id: string): Promise<PaymentUrlDTO> {
    const row = await checkoutRepository.findById(id)
    if (!row) {
      throw new AppError('CHECKOUT_NOT_FOUND', 'Not found', 'Sessione non trovata.', 404, false)
    }
    assertCheckoutAccess(req, row)
    try {
      assertNotExpired(row)
    } catch (e) {
      await checkoutRepository.update(id, { state: 'EXPIRED' })
      throw e
    }

    let n = await checkoutRepository.nextAttemptNo(id)
    await checkoutRepository.addAttempt({
      checkoutSessionId: id,
      attemptNo: n,
      status: 'STARTED',
    })

    try {
      const { redirectUrl, providerRef, debug } = await checkoutAdapter.createCheckoutRedirect({
        cartId: row.cartId,
        email: row.email,
        odooPartnerId: row.odooPartnerId,
        odooSaleOrderId: row.odooSaleOrderId,
        correlationId: req.correlationId,
      })
      const paymentUrl = requirePaymentUrl(redirectUrl)

      await checkoutRepository.update(id, {
        state: 'REDIRECTING',
        paymentRedirectUrl: paymentUrl,
      })

      n = await checkoutRepository.nextAttemptNo(id)
      const rawSnapshotJson: Prisma.InputJsonObject = {
        paymentUrl,
        correlationId: req.correlationId,
        ...(providerRef ? { providerRef } : {}),
        ...(debug ? { debug: jsonValue(debug) } : {}),
      }

      await checkoutRepository.addAttempt({
        checkoutSessionId: id,
        attemptNo: n,
        status: 'SUCCEEDED',
        provider: providerRef,
        redirectUrl: paymentUrl,
        rawSnapshotJson,
      })

      return { paymentUrl }
    } catch (e) {
      n = await checkoutRepository.nextAttemptNo(id)
      await checkoutRepository.addAttempt({
        checkoutSessionId: id,
        attemptNo: n,
        status: 'FAILED',
        failureReason: String(e),
      })

      if (isAppError(e)) throw e

      throw new AppError(
        'CHECKOUT_PAYMENT_URL_FAILED',
        e instanceof Error ? e.message : String(e),
        'Impossibile generare la URL di pagamento Odoo.',
        502,
        true,
      )
    }
  },
}
