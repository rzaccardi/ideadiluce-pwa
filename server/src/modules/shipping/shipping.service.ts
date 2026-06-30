import type { Request } from 'express'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import { fetchDhlLiveRates } from '../../adapters/shipping/dhlExpressRatesAdapter.js'
import { fetchFedexLiveRates } from '../../adapters/shipping/fedexRatesAdapter.js'
import type { ShippingAddressInput, ShippingQuoteLine } from '../../adapters/shipping/types.js'
import type { QuotesBody, SelectBody } from './shipping.validators.js'
import { ShippingMethodType } from '@prisma/client'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import {
  estimateCartMaxLeadDays,
  estimateCartMaxLengthMeters,
  estimateCartWeightKg,
} from '../../adapters/odoo/odooInventoryAdapter.js'
import { effectiveSubtotalCents } from '../cart/cartTotals.js'
import { computeCartTaxCents } from '../cart/cart-tax.helper.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'
import { resolveFreeShippingHint } from './shipping.freeHint.js'
import { applyOrderSurcharges, loadShippingSurchargeRules } from './shipping.surcharges.js'
import { getStorePickupLocation } from '../../config/store-location.js'
import type {
  FreeShippingHintDTO,
  ShippingQuoteDTO,
  ShippingQuotesResponseDTO,
  ShippingSurchargeAppliedDTO,
} from '../../types/dto.js'

const pickupLocation = getStorePickupLocation()
const PICKUP_ROMA_LABEL = pickupLocation.label

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

export function isRomePickupEligible(address: ShippingAddressInput): boolean {
  if (address.country.toUpperCase() !== 'IT') return false
  const city = address.city.trim().toLowerCase()
  if (city !== 'roma' && city !== 'rome') return false
  const pc = address.postalCode.replace(/\s/g, '')
  return /^001\d{2}$/.test(pc)
}

function mergeEtaWithLeadDays(etaDays: number | null | undefined, leadDays: number | null): number | null {
  if (etaDays == null && leadDays == null) return null
  return Math.max(etaDays ?? 0, leadDays ?? 0) || null
}

async function quotesFromDb(
  ctx: OdooCallContext,
  address: ShippingAddressInput,
  subtotalCents: number,
  cartItems: Array<{ productRef: string; variantRef: string | null; quantity: number }>,
  freeShippingEligible: boolean,
): Promise<{
  lines: ShippingQuoteLine[]
  surchargesApplied: ShippingSurchargeAppliedDTO[]
  deliveryEstimateDays: number | null
}> {
  const [weightKg, maxLengthMeters, maxLeadDays, surchargeRules] = await Promise.all([
    estimateCartWeightKg(ctx, cartItems),
    estimateCartMaxLengthMeters(ctx, cartItems),
    estimateCartMaxLeadDays(ctx, cartItems),
    loadShippingSurchargeRules(),
  ])

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
            etaDays: maxLeadDays,
            source: 'free',
          })
        }
        continue
      }
      if (m.type === ShippingMethodType.PICKUP) {
        if (!isRomePickupEligible(address)) continue
        lines.push({
          methodRef: `pickup:${m.id}`,
          carrierCode: 'internal',
          serviceCode: 'pickup_roma',
          label: m.name || PICKUP_ROMA_LABEL,
          amountCents: 0,
          currencyCode: 'EUR',
          etaDays: maxLeadDays,
          source: 'pickup',
        })
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
          etaDays: maxLeadDays,
          source: 'flat',
        })
      }
      if (m.type === ShippingMethodType.LIVE_DHL) {
        const dhl = await fetchDhlLiveRates(
          address,
          {
            totalWeightKg: weightKg,
            itemCount: cartItems.length,
          },
          ctx.correlationId,
        )
        for (const q of dhl) {
          lines.push({
            ...q,
            amountCents: applySurcharge(q.amountCents, m.surchargePct),
            etaDays: mergeEtaWithLeadDays(q.etaDays, maxLeadDays),
          })
        }
      }
      if (m.type === ShippingMethodType.LIVE_FEDEX) {
        const fedex = await fetchFedexLiveRates(
          address,
          {
            totalWeightKg: weightKg,
            itemCount: cartItems.length,
          },
          ctx.correlationId,
        )
        for (const q of fedex) {
          lines.push({
            ...q,
            amountCents: applySurcharge(q.amountCents, m.surchargePct),
            etaDays: mergeEtaWithLeadDays(q.etaDays, maxLeadDays),
          })
        }
      }
    }
    if (lines.length > 0) break
  }

  const exclusive = applyFreeShippingExclusive(lines)
  const { quotes: withSurcharges, applied } = applyOrderSurcharges(
    exclusive,
    maxLengthMeters,
    surchargeRules,
    freeShippingEligible,
  )

  return {
    lines: withSurcharges,
    surchargesApplied: applied,
    deliveryEstimateDays: maxLeadDays,
  }
}

function applyFreeShippingExclusive(lines: ShippingQuoteLine[]): ShippingQuoteLine[] {
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
  async quotes(req: Request, body: QuotesBody): Promise<ShippingQuotesResponseDTO> {
    const cart = await activeCart(req)
    const subtotal = effectiveSubtotalCents(cart)
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const freeShippingHint = await resolveFreeShippingHint({
      subtotalCents: subtotal,
      country: body.shippingAddress.country,
      postalCode: body.shippingAddress.postalCode,
    })
    const { lines, surchargesApplied, deliveryEstimateDays } = await quotesFromDb(
      ctx,
      body.shippingAddress,
      subtotal,
      cart.items,
      Boolean(freeShippingHint?.eligible),
    )
    if (lines.length === 0) {
      throw new AppError(
        'SHIPPING_UNAVAILABLE',
        'No shipping methods',
        'Nessun metodo di spedizione disponibile per questo indirizzo.',
        400,
        false,
      )
    }
    return {
      quotes: lines.map(toDto),
      freeShippingHint,
      surchargesApplied,
      deliveryEstimateDays,
    }
  },

  async resolveHintForCart(subtotalCents: number): Promise<FreeShippingHintDTO | null> {
    return resolveFreeShippingHint({ subtotalCents, country: 'IT', postalCode: '' })
  },

  async select(req: Request, body: SelectBody): Promise<{ selected: true; amountCents: number }> {
    const cart = await activeCart(req)
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const subtotal = effectiveSubtotalCents(cart)
    const freeShippingHint = await resolveFreeShippingHint({
      subtotalCents: subtotal,
      country: body.shippingAddress.country,
      postalCode: body.shippingAddress.postalCode,
    })
    const { lines } = await quotesFromDb(
      ctx,
      body.shippingAddress,
      subtotal,
      cart.items,
      Boolean(freeShippingHint?.eligible),
    )
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
    const pricing = await resolvePricingContext(req)
    const { taxCents: tax } = await computeCartTaxCents(subtotal, body.shippingAddress.country, {
      customerSegment: pricing.segment,
      isProfessional: pricing.segment === 'PROFESSIONAL',
      isEstimate: true,
    })
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        estimatedSubtotal: subtotal,
        estimatedTax: tax,
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
