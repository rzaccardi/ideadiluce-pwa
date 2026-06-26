import type { ProductAvailabilityDataDTO, ProductDocumentDTO } from '../../types/dto.js'

type ArflyAvailabilityFlat = {
  qty_available?: unknown
  is_orderable?: unknown
  restock_date?: unknown
  customer_lead_time_days?: unknown
  is_unrecoverable?: unknown
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  return undefined
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return undefined
}

function warnMissing(field: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[arfly] availability field missing or invalid: ${field}`)
  }
}

function mergeAvailabilityRecord(
  raw: unknown,
  flat?: ArflyAvailabilityFlat,
): Record<string, unknown> | null {
  const fromRaw =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const fromFlat: Record<string, unknown> = {}
  if (flat?.qty_available != null) fromFlat.qty_available = flat.qty_available
  if (flat?.is_orderable != null) fromFlat.is_orderable = flat.is_orderable
  if (flat?.restock_date != null) fromFlat.restock_date = flat.restock_date
  if (flat?.customer_lead_time_days != null) {
    fromFlat.customer_lead_time_days = flat.customer_lead_time_days
  }
  if (flat?.is_unrecoverable != null) fromFlat.is_unrecoverable = flat.is_unrecoverable

  const merged = { ...fromFlat, ...fromRaw }
  return Object.keys(merged).length ? merged : null
}

export function parseArflyAvailability(
  raw: unknown,
  flat?: ArflyAvailabilityFlat,
): ProductAvailabilityDataDTO | undefined {
  const r = mergeAvailabilityRecord(raw, flat)
  if (!r) return undefined

  const qtyRaw = r.qty_available ?? r.qtyAvailable
  const qtyAvailable = readNumber(qtyRaw)
  if (qtyAvailable == null) warnMissing('qty_available')

  const isOrderableRaw = readBoolean(r.is_orderable ?? r.isOrderable)
  const resolvedQty = qtyAvailable ?? 0
  const isOrderable = isOrderableRaw ?? resolvedQty > 0

  const restockDate = readString(r.restock_date ?? r.restockDate) ?? null
  const customerLeadTimeDays =
    readNumber(r.customer_lead_time_days ?? r.customerLeadTimeDays) ?? null
  const isUnrecoverable = readBoolean(r.is_unrecoverable ?? r.isUnrecoverable) ?? false

  return {
    qtyAvailable: resolvedQty,
    isOrderable,
    restockDate,
    customerLeadTimeDays,
    isUnrecoverable,
  }
}

export function parseArflyDocuments(raw: unknown): ProductDocumentDTO[] {
  if (!Array.isArray(raw)) return []

  const docs: ProductDocumentDTO[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const url = readString(r.url)
    if (!url) continue
    const id = readString(r.id) ?? String(docs.length + 1)
    const name = readString(r.name) ?? 'Documento'
    docs.push({
      id,
      name,
      type: readString(r.type) ?? null,
      format: readString(r.format) ?? null,
      sizeBytes: readNumber(r.size_bytes ?? r.sizeBytes) ?? null,
      url,
    })
  }
  return docs
}

export function deriveInStockFromAvailability(
  availability?: ProductAvailabilityDataDTO | null,
): boolean {
  if (!availability) return false
  if (availability.isUnrecoverable) return false
  if (availability.qtyAvailable > 0) return true
  return availability.isOrderable
}
