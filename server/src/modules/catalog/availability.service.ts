import type { ProductAvailabilityDataDTO } from '../../types/dto.js'
import type { VariantStockSnapshot } from '../../adapters/odoo/odooInventoryAdapter.js'

/** Fallback lead time (giorni lavorativi) quando Odoo non espone date. */
export const RESTOCK_LEAD_DAYS_FALLBACK = 10

export type ProductAvailabilityState = 'available' | 'orderable' | 'out_of_stock'

export type VariantAvailabilityInput = {
  stockQty?: number | null
  restockDate?: string | null
  leadTimeDays?: number | null
  /** Prodotto vendibile (sale_ok). Default true se non noto. */
  saleOk?: boolean
  /** Ordinabile con stock insufficiente o zero. */
  orderable?: boolean
}

export type VariantAvailability = {
  state: ProductAvailabilityState
  stockQty: number | null
  restockDate: string | null
  leadTimeDays: number | null
  effectiveLeadDays: number
  canAddToCart: boolean
  showRequestProduct: boolean
  /** Alias di canAddToCart per integrazione carrello (Plan 04). */
  purchasable: boolean
  warning: string | null
}

export function daysUntilIsoDate(iso: string | null | undefined): number | null {
  if (!iso?.trim()) return null
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
  return diff > 0 ? diff : null
}

function resolveEffectiveLeadDays(
  input: VariantAvailabilityInput,
  restockDays: number | null,
  forOrderable: boolean,
): number {
  if (!forOrderable) return 0
  return Math.max(
    restockDays ?? 0,
    input.leadTimeDays ?? 0,
    RESTOCK_LEAD_DAYS_FALLBACK,
  )
}

export function resolveVariantAvailability(
  input: VariantAvailabilityInput,
  requestedQty = 1,
): VariantAvailability {
  const stockQty = input.stockQty ?? null
  const saleOk = input.saleOk !== false
  const restockDays = daysUntilIsoDate(input.restockDate ?? null)
  const hasStockData = stockQty != null

  if (!saleOk) {
    return {
      state: 'out_of_stock',
      stockQty,
      restockDate: input.restockDate ?? null,
      leadTimeDays: input.leadTimeDays ?? null,
      effectiveLeadDays: 0,
      canAddToCart: false,
      showRequestProduct: true,
      purchasable: false,
      warning: 'Prodotto non più disponibile.',
    }
  }

  if (hasStockData && stockQty >= requestedQty) {
    return {
      state: 'available',
      stockQty,
      restockDate: input.restockDate ?? null,
      leadTimeDays: input.leadTimeDays ?? null,
      effectiveLeadDays: 0,
      canAddToCart: true,
      showRequestProduct: false,
      purchasable: true,
      warning: null,
    }
  }

  const backorderAllowed = input.orderable !== false

  if (backorderAllowed) {
    const effectiveLeadDays = resolveEffectiveLeadDays(input, restockDays, true)
    const warning =
      hasStockData && stockQty > 0 && stockQty < requestedQty
        ? `Disponibili solo ${stockQty} pezzi (ne hai richiesti ${requestedQty}).`
        : null
    return {
      state: 'orderable',
      stockQty,
      restockDate: input.restockDate ?? null,
      leadTimeDays: input.leadTimeDays ?? null,
      effectiveLeadDays,
      canAddToCart: true,
      showRequestProduct: false,
      purchasable: true,
      warning,
    }
  }

  return {
    state: 'out_of_stock',
    stockQty,
    restockDate: input.restockDate ?? null,
    leadTimeDays: input.leadTimeDays ?? null,
    effectiveLeadDays: 0,
    canAddToCart: false,
    showRequestProduct: true,
    purchasable: false,
    warning: 'Prodotto non più disponibile.',
  }
}

export function resolveCartDeliveryLeadDays(
  lines: Array<{ purchasable: boolean; effectiveLeadDays: number | null }>,
): number | null {
  const leadDays = lines
    .filter((l) => l.purchasable && l.effectiveLeadDays != null && l.effectiveLeadDays > 0)
    .map((l) => l.effectiveLeadDays as number)
  if (leadDays.length === 0) return null
  return Math.max(...leadDays)
}

/** Prodotto commercialmente ordinabile in backorder (sale_ok + allow out of stock). */
export function isBackorderAllowedFromSnapshot(snapshot: {
  saleOk: boolean
  orderable: boolean
}): boolean {
  return snapshot.saleOk && snapshot.orderable !== false
}

/** CTA «Avvisami al restock»: stock zero, backorder consentito, non irrecuperabile. */
export function isRestockNotifyEligible(
  availability: ProductAvailabilityDataDTO | null | undefined,
): boolean {
  if (!availability || availability.isUnrecoverable) return false
  if (availability.qtyAvailable > 0) return false
  return availability.isOrderable === true
}

/** CTA «Richiedi prodotto»: fuori produzione o non ordinabile con stock insufficiente. */
export function isProductRequestEligible(
  availability: ProductAvailabilityDataDTO | null | undefined,
): boolean {
  if (!availability) return false
  if (availability.isUnrecoverable === true) return true
  if (availability.qtyAvailable > 0) return false
  return availability.isOrderable !== true
}

/** Converte snapshot Odoo nel DTO availability consumato da storefront e carrello. */
export function snapshotToAvailabilityData(
  snapshot: VariantStockSnapshot,
  requestedQty = 1,
): ProductAvailabilityDataDTO {
  const resolved = resolveVariantAvailability(
    {
      stockQty: snapshot.stockQty,
      restockDate: snapshot.restockDate,
      leadTimeDays: snapshot.leadTimeDays,
      saleOk: snapshot.saleOk,
      orderable: snapshot.orderable,
    },
    requestedQty,
  )

  const qtyAvailable = Math.max(0, snapshot.stockQty ?? 0)
  const backorderAllowed = isBackorderAllowedFromSnapshot(snapshot)

  return {
    qtyAvailable,
    /** Backorder commerciale (non equivale a canAddToCart). */
    isOrderable: backorderAllowed,
    restockDate: snapshot.restockDate,
    customerLeadTimeDays:
      resolved.effectiveLeadDays > 0 ? resolved.effectiveLeadDays : snapshot.leadTimeDays,
    /** Fuori produzione / sale_ok false — distinto da semplice esaurito non ordinabile. */
    isUnrecoverable: !snapshot.saleOk,
  }
}

export function mergeAvailabilityData(
  existing: ProductAvailabilityDataDTO | undefined,
  odoo: ProductAvailabilityDataDTO,
): ProductAvailabilityDataDTO {
  if (!existing) return odoo
  const isUnrecoverable = odoo.isUnrecoverable === true || existing.isUnrecoverable === true
  return {
    qtyAvailable: odoo.qtyAvailable,
    isOrderable: isUnrecoverable ? false : odoo.isOrderable || existing.isOrderable,
    restockDate: odoo.restockDate ?? existing.restockDate ?? null,
    customerLeadTimeDays: odoo.customerLeadTimeDays ?? existing.customerLeadTimeDays ?? null,
    isUnrecoverable,
  }
}

export function variantAvailabilityToCartLine(
  avail: VariantAvailability,
): {
  state: ProductAvailabilityState
  stockQty: number | null
  effectiveLeadDays: number | null
  warning: string | null
  purchasable: boolean
} {
  return {
    state: avail.state,
    stockQty: avail.stockQty,
    effectiveLeadDays: avail.effectiveLeadDays > 0 ? avail.effectiveLeadDays : null,
    warning: avail.warning,
    purchasable: avail.purchasable,
  }
}
