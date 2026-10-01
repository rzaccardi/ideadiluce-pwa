import { t, tParams } from '@/i18n/messages'
import type { PwaLocale } from '@/lib/locale'
import type {
  ProductAvailabilityDataDTO,
  ProductCardDTO,
  ProductDetailDTO,
  ProductVariantDTO,
} from '@/types/dto'

export type ProductAvailabilityStatus = 'available' | 'orderable' | 'out_of_stock'

export type ProductAvailabilityResult = {
  status: ProductAvailabilityStatus
  label: string
  detail?: string
  canAddToCart: boolean
  showProductRequest: boolean
  showRestockNotify: boolean
  schemaOrgAvailability: string
  leadTimeDays?: number
  restockDate?: string
}

const LOCALE_TAG: Record<PwaLocale, string> = {
  IT: 'it-IT',
  EN: 'en-GB',
  ES: 'es-ES',
  FR: 'fr-FR',
  DE: 'de-DE',
  RO: 'ro-RO',
}

function daysUntilIsoDate(iso: string | null | undefined): number | null {
  if (!iso?.trim()) return null
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
  return diff > 0 ? diff : null
}

function firstFutureRestockDate(restockDate?: string | null): string | null {
  if (!restockDate?.trim()) return null
  const candidates = restockDate.includes(',')
    ? restockDate.split(',').map((d) => d.trim())
    : [restockDate.trim()]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (const iso of candidates) {
    const target = new Date(iso)
    if (Number.isNaN(target.getTime())) continue
    target.setHours(0, 0, 0, 0)
    if (target >= today) return iso
  }
  return null
}

function formatRestockDate(iso: string, locale: PwaLocale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function resolveLeadTimeDays(
  customerLeadTimeDays?: number | null,
  rawRestockDate?: string | null,
): number | null {
  if (customerLeadTimeDays != null && customerLeadTimeDays > 0) {
    return customerLeadTimeDays
  }
  const futureDate = firstFutureRestockDate(rawRestockDate)
  if (!futureDate) return null
  return daysUntilIsoDate(futureDate)
}

function orderableDetail(
  locale: PwaLocale,
  leadTimeDays: number | null,
  restockDate: string | null,
): string {
  if (restockDate) {
    return tParams(locale, 'product.availability.shippedByDate', {
      date: formatRestockDate(restockDate, locale),
    })
  }
  if (leadTimeDays != null && leadTimeDays > 0) {
    return tParams(locale, 'product.availability.basePlusLead', { days: leadTimeDays })
  }
  // LT = 0 o assente ma fornitore presente → solo BASE
  return t(locale, 'product.availability.baseShipping')
}

function buildAvailable(locale: PwaLocale): ProductAvailabilityResult {
  return {
    status: 'available',
    label: t(locale, 'product.availability.available'),
    detail: t(locale, 'product.availability.baseShipping'),
    canAddToCart: true,
    showProductRequest: false,
    showRestockNotify: false,
    schemaOrgAvailability: 'https://schema.org/InStock',
  }
}

function buildOrderable(
  locale: PwaLocale,
  leadTimeDays: number | null,
  restockDate: string | null,
): ProductAvailabilityResult {
  const effectiveLead = leadTimeDays != null && leadTimeDays > 0 ? leadTimeDays : 0
  return {
    status: 'orderable',
    label: t(locale, 'product.availability.orderable'),
    detail: orderableDetail(locale, effectiveLead > 0 ? effectiveLead : null, restockDate),
    canAddToCart: true,
    showProductRequest: false,
    showRestockNotify: false,
    schemaOrgAvailability: 'https://schema.org/PreOrder',
    leadTimeDays: effectiveLead > 0 ? effectiveLead : undefined,
    restockDate: restockDate ?? undefined,
  }
}

function buildOutOfStock(
  locale: PwaLocale,
  opts: { showProductRequest: boolean; showRestockNotify: boolean },
): ProductAvailabilityResult {
  return {
    status: 'out_of_stock',
    label: t(locale, 'product.availability.outOfStock'),
    canAddToCart: false,
    showProductRequest: opts.showProductRequest,
    showRestockNotify: opts.showRestockNotify,
    schemaOrgAvailability: 'https://schema.org/OutOfStock',
  }
}

/** Deriva ProductAvailabilityDataDTO da campi legacy finché il mapper Odoo non espone availability. */
export function resolveAvailabilityData(
  product: Pick<ProductDetailDTO | ProductCardDTO, 'inStock' | 'availability'>,
  variant?: Pick<ProductVariantDTO, 'inStock' | 'stockQty' | 'availability'> | null,
): ProductAvailabilityDataDTO {
  const explicit = variant?.availability ?? product.availability
  if (explicit) return explicit

  const stockQty = variant?.stockQty
  const inStock = variant?.inStock ?? product.inStock

  if (stockQty != null) {
    return {
      qtyAvailable: Math.max(0, stockQty),
      isOrderable: false,
      isUnrecoverable: inStock === false && stockQty <= 0,
    }
  }

  if (inStock === false) {
    return {
      qtyAvailable: 0,
      isOrderable: false,
      isUnrecoverable: false,
    }
  }

  // Senza dati stock espliciti: non assumere fornitori
  return {
    qtyAvailable: 1,
    isOrderable: false,
  }
}

export function getProductAvailabilityStatus(input: {
  availability: ProductAvailabilityDataDTO | null | undefined
  requestedQty?: number
  locale?: PwaLocale
}): ProductAvailabilityResult {
  const locale = input.locale ?? 'IT'
  const requestedQty = Math.max(1, input.requestedQty ?? 1)
  const avail = input.availability

  if (!avail) {
    return buildOutOfStock(locale, { showProductRequest: false, showRestockNotify: false })
  }

  const {
    qtyAvailable,
    isOrderable,
    restockDate: rawRestockDate,
    customerLeadTimeDays,
    isUnrecoverable,
  } = avail
  const restockDate = firstFutureRestockDate(rawRestockDate)
  const leadTimeDays = resolveLeadTimeDays(customerLeadTimeDays, rawRestockDate)

  if (isUnrecoverable === true) {
    return buildOutOfStock(locale, { showProductRequest: true, showRestockNotify: false })
  }

  // Caso 1: Q ≤ S
  if (qtyAvailable > 0 && requestedQty <= qtyAvailable) {
    return buildAvailable(locale)
  }

  // Caso 2: Q > S (o S=0) con fornitori
  if (isOrderable) {
    return buildOrderable(locale, leadTimeDays, restockDate)
  }

  // Caso 3: S = 0, nessun fornitore → Avvisami
  // Edge con S > 0 gestito dal cap qty in PDP (qui Q > S senza fornitori = non acquistabile)
  return buildOutOfStock(locale, {
    showProductRequest: false,
    showRestockNotify: qtyAvailable <= 0,
  })
}

export function formatAvailabilityPrimaryLabel(result: ProductAvailabilityResult): string {
  return result.label
}

export function isCatalogProductPurchasable(
  product: Pick<ProductCardDTO, 'inStock' | 'availability'>,
  locale: PwaLocale = 'IT',
): boolean {
  return (
    getProductAvailabilityStatus({
      availability: resolveAvailabilityData(product),
      locale,
    }).status !== 'out_of_stock'
  )
}

/** Max qty ordinabile quando non ci sono fornitori (edge case). */
export function resolveMaxOrderableQty(
  availability: ProductAvailabilityDataDTO | null | undefined,
): number | undefined {
  if (!availability) return undefined
  if (availability.isUnrecoverable) return undefined
  if (availability.isOrderable) return undefined
  if (availability.qtyAvailable > 0) return availability.qtyAvailable
  return undefined
}
