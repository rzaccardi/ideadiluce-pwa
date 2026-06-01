import type { Request } from 'express'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import type { ShippingQuoteDTO } from '../../types/dto.js'
import { fetchDhlLiveRates } from '../../adapters/shipping/dhlExpressRatesAdapter.js'
import { fetchFedexLiveRates } from '../../adapters/shipping/fedexRatesAdapter.js'
import type { ShippingAddressInput, ShippingQuoteLine } from '../../adapters/shipping/types.js'
import type { QuotesBody, SelectBody } from './shipping.validators.js'
import { ShippingMethodType } from '@prisma/client'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { estimateCartWeightKg } from '../../adapters/odoo/odooInventoryAdapter.js'

function assertSession(req: Request) {
  const s = req.sessionRecord
  if (!s) throw new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile.', 500, false)
  return s
}

async function activeCart(req: Request) {
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

function zoneMatches(_country: string, postcodes: string[], postalCode: string): boolean {
  if (postcodes.length === 0) return true
  const pc = postalCode.replace(/\s/g, '')
  return postcodes.some((p) => pc.startsWith(p.replace(/\s/g, '')))
}

function applySurcharge(amountCents: number, surchargePct: number): number {
  if (!surchargePct) return amountCents
  return Math.round(amountCents * (1 + surchargePct / 100))
}

async function quotesFromDb(
  ctx: OdooCallContext,
  address: ShippingAddressInput,
  subtotalCents: number,
  cartItems: Array<{ productRef: string; variantRef: string | null; quantity: number }>,
): Promise<ShippingQuoteLine[]> {
  const weightKg = await estimateCartWeightKg(ctx, cartItems)
  const zones = await prisma.shippingZone.findMany({
    where: { enabled: true },
    include: { methods: { where: { enabled: true }, orderBy: { priority: 'asc' } } },
    orderBy: { priority: 'desc' },
  })

  const lines: ShippingQuoteLine[] = []
  for (const zone of zones) {
    if (!zone.countries.map((c) => c.toUpperCase()).includes(address.country.toUpperCase())) continue
    if (!zoneMatches(address.country, zone.postcodes, address.postalCode)) continue

    for (const m of zone.methods) {
      if (m.minOrderCents != null && subtotalCents < m.minOrderCents) continue
      if (m.type === ShippingMethodType.FREE_SHIPPING) {
        if (m.freeAboveCents != null && subtotalCents >= m.freeAboveCents) {
          lines.push({
            methodRef: `free:${m.id}`,
            carrierCode: 'internal',
            serviceCode: 'free',
            label: m.name,
            amountCents: 0,
            currencyCode: 'EUR',
            etaDays: null,
            source: 'free',
          })
        }
        continue
      }
      if (m.type === ShippingMethodType.FLAT_RATE && m.flatAmountCents != null) {
        lines.push({
          methodRef: `flat:${m.id}`,
          carrierCode: 'internal',
          serviceCode: 'flat',
          label: m.name,
          amountCents: applySurcharge(m.flatAmountCents, m.surchargePct),
          currencyCode: 'EUR',
          etaDays: null,
          source: 'flat',
        })
      }
      if (m.type === ShippingMethodType.LIVE_DHL) {
        const dhl = await fetchDhlLiveRates(address, {
          totalWeightKg: weightKg,
          itemCount: cartItems.length,
        })
        for (const q of dhl) {
          lines.push({ ...q, amountCents: applySurcharge(q.amountCents, m.surchargePct) })
        }
      }
      if (m.type === ShippingMethodType.LIVE_FEDEX) {
        const fedex = await fetchFedexLiveRates(address, {
          totalWeightKg: weightKg,
          itemCount: cartItems.length,
        })
        for (const q of fedex) {
          lines.push({ ...q, amountCents: applySurcharge(q.amountCents, m.surchargePct) })
        }
      }
    }
    if (lines.length > 0) break
  }
  return lines
}

function toDto(q: ShippingQuoteLine): ShippingQuoteDTO {
  return {
    methodRef: q.methodRef,
    carrierCode: q.carrierCode,
    serviceCode: q.serviceCode,
    label: q.label,
    amountCents: q.amountCents,
    currencyCode: q.currencyCode,
    etaDays: q.etaDays ?? null,
    source: q.source,
  }
}

export const shippingService = {
  async quotes(req: Request, body: QuotesBody): Promise<ShippingQuoteDTO[]> {
    const cart = await activeCart(req)
    const subtotal =
      cart.estimatedSubtotal ??
      cart.items.reduce((s, i) => s + (i.clientUnitPriceEstimate ?? 0) * i.quantity, 0)
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const lines = await quotesFromDb(ctx, body.shippingAddress, subtotal, cart.items)
    if (lines.length === 0) {
      throw new AppError(
        'SHIPPING_UNAVAILABLE',
        'No shipping methods',
        'Nessun metodo di spedizione disponibile per questo indirizzo.',
        400,
        false,
      )
    }
    return lines.map(toDto)
  },

  async select(req: Request, body: SelectBody): Promise<{ selected: true; amountCents: number }> {
    const cart = await activeCart(req)
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const subtotal =
      cart.estimatedSubtotal ??
      cart.items.reduce((s, i) => s + (i.clientUnitPriceEstimate ?? 0) * i.quantity, 0)
    const lines = await quotesFromDb(ctx, body.shippingAddress, subtotal, cart.items)
    const pick = lines.find((l) => l.methodRef === body.methodRef)
    if (!pick) {
      throw new AppError('SHIPPING_METHOD_INVALID', 'Invalid method', 'Metodo di spedizione non valido.', 400, false)
    }

    await prisma.cartShippingSelection.upsert({
      where: { cartId: cart.id },
      create: {
        cartId: cart.id,
        methodRef: pick.methodRef,
        carrierCode: pick.carrierCode,
        serviceCode: pick.serviceCode,
        label: pick.label,
        amountCents: pick.amountCents,
        currencyCode: pick.currencyCode,
        etaDays: pick.etaDays ?? undefined,
        rawJson: pick as object,
      },
      update: {
        methodRef: pick.methodRef,
        carrierCode: pick.carrierCode,
        serviceCode: pick.serviceCode,
        label: pick.label,
        amountCents: pick.amountCents,
        currencyCode: pick.currencyCode,
        etaDays: pick.etaDays ?? undefined,
        rawJson: pick as object,
      },
    })

    const shipping = pick.amountCents
    const tax = cart.estimatedTax ?? Math.round(subtotal * 0.22)
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        estimatedShipping: shipping,
        estimatedTotal: subtotal + tax + shipping,
        lastPricedAt: new Date(),
      },
    })

    return { selected: true, amountCents: pick.amountCents }
  },

  async requireSelection(cartId: string) {
    const sel = await prisma.cartShippingSelection.findUnique({ where: { cartId } })
    if (!sel) {
      throw new AppError(
        'SHIPPING_NOT_SELECTED',
        'Shipping not selected',
        'Seleziona un metodo di spedizione prima di procedere.',
        400,
        false,
      )
    }
    return sel
  },
}
