import { t, tParams } from '@/i18n/messages'
import type { PwaLocale } from '@/lib/locale'
import type {
  ProductAvailabilityDataDTO,
  ProductCardDTO,
  ProductDetailDTO,
  ProductVariantDTO,
} from '@/types/dto'

export const RESTOCK_LEAD_DAYS_FALLBACK = 10
export const LOW_STOCK_THRESHOLD = 10

export type ProductAvailabilityStatus = 'available' | 'orderable' | 'out_of_stock'

export type ProductAvailabilityResult = {
  status: ProductAvailabilityStatus
  label: string
  detail?: string
  canAddToCart: boolean
  showProductRequest: boolean
  showRestockNotify: boolean
  lowStockLabel?: string
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
  useFallbackCopy: boolean,
): string {
  if (useFallbackCopy) {
    return t(locale, 'product.availability.orderableFallback')
  }
  if (restockDate) {
    return tParams(locale, 'product.availability.shippedByDate', {
      date: formatRestockDate(restockDate, locale),
    })
  }
  if (leadTimeDays != null && leadTimeDays > 0) {
    return tParams(locale, 'product.availability.shippedInDays', { days: leadTimeDays })
  }
  return t(locale, 'product.availability.orderableFallback')
}

function buildAvailable(locale: PwaLocale, qtyAvailable: number): ProductAvailabilityResult {
  const lowStockLabel =
    qtyAvailable <= LOW_STOCK_THRESHOLD
      ? tParams(locale, 'product.availability.lowStock', { count: qtyAvailable })
      : undefined
  return {
    status: 'available',
    label: t(locale, 'product.availability.available'),
    canAddToCart: true,
    showProductRequest: false,
    showRestockNotify: false,
    lowStockLabel,
    schemaOrgAvailability: 'https://schema.org/InStock',
  }
}

function buildOrderable(
  locale: PwaLocale,
  qtyAvailable: number,
  leadTimeDays: number | null,
  restockDate: string | null,
  useFallbackCopy: boolean,
): ProductAvailabilityResult {
  const effectiveLead =
    leadTimeDays != null && leadTimeDays > 0 ? leadTimeDays : RESTOCK_LEAD_DAYS_FALLBACK
  return {
    status: 'orderable',
    label: t(locale, 'product.availability.orderable'),
    detail: orderableDetail(locale, effectiveLead, restockDate, useFallbackCopy),
    canAddToCart: true,
    showProductRequest: false,
    showRestockNotify: qtyAvailable <= 0,
    schemaOrgAvailability: 'https://schema.org/PreOrder',
    leadTimeDays: effectiveLead,
    restockDate: restockDate ?? undefined,
  }
}

function buildOutOfStock(locale: PwaLocale, showProductRequest: boolean): ProductAvailabilityResult {
  return {
    status: 'out_of_stock',
    label: t(locale, 'product.availability.outOfStock'),
    canAddToCart: false,
    showProductRequest,
    showRestockNotify: false,
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
      isOrderable: inStock !== false,
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

  return {
    qtyAvailable: 1,
    isOrderable: true,
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
    return buildOutOfStock(locale, false)
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
    return buildOutOfStock(locale, true)
  }

  if (qtyAvailable > 0 && requestedQty <= qtyAvailable) {
    return buildAvailable(locale, qtyAvailable)
  }

  if (isOrderable) {
    return buildOrderable(locale, qtyAvailable, leadTimeDays, restockDate, false)
  }

  return buildOutOfStock(locale, true)
}

export function formatAvailabilityPrimaryLabel(result: ProductAvailabilityResult): string {
  return result.lowStockLabel ?? result.label
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

