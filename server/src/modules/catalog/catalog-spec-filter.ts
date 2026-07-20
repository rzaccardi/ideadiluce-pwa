import type { OdooCatalogSpec } from '../../adapters/odoo-catalog/odooCatalog.types.js'
import type { ProductCardDTO } from '../../types/dto.js'
import { buildTechnicalCardSpecTags } from '../../lib/technical-card-spec-tags.js'

export type CatalogSpecFilters = {
  attacco?: string
  colorTemp?: string
}

const ATTACCO_PARAM_RE = /^[A-Za-z0-9.\-]{2,16}$/
const COLOR_TEMP_PARAM_RE = /^\d{3,4}K?$/i

const SOCKET_SPEC_KEYS = new Set(['socket_type', 'lamp_holder', 'portalampade'])
const KELVIN_SPEC_KEYS = new Set(['color_temperature_k', 'color_temperature'])

export function sanitizeAttaccoParam(value: unknown): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || !ATTACCO_PARAM_RE.test(trimmed)) return undefined
  return trimmed.replace(/GU5[.\-_]?3/i, 'GU5.3').replace(/^r7s$/i, 'R7s')
}

export function sanitizeColorTempParam(value: unknown): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || !COLOR_TEMP_PARAM_RE.test(trimmed)) return undefined
  const digits = trimmed.replace(/\s/g, '').replace(/K$/i, '')
  return `${digits}K`
}

export function hasActiveSpecFilters(filters: CatalogSpecFilters): boolean {
  return Boolean(filters.attacco?.trim() || filters.colorTemp?.trim())
}

function normalizeSocketToken(value: string): string {
  return value
    .replace(/GU5[.\-_]?3/gi, 'GU5.3')
    .replace(/^r7s$/i, 'R7s')
    .replace(/_/g, '')
    .replace(/\s/g, '')
    .toUpperCase()
}

function kelvinInteger(value: string): number | null {
  const digits = value.replace(/\s/g, '').replace(/K$/i, '')
  const n = Number.parseInt(digits, 10)
  return Number.isFinite(n) ? n : null
}

/** Estrae valori confrontabili da una spec tipizzata (value + display + set/range). */
export function collectSpecComparableValues(spec: OdooCatalogSpec): string[] {
  const out: string[] = []
  if (spec.display?.trim()) out.push(spec.display.trim())

  const v = spec.value
  if (v == null) return out
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    out.push(String(v))
    return out
  }
  if (typeof v === 'object' && 'set' in v && Array.isArray(v.set)) {
    for (const item of v.set) out.push(String(item))
    return out
  }
  if (typeof v === 'object' && 'min' in v && 'max' in v) {
    out.push(String(v.min), String(v.max))
  }
  return out
}

function specsMatchAttacco(specs: ReadonlyArray<OdooCatalogSpec>, attacco: string): boolean {
  const needle = normalizeSocketToken(attacco)
  for (const spec of specs) {
    if (!SOCKET_SPEC_KEYS.has(spec.key)) continue
    for (const raw of collectSpecComparableValues(spec)) {
      const candidate = normalizeSocketToken(raw)
      if (!candidate) continue
      if (candidate === needle || candidate.includes(needle) || needle.includes(candidate)) {
        return true
      }
    }
  }
  return false
}

function specsMatchColorTemp(specs: ReadonlyArray<OdooCatalogSpec>, colorTemp: string): boolean {
  const target = kelvinInteger(colorTemp)
  if (target == null) return false

  for (const spec of specs) {
    if (!KELVIN_SPEC_KEYS.has(spec.key)) continue

    const v = spec.value
    if (typeof v === 'number' && v === target) return true
    if (typeof v === 'string' && kelvinInteger(v) === target) return true
    if (typeof v === 'object' && v && 'set' in v && Array.isArray(v.set)) {
      if (v.set.some((item) => Number(item) === target || kelvinInteger(String(item)) === target)) {
        return true
      }
    }
    if (typeof v === 'object' && v && 'min' in v && 'max' in v) {
      if (target >= v.min && target <= v.max) return true
    }
    for (const raw of collectSpecComparableValues(spec)) {
      if (kelvinInteger(raw) === target) return true
    }
  }
  return false
}

/**
 * Match filtri attacco/Kelvin sulle `specs` tipizzate del proxy (fonte primaria).
 * Fallback testuale solo se le specs non sono disponibili (cache legacy / card senza dettaglio).
 */
export function productMatchesSpecFilter(
  product: Pick<ProductCardDTO, 'name' | 'shortDescription' | 'specTags'> & {
    specs?: ReadonlyArray<OdooCatalogSpec> | null
  },
  filters: CatalogSpecFilters,
): boolean {
  if (!hasActiveSpecFilters(filters)) return true

  const specs = product.specs?.length ? product.specs : null
  if (specs) {
    if (filters.attacco?.trim() && !specsMatchAttacco(specs, filters.attacco)) return false
    if (filters.colorTemp?.trim() && !specsMatchColorTemp(specs, filters.colorTemp)) return false
    return true
  }

  // Fallback legacy: tag / titolo / descrizione
  const tags = buildTechnicalCardSpecTags({
    name: product.name,
    shortDescription: product.shortDescription,
    specTags: product.specTags,
  })
  const haystack = [...tags, product.name, product.shortDescription ?? '']
    .join(' ')
    .replace(/GU5[.\-_]?3/gi, 'GU5.3')

  if (filters.attacco?.trim()) {
    const needle = normalizeSocketToken(filters.attacco)
    if (!normalizeSocketToken(haystack).includes(needle)) return false
  }

  if (filters.colorTemp?.trim()) {
    const target = kelvinInteger(filters.colorTemp)
    if (target == null) return false
    const hay = haystack.replace(/\s/g, '').toUpperCase()
    if (!hay.includes(`${target}K`) && !hay.includes(String(target))) return false
  }

  return true
}

export function productMatchesCatalogTextQuery(
  product: Pick<ProductCardDTO, 'name' | 'shortDescription' | 'sku' | 'specTags'>,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [product.name, product.shortDescription, product.sku, ...(product.specTags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return q.split(/\s+/).every((token) => haystack.includes(token))
}
