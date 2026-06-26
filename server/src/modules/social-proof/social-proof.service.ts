import { prisma } from '../../lib/prisma.js'
import { formatOdooTemplateRef } from '../catalog/odooRef.js'
import { resolveCatalogProduct } from '../catalog/catalogResolver.service.js'
import type { ProductSocialProofDTO, ProductSocialProofEventDTO } from '../../types/dto.js'
import { anonymizeBuyerLabel } from './social-proof.anonymize.js'
import { getSocialProofSettings } from './social-proof.settings.js'

const PAID_STATUSES = ['PAID', 'CONFIRMED', 'COMPLETED'] as const

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
): Promise<{ events: ProductSocialProofEventDTO[]; buyers: number; units: number }> {
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

  const events: ProductSocialProofEventDTO[] = []
  let units = 0
  let buyers = 0

  for (const order of orders) {
    const quantity = order.cart.items.reduce((sum, line) => sum + line.quantity, 0)
    if (quantity < 1 || !order.paidAt) continue
    if (!passesMinQuantity(quantity, minQuantity)) continue
    buyers += 1
    units += quantity
    if (events.length < maxEvents) {
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
      })
    }
  }

  return { events, buyers, units }
}

async function fetchOdooCachedEvents(
  templateId: number | null | undefined,
  since: Date,
  minQuantity: number,
  maxEvents: number,
): Promise<{ events: ProductSocialProofEventDTO[]; buyers: number; units: number }> {
  if (templateId == null) return { events: [], buyers: 0, units: 0 }

  const rows = await prisma.socialProofOdooEvent.findMany({
    where: {
      productTemplateId: templateId,
      purchasedAt: { gte: since },
      quantity: { gte: minQuantity },
    },
    orderBy: { purchasedAt: 'desc' },
    take: maxEvents * 4,
  })

  const events: ProductSocialProofEventDTO[] = rows.slice(0, maxEvents).map((r) => ({
    buyerLabel: r.buyerLabel,
    quantity: r.quantity,
    purchasedAt: r.purchasedAt.toISOString(),
    source: 'odoo' as const,
  }))

  const buyers = rows.length
  const units = rows.reduce((s, r) => s + r.quantity, 0)
  return { events, buyers, units }
}

function mergeEvents(
  pwa: ProductSocialProofEventDTO[],
  odoo: ProductSocialProofEventDTO[],
  maxEvents: number,
): ProductSocialProofEventDTO[] {
  const seen = new Set<string>()
  const merged = [...pwa, ...odoo]
    .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
    .filter((e) => {
      const key = `${e.purchasedAt}|${e.buyerLabel}|${e.quantity}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  return merged.slice(0, maxEvents)
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

    const [pwa, odoo] = await Promise.all([
      fetchPwaEvents(refs, since, minQ, settings.maxEvents),
      settings.odooImportEnabled
        ? fetchOdooCachedEvents(product.odooTemplateId, since, minQ, settings.maxEvents)
        : Promise.resolve({ events: [], buyers: 0, units: 0 }),
    ])

    const events = mergeEvents(pwa.events, odoo.events, settings.maxEvents)

    return {
      enabled: true,
      events,
      buyersLast30Days: pwa.buyers + odoo.buyers,
      unitsSoldLast30Days: pwa.units + odoo.units,
      productName: product.name,
      minQuantity: minQ,
    }
  },
}
