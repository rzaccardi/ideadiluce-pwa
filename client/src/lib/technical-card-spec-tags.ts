import type { ArflySpec } from '@/lib/arfly/types'

const MAX_TAGS = 3

/** Chiavi Arfly in ordine di priorità per i chip filtro in card tecnica. */
const ARFLY_SPEC_KEY_PRIORITY = [
  'socket_type',
  'lamp_holder',
  'portalampade',
  'wattage',
  'power',
  'output_voltage',
  'input_voltage',
  'voltage',
  'ip_rating',
  'ip_protection',
  'output_current',
  'current',
  'source_technology',
  'technology',
  'dimming_type',
  'bulb_shape',
  'lamp_type',
  'color_temperature_k',
] as const

const EXPLICIT_SOCKET_RE =
  /\b(?:attacco|portalampade?)\s+(E27|E14|GU10|GU5[.-]3|GX53|G9|G4|G5|G13|R7s|R7S|T5|T8|AR111|MR16|G53)\b/i
const SOCKET_RE =
  /\b(E27|E14|GU10|GU5[.-]3|GX53|G9|G4|G5|G13|R7s|R7S|T5|T8|AR111|MR16|G53)\b/gi
const POWER_RE = /\b(\d+(?:[.,]\d+)?)\s*W\b/gi
const VOLTAGE_RE = /\b(\d+(?:[–-]\d+)?)\s*V\b/gi
const IP_RE = /\b(IP\d{2})\b/gi
const CURRENT_RE = /\b(\d+(?:[.,]\d+)?)\s*mA\b/gi
const KELVIN_RE = /\b(\d{3,4})\s*K\b/gi
const TECH_RE = /\b(TRIAC|DALI|0-10V|LED|Fluorescente|alogena|starter|ceramica)\b/gi

function normalizeSocket(value: string): string {
  return value.replace(/GU5[.-]3/i, 'GU5.3').replace(/^r7s$/i, 'R7s').toUpperCase()
}

function compactWattage(value: string): string {
  const n = value.replace(',', '.').replace(/[^\d.]/g, '')
  if (!n) return value.trim()
  const parsed = Number.parseFloat(n)
  if (!Number.isFinite(parsed)) return `${value.trim()}W`
  const rounded = parsed % 1 === 0 ? String(parsed) : String(parsed)
  return `${rounded}W`
}

function compactVoltage(value: string): string {
  return `${value.replace(/\s/g, '')}V`.replace(/VV$/i, 'V')
}

function compactKelvin(value: string): string {
  return `${value.replace(/\s/g, '')}K`.replace(/KK$/i, 'K')
}

function compactCurrent(value: string): string {
  const n = value.replace(',', '.').replace(/[^\d.]/g, '')
  if (!n) return value.trim()
  const parsed = Number.parseFloat(n)
  return Number.isFinite(parsed) ? `${parsed % 1 === 0 ? parsed : parsed}mA` : `${value.trim()}mA`
}

function compactSpecDisplay(spec: ArflySpec): string | null {
  const raw = spec.display?.trim()
  if (!raw || raw === 'No' || raw === 'Sì') return null

  switch (spec.key) {
    case 'socket_type':
    case 'lamp_holder':
    case 'portalampade':
    case 'bulb_shape':
    case 'lamp_type':
      return normalizeSocket(raw)
    case 'wattage':
    case 'power':
      return compactWattage(raw)
    case 'output_voltage':
    case 'input_voltage':
    case 'voltage':
      return compactVoltage(raw.replace(/\s*V$/i, ''))
    case 'output_current':
    case 'current':
      return compactCurrent(raw)
    case 'color_temperature_k':
      return compactKelvin(raw.replace(/\s*K$/i, ''))
    case 'ip_rating':
    case 'ip_protection':
      return raw.toUpperCase()
    case 'source_technology':
    case 'technology':
    case 'dimming_type':
      return raw.length <= 12 ? raw : raw.split(/\s+/).slice(0, 2).join(' ')
    default:
      return raw.length <= 16 ? raw : null
  }
}

function pushUniqueTag(tags: string[], seen: Set<string>, tag: string | null | undefined) {
  if (!tag) return
  const normalized = tag.trim()
  if (!normalized) return
  const key = normalized.toLowerCase()
  if (seen.has(key)) return
  seen.add(key)
  tags.push(normalized)
}

export function buildTechnicalCardSpecTagsFromSpecs(specs: ReadonlyArray<ArflySpec>): string[] {
  const tags: string[] = []
  const seen = new Set<string>()

  for (const key of ARFLY_SPEC_KEY_PRIORITY) {
    const spec = specs.find((s) => s.key === key)
    if (!spec) continue
    pushUniqueTag(tags, seen, compactSpecDisplay(spec))
    if (tags.length >= MAX_TAGS) break
  }

  return tags
}

function firstSocketTag(text: string): string | null {
  const explicit = EXPLICIT_SOCKET_RE.exec(text)
  if (explicit?.[1]) return normalizeSocket(explicit[1])

  SOCKET_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = SOCKET_RE.exec(text))) {
    const value = match[1]
    if (!value) continue
    if (/^T[58]$/i.test(value) && /\battacco\s+G/i.test(text)) continue
    return normalizeSocket(value)
  }
  return null
}

function firstMatch(text: string, re: RegExp, map?: (value: string) => string): string | null {
  re.lastIndex = 0
  const match = re.exec(text)
  if (!match) return null
  const value = match[1] ?? match[0]
  return map ? map(value) : value
}

export function extractTechnicalCardSpecTagsFromText(
  name: string,
  shortDescription?: string | null,
): string[] {
  const text = [name, shortDescription].filter(Boolean).join(' · ')
  const tags: string[] = []
  const seen = new Set<string>()

  pushUniqueTag(tags, seen, firstSocketTag(text))

  const power = firstMatch(text, POWER_RE, (v) => compactWattage(v))
  pushUniqueTag(tags, seen, power)

  const voltage = firstMatch(text, VOLTAGE_RE, (v) => compactVoltage(v))
  pushUniqueTag(tags, seen, voltage)

  const ip = firstMatch(text, IP_RE, (v) => v.toUpperCase())
  pushUniqueTag(tags, seen, ip)

  const current = firstMatch(text, CURRENT_RE, (v) => compactCurrent(v))
  pushUniqueTag(tags, seen, current)

  TECH_RE.lastIndex = 0
  let techMatch: RegExpExecArray | null
  while ((techMatch = TECH_RE.exec(text)) && tags.length < MAX_TAGS) {
    pushUniqueTag(tags, seen, techMatch[1])
  }

  if (tags.length < MAX_TAGS) {
    const kelvin = firstMatch(text, KELVIN_RE, (v) => compactKelvin(v))
    pushUniqueTag(tags, seen, kelvin)
  }

  return tags.slice(0, MAX_TAGS)
}

type BuildInput = {
  name: string
  shortDescription?: string | null
  specs?: ReadonlyArray<ArflySpec>
  specTags?: ReadonlyArray<string>
}

export function buildTechnicalCardSpecTags(input: BuildInput): string[] {
  if (input.specTags?.length) {
    return input.specTags.slice(0, MAX_TAGS)
  }
  if (input.specs?.length) {
    const fromSpecs = buildTechnicalCardSpecTagsFromSpecs(input.specs)
    if (fromSpecs.length) return fromSpecs
  }
  return extractTechnicalCardSpecTagsFromText(input.name, input.shortDescription)
}
