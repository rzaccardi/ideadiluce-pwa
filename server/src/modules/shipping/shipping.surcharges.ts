import { prisma } from '../../lib/prisma.js'
import type { ShippingQuoteLine } from '../../adapters/shipping/types.js'
import type { ShippingSurchargeAppliedDTO } from '../../types/dto.js'

export type ShippingSurchargeRules = {
  dhlBaseCents: number
  fedexBaseCents: number
  dhlLengthCents: number
  lengthThresholdMeters: number
}

const DEFAULT_RULES: ShippingSurchargeRules = {
  dhlBaseCents: 500,
  fedexBaseCents: 400,
  dhlLengthCents: 1200,
  lengthThresholdMeters: 1.0,
}

export async function loadShippingSurchargeRules(): Promise<ShippingSurchargeRules> {
  const row = await prisma.shippingSurchargeConfig.findUnique({ where: { id: 'default' } })
  if (!row) return DEFAULT_RULES
  return {
    dhlBaseCents: row.dhlBaseCents,
    fedexBaseCents: row.fedexBaseCents,
    dhlLengthCents: row.dhlLengthCents,
    lengthThresholdMeters: row.lengthThresholdMeters,
  }
}

export async function updateShippingSurchargeRules(
  patch: Partial<ShippingSurchargeRules>,
): Promise<ShippingSurchargeRules> {
  const row = await prisma.shippingSurchargeConfig.upsert({
    where: { id: 'default' },
    create: { ...DEFAULT_RULES, ...patch },
    update: patch,
  })
  return {
    dhlBaseCents: row.dhlBaseCents,
    fedexBaseCents: row.fedexBaseCents,
    dhlLengthCents: row.dhlLengthCents,
    lengthThresholdMeters: row.lengthThresholdMeters,
  }
}

export function applyOrderSurcharges(
  quotes: ShippingQuoteLine[],
  maxLengthMeters: number,
  rules: ShippingSurchargeRules,
  skipSurcharges: boolean,
): { quotes: ShippingQuoteLine[]; applied: ShippingSurchargeAppliedDTO[] } {
  if (skipSurcharges || quotes.length === 0) {
    return { quotes, applied: [] }
  }

  const hasLongProduct = maxLengthMeters > rules.lengthThresholdMeters
  const applied: ShippingSurchargeAppliedDTO[] = []
  let dhlExtra = 0
  let fedexExtra = 0

  const hasDhl = quotes.some((q) => q.source === 'dhl')
  const hasFedex = quotes.some((q) => q.source === 'fedex')

  if (hasDhl && rules.dhlBaseCents > 0) {
    applied.push({
      code: 'dhl_base',
      label: 'Supplemento DHL',
      amountCents: rules.dhlBaseCents,
    })
    dhlExtra += rules.dhlBaseCents
  }

  if (hasDhl && hasLongProduct && rules.dhlLengthCents > 0) {
    applied.push({
      code: 'dhl_length',
      label: 'Supplemento DHL prodotti oltre 1 m',
      amountCents: rules.dhlLengthCents,
    })
    dhlExtra += rules.dhlLengthCents
  }

  if (hasFedex && rules.fedexBaseCents > 0) {
    applied.push({
      code: 'fedex_base',
      label: 'Supplemento FedEx',
      amountCents: rules.fedexBaseCents,
    })
    fedexExtra += rules.fedexBaseCents
  }

  if (applied.length === 0) {
    return { quotes, applied: [] }
  }

  const updated = quotes.map((q) => {
    if (q.source === 'dhl' && dhlExtra > 0) {
      return { ...q, amountCents: q.amountCents + dhlExtra }
    }
    if (q.source === 'fedex' && fedexExtra > 0) {
      return { ...q, amountCents: q.amountCents + fedexExtra }
    }
    return q
  })

  return { quotes: updated, applied }
}
