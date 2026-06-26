import type { ArflySpec } from '../adapters/arfly/arfly.types.js'

const MAX_TAGS = 3

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

function compactSpecDisplay(spec: ArflySpec): string | null {
  const raw = spec.display?.trim()
  if (!raw || raw === 'No' || raw === 'Sì') return null

  switch (spec.key) {
    case 'socket_type':
    case 'lamp_holder':
    case 'portalampade':
    case 'bulb_shape':
    case 'lamp_type':
      return raw.replace(/GU5[.-]3/i, 'GU5.3')
    case 'wattage':
    case 'power': {
      const n = raw.replace(',', '.').replace(/[^\d.]/g, '')
      const parsed = Number.parseFloat(n)
      return Number.isFinite(parsed) ? `${parsed}W`.replace('.0W', 'W') : raw
    }
    case 'output_voltage':
    case 'input_voltage':
    case 'voltage':
      return `${raw.replace(/\s*V$/i, '').replace(/\s/g, '')}V`
    case 'output_current':
    case 'current': {
      const n = raw.replace(',', '.').replace(/[^\d.]/g, '')
      const parsed = Number.parseFloat(n)
      return Number.isFinite(parsed) ? `${parsed}mA` : raw
    }
    case 'color_temperature_k':
      return `${raw.replace(/\s*K$/i, '').replace(/\s/g, '')}K`
    case 'ip_rating':
    case 'ip_protection':
      return raw.toUpperCase()
    default:
      return raw.length <= 16 ? raw : null
  }
}

export function buildTechnicalCardSpecTagsFromSpecs(specs: ReadonlyArray<ArflySpec>): string[] {
  const tags: string[] = []
  const seen = new Set<string>()

  for (const key of ARFLY_SPEC_KEY_PRIORITY) {
    const spec = specs.find((s) => s.key === key)
    if (!spec) continue
    const tag = compactSpecDisplay(spec)
    if (!tag) continue
    const dedupe = tag.toLowerCase()
    if (seen.has(dedupe)) continue
    seen.add(dedupe)
    tags.push(tag)
    if (tags.length >= MAX_TAGS) break
  }

  return tags
}
