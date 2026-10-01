import type { ProductAvailabilityDataDTO } from '../../types/dto.js'
import type { VariantStockSnapshot } from '../../adapters/odoo/odooInventoryAdapter.js'

export type ProductAvailabilityState = 'available' | 'orderable' | 'out_of_stock'

export type VariantAvailabilityInput = {
  stockQty?: number | null
  restockDate?: string | null
  /** Lead time max fornitori (giorni). */
  leadTimeDays?: number | null
  /** Prodotto vendibile (sale_ok). Default true se non noto. */
  saleOk?: boolean
  /**
   * Ordinabile oltre lo stock: true solo se esiste almeno un fornitore.
   * Default false (conservativo) se non noto.
   */
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
  /** Alias di canAddToCart per integrazione carrello. */
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

/** Lead effettivo Caso 2: LT fornitore (senza floor artificiale). */
function resolveOrderableLeadDays(input: VariantAvailabilityInput): number {
  const lt = input.leadTimeDays
  if (lt != null && Number.isFinite(lt) && lt > 0) return lt
  return 0
}

export function resolveVariantAvailability(
  input: VariantAvailabilityInput,
  requestedQty = 1,
): VariantAvailability {
  const stockQty = input.stockQty ?? null
  const saleOk = input.saleOk !== false
  const hasStockData = stockQty != null
  const backorderAllowed = input.orderable === true

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

  // Caso 1: Q ≤ S
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

  // Caso 2: Q > S (o S=0) con fornitori
  if (backorderAllowed) {
    const effectiveLeadDays = resolveOrderableLeadDays(input)
    return {
      state: 'orderable',
      stockQty,
      restockDate: input.restockDate ?? null,
      leadTimeDays: input.leadTimeDays ?? null,
      effectiveLeadDays,
      canAddToCart: true,
      showRequestProduct: false,
      purchasable: true,
      warning: null,
    }
  }

  // Edge / Caso 3: senza fornitori — non acquistabile oltre S
  // (lato UI edge case con S>0 si cap-pa a S prima di arrivare qui)
  return {
    state: 'out_of_stock',
    stockQty,
    restockDate: input.restockDate ?? null,
    leadTimeDays: input.leadTimeDays ?? null,
    effectiveLeadDays: 0,
    canAddToCart: false,
    showRequestProduct: false,
    purchasable: false,
    warning:
      hasStockData && stockQty != null && stockQty > 0
        ? `Disponibili solo ${stockQty} pezzi (ne hai richiesti ${requestedQty}).`
        : 'Prodotto non più disponibile.',
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

/** Backorder consentito: sale_ok + almeno un fornitore (`orderable`). */
export function isBackorderAllowedFromSnapshot(snapshot: {
  saleOk: boolean
  orderable: boolean
}): boolean {
  return snapshot.saleOk && snapshot.orderable === true
}

/**
 * CTA «Avvisami quando disponibile»: Caso 3 —
 * stock zero, nessun fornitore, non irrecuperabile.
 */
export function isRestockNotifyEligible(
  availability: ProductAvailabilityDataDTO | null | undefined,
): boolean {
  if (!availability || availability.isUnrecoverable) return false
  if (availability.qtyAvailable > 0) return false
  return availability.isOrderable !== true
}

/** CTA «Richiedi prodotto»: solo fuori produzione / irrecuperabile. */
export function isProductRequestEligible(
  availability: ProductAvailabilityDataDTO | null | undefined,
): boolean {
  if (!availability) return false
  return availability.isUnrecoverable === true
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
    /** Backorder commerciale = ha fornitori (non equivale a canAddToCart). */
    isOrderable: backorderAllowed,
    restockDate: snapshot.restockDate,
    customerLeadTimeDays:
      resolved.effectiveLeadDays > 0
        ? resolved.effectiveLeadDays
        : snapshot.leadTimeDays != null && snapshot.leadTimeDays > 0
          ? snapshot.leadTimeDays
          : null,
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
    // Odoo live vince su isOrderable (fornitori); non OR con catalogo stale
    isOrderable: isUnrecoverable ? false : odoo.isOrderable,
    restockDate: odoo.restockDate ?? existing.restockDate ?? null,
    customerLeadTimeDays: odoo.customerLeadTimeDays ?? existing.customerLeadTimeDays ?? null,
    isUnrecoverable,
  }
}

export function variantAvailabilityToCartLine(
  avail: VariantAvailability,
  isOrderable: boolean,
): {
  state: ProductAvailabilityState
  stockQty: number | null
  effectiveLeadDays: number | null
  warning: string | null
  purchasable: boolean
  isOrderable: boolean
} {
  return {
    state: avail.state,
    stockQty: avail.stockQty,
    effectiveLeadDays: avail.effectiveLeadDays > 0 ? avail.effectiveLeadDays : null,
    warning: avail.warning,
    purchasable: avail.purchasable,
    isOrderable,
  }
}
