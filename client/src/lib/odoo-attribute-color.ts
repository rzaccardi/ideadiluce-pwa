/**
 * Colore swatch da valori attributo Odoo (`product.attribute.value.html_color`).
 * Accetta hex / RGB; non mappa per nome (evita pallini di un altro valore).
 */

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_FN_RE =
  /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})(?:\s*[,/]\s*[\d.]+)?\s*\)$/i
const RGB_CSV_RE = /^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/

const COLOR_FIELD_KEYS = [
  'html_color',
  'htmlColor',
  'color_hex',
  'hex',
  'color_rgb',
  'rgb',
  'color',
] as const

function clampByte(n: number): number | null {
  if (!Number.isFinite(n) || n < 0 || n > 255) return null
  return Math.round(n)
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

function expandHexBody(body: string): string {
  const lower = body.toLowerCase()
  if (lower.length === 3) return lower.split('').map((c) => c + c).join('')
  if (lower.length === 8) return lower.slice(0, 6)
  return lower
}

/** Normalizza un codice Odoo (hex, rgb, intero packed) in `#rrggbb`, o null. */
export function parseCssColorFromOdoo(raw: unknown): string | null {
  if (raw == null || raw === false) return null

  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw <= 0xffffff) {
    return toHex((raw >> 16) & 255, (raw >> 8) & 255, raw & 255)
  }

  if (Array.isArray(raw) && raw.length >= 3) {
    const r = clampByte(Number(raw[0]))
    const g = clampByte(Number(raw[1]))
    const b = clampByte(Number(raw[2]))
    if (r == null || g == null || b == null) return null
    return toHex(r, g, b)
  }

  if (typeof raw === 'object') {
    const rec = raw as Record<string, unknown>
    const r = clampByte(Number(rec.r ?? rec.red))
    const g = clampByte(Number(rec.g ?? rec.green))
    const b = clampByte(Number(rec.b ?? rec.blue))
    if (r == null || g == null || b == null) return null
    return toHex(r, g, b)
  }

  if (typeof raw !== 'string') return null
  const s = raw.trim()
  if (!s) return null

  const hex = HEX_RE.exec(s)
  if (hex) return `#${expandHexBody(hex[1])}`

  const rgbFn = RGB_FN_RE.exec(s)
  if (rgbFn) {
    const r = clampByte(Number(rgbFn[1]))
    const g = clampByte(Number(rgbFn[2]))
    const b = clampByte(Number(rgbFn[3]))
    if (r == null || g == null || b == null) return null
    return toHex(r, g, b)
  }

  const csv = RGB_CSV_RE.exec(s)
  if (csv) {
    const r = clampByte(Number(csv[1]))
    const g = clampByte(Number(csv[2]))
    const b = clampByte(Number(csv[3]))
    if (r == null || g == null || b == null) return null
    return toHex(r, g, b)
  }

  return null
}

function embeddedCssColor(value: string): string | null {
  const hex = /#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/i.exec(value)
  if (hex) return parseCssColorFromOdoo(hex[0])
  const rgb = /rgba?\(\s*\d{1,3}\s*[, ]\s*\d{1,3}\s*[, ]\s*\d{1,3}(?:\s*[,/]\s*[\d.]+)?\s*\)/i.exec(
    value,
  )
  if (rgb) return parseCssColorFromOdoo(rgb[0])
  return null
}

/** Legge `html_color` (e alias) da un attributo variante OdooCatalog. */
export function htmlColorFromOdooAttribute(attr: object | null | undefined): string | undefined {
  if (!attr || typeof attr !== 'object') return undefined
  const rec = attr as Record<string, unknown>
  for (const key of COLOR_FIELD_KEYS) {
    const val = rec[key]
    // `color` intero in Odoo è spesso l'indice kanban (0–11), non RGB packed.
    if (key === 'color' && typeof val === 'number') continue
    const parsed = parseCssColorFromOdoo(val)
    if (parsed) return parsed
  }
  if (typeof rec.value === 'string') {
    const fromValue = parseCssColorFromOdoo(rec.value) ?? embeddedCssColor(rec.value)
    if (fromValue) return fromValue
  }
  return undefined
}
