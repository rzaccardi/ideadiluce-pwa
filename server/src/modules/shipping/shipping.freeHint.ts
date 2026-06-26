import { prisma } from '../../lib/prisma.js'
import type { FreeShippingHintDTO } from '../../types/dto.js'
import { ShippingMethodType } from '@prisma/client'

function zoneMatches(_country: string, postcodes: string[], postalCode: string): boolean {
  if (postcodes.length === 0) return true
  const pc = postalCode.replace(/\s/g, '')
  return postcodes.some((p) => pc.startsWith(p.replace(/\s/g, '')))
}

/** Soglia spedizione gratuita per zona/indirizzo (default IT in carrello). */
export async function resolveFreeShippingHint(input: {
  subtotalCents: number
  country?: string
  postalCode?: string
}): Promise<FreeShippingHintDTO | null> {
  const country = (input.country ?? 'IT').toUpperCase()
  const postalCode = input.postalCode ?? ''
  const subtotalCents = input.subtotalCents

  const zones = await prisma.shippingZone.findMany({
    where: { enabled: true },
    include: { methods: { where: { enabled: true }, orderBy: { priority: 'asc' } } },
    orderBy: { priority: 'desc' },
  })

  let best: { thresholdCents: number; label: string } | null = null

  for (const zone of zones) {
    if (!zone.countries.map((c) => c.toUpperCase()).includes(country)) continue
    if (!zoneMatches(country, zone.postcodes, postalCode)) continue

    for (const m of zone.methods) {
      if (m.type !== ShippingMethodType.FREE_SHIPPING) continue
      if (m.freeAboveCents == null) continue
      if (m.minOrderCents != null && subtotalCents < m.minOrderCents) continue
      if (!best || m.freeAboveCents < best.thresholdCents) {
        best = { thresholdCents: m.freeAboveCents, label: m.name }
      }
    }
    if (best) break
  }

  if (!best) return null

  const eligible = subtotalCents >= best.thresholdCents
  return {
    thresholdCents: best.thresholdCents,
    remainingCents: eligible ? 0 : best.thresholdCents - subtotalCents,
    eligible,
    label: best.label,
  }
}
