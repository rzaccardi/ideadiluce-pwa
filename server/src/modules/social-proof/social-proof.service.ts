import { prisma } from '../../lib/prisma.js'
import { odooSocialProofAvailable } from '../../adapters/odoo/odooSocialProofImport.js'
import { formatOdooTemplateRef } from '../catalog/odooRef.js'
import { resolveCatalogProduct } from '../catalog/catalogResolver.service.js'
import type { ProductSocialProofDTO, ProductSocialProofEventDTO } from '../../types/dto.js'
import { anonymizeBuyerLabel } from './social-proof.anonymize.js'
import { getSocialProofSettings } from './social-proof.settings.js'

const PAID_STATUSES = ['PAID', 'CONFIRMED', 'COMPLETED'] as const

type InternalEvent = ProductSocialProofEventDTO & {
  odooSaleOrderId?: number | null
}

function productRefsForSlug(slug: string, odooTemplateId?: number | null): string[] {
  const refs = new Set<string>([slug])
  if (odooTemplateId != null) {
    refs.add(formatOdooTemplateRef(odooTemplateId))
    refs.add(`tpl-${odooTemplateId}`)
  }
  return [...refs]
}

function passesMinQuantity(quantity: number, minQuantity: number): boolean {
  return quantity >= minQuantity
}

async function fetchPwaEvents(
  refs: string[],
  since: Date,
  minQuantity: number,
  maxEvents: number,
): Promise<InternalEvent[]> {
  const orders = await prisma.pwaOrder.findMany({
    where: {
      orderStatus: { in: [...PAID_STATUSES] },
      paidAt: { gte: since, not: null },
      cart: { items: { some: { productRef: { in: refs } } } },
    },
    orderBy: { paidAt: 'desc' },
    take: maxEvents * 4,
    select: {
      id: true,
      paidAt: true,
      email: true,
      billingAddressJson: true,
      odooSaleOrderId: true,
      user: { select: { firstName: true, lastName: true } },
      cart: {
        select: {
          items: {
            where: { productRef: { in: refs } },
            select: { quantity: true },
          },
        },
      },
    },
  })

  const events: InternalEvent[] = []

  for (const order of orders) {
    const quantity = order.cart.items.reduce((sum, line) => sum + line.quantity, 0)
    if (quantity < 1 || !order.paidAt) continue
    if (!passesMinQuantity(quantity, minQuantity)) continue
    if (events.length >= maxEvents * 4) break
    events.push({
      buyerLabel: anonymizeBuyerLabel({
        email: order.email,
        billingAddressJson: order.billingAddressJson,
        userFirstName: order.user?.firstName,
        userLastName: order.user?.lastName,
      }),
      quantity,
      purchasedAt: order.paidAt.toISOString(),
      source: 'pwa',
      odooSaleOrderId: order.odooSaleOrderId,
    })
  }

  return events
}

async function fetchOdooCachedEvents(
  templateId: number | null | undefined,
  since: Date,
  minQuantity: number,
  maxEvents: number,
): Promise<InternalEvent[]> {
  if (templateId == null) return []

  const rows = await prisma.socialProofOdooEvent.findMany({
    where: {
      productTemplateId: templateId,
      purchasedAt: { gte: since },
      quantity: { gte: minQuantity },
    },
    orderBy: { purchasedAt: 'desc' },
    take: maxEvents * 4,
  })

  return rows.map((r) => ({
    buyerLabel: r.buyerLabel,
    quantity: r.quantity,
    purchasedAt: r.purchasedAt.toISOString(),
    source: 'odoo' as const,
    odooSaleOrderId: r.odooSaleOrderId,
  }))
}

/** Unifica PWA + storico Odoo: un solo evento per sale.order / chiave display. */
function unifyOrderHistory(
  pwa: InternalEvent[],
  odoo: InternalEvent[],
): InternalEvent[] {
  const seenOdooIds = new Set<number>()
  const seenKeys = new Set<string>()
  const unified: InternalEvent[] = []

  const sorted = [...pwa, ...odoo].sort(
    (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
  )

  for (const e of sorted) {
    if (e.odooSaleOrderId != null) {
      if (seenOdooIds.has(e.odooSaleOrderId)) continue
      seenOdooIds.add(e.odooSaleOrderId)
    } else {
      const key = `${e.purchasedAt}|${e.buyerLabel}|${e.quantity}|${e.source ?? ''}`
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
    }
    unified.push(e)
  }

  return unified
}

function toPublicEvents(events: InternalEvent[], maxEvents: number): ProductSocialProofEventDTO[] {
  return events.slice(0, maxEvents).map(({ buyerLabel, quantity, purchasedAt, source }) => ({
    buyerLabel,
    quantity,
    purchasedAt,
    source,
  }))
}

export const socialProofService = {
  async forProductSlug(
    correlationId: string,
    slug: string,
  ): Promise<ProductSocialProofDTO | null> {
    const settings = await getSocialProofSettings()
    if (!settings.enabled) {
      return {
        enabled: false,
        events: [],
        buyersLast30Days: 0,
        unitsSoldLast30Days: 0,
        minQuantity: settings.minQuantity,
      }
    }

    const product = await resolveCatalogProduct({ correlationId }, slug)
    if (!product) return null

    const refs = productRefsForSlug(product.slug, product.odooTemplateId)
    const since = new Date(Date.now() - settings.lookbackDays * 86_400_000)
    const minQ = settings.minQuantity
    const useOdooHistory = odooSocialProofAvailable()

    const [pwa, odoo] = await Promise.all([
      fetchPwaEvents(refs, since, minQ, settings.maxEvents),
      useOdooHistory
        ? fetchOdooCachedEvents(product.odooTemplateId, since, minQ, settings.maxEvents)
        : Promise.resolve([] as InternalEvent[]),
    ])

    const unified = unifyOrderHistory(pwa, odoo)

    return {
      enabled: true,
      events: toPublicEvents(unified, settings.maxEvents),
      buyersLast30Days: unified.length,
      unitsSoldLast30Days: unified.reduce((sum, e) => sum + e.quantity, 0),
      productName: product.name,
      minQuantity: minQ,
    }
  },
}
