import { translateTexts } from '../../lib/deepl/deepl.client.js'

const SKIP_TRANSLATE_KEYS = new Set([
  'href',
  'ctaHref',
  'linkHref',
  'imageUrl',
  'phoneHref',
  'whatsapp',
  'kind',
  'variant',
  'form',
  'layout',
  'id',
  'code',
  'num',
  'category',
  'searchQuery',
  'defaultQuery',
  'meta',
  'name',
  'phone',
  'email',
  'vat',
  'rea',
  'address',
  'company',
  'hours',
  'productCount',
  'noindex',
])

function shouldTranslateValue(key: string | null, value: string) {
  if (key && SKIP_TRANSLATE_KEYS.has(key)) return false
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return false
  }
  if (trimmed.includes('@') && trimmed.includes('.')) return false
  if (/^\+?[\d\s().-]{7,}$/.test(trimmed)) return false
  // Codici tecnici brevi (E27, GU10, IP65), non parole italiane da tradurre.
  if (
    !trimmed.includes(' ') &&
    trimmed.length <= 12 &&
    (/[0-9]/.test(trimmed) || trimmed === trimmed.toUpperCase())
  ) {
    return false
  }
  return true
}

type StringSlot = {
  path: string[]
  value: string
}

export function collectTranslatableStringSlots(
  value: unknown,
  path: string[] = [],
  key: string | null = null,
): StringSlot[] {
  if (typeof value === 'string') {
    if (!shouldTranslateValue(key, value)) return []
    return [{ path, value }]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectTranslatableStringSlots(item, [...path, String(index)], null),
    )
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([childKey, childValue]) =>
      collectTranslatableStringSlots(childValue, [...path, childKey], childKey),
    )
  }

  return []
}

function setAtPath(root: Record<string, unknown>, path: string[], nextValue: string) {
  let cursor: unknown = root
  for (let i = 0; i < path.length - 1; i += 1) {
    const segment = path[i]!
    if (Array.isArray(cursor)) {
      cursor = cursor[Number(segment)]
    } else if (cursor && typeof cursor === 'object') {
      cursor = (cursor as Record<string, unknown>)[segment]
    }
  }

  const last = path[path.length - 1]!
  if (Array.isArray(cursor)) {
    cursor[Number(last)] = nextValue
    return
  }
  if (cursor && typeof cursor === 'object') {
    ;(cursor as Record<string, unknown>)[last] = nextValue
  }
}

export function countTranslatableStrings(content: unknown) {
  return collectTranslatableStringSlots(content).length
}

export async function translateSiteContentTree(
  content: unknown,
  targetLocale: string,
  sourceLocale = 'IT',
): Promise<unknown> {
  const clone = structuredClone(content) as Record<string, unknown>
  const slots = collectTranslatableStringSlots(clone)
  if (slots.length === 0) return clone

  const translated = await translateTexts(
    slots.map((slot) => slot.value),
    targetLocale,
    sourceLocale,
  )

  slots.forEach((slot, index) => {
    setAtPath(clone, slot.path, translated[index] ?? slot.value)
  })

  return clone
}
