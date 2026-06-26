import { fieldLabel, isTechnicalField } from './site-content-labels'

function normalizeSearch(query: string) {
  return query.trim().toLowerCase()
}

function stringMatches(value: string, query: string, fieldKey: string | null) {
  if (!query) return true
  const label = fieldKey ? fieldLabel(fieldKey).toLowerCase() : ''
  const haystack = `${label} ${fieldKey ?? ''} ${value}`.toLowerCase()
  return haystack.includes(query)
}

export function contentMatchesSearch(value: unknown, query: string, fieldKey: string | null = null): boolean {
  const normalized = normalizeSearch(query)
  if (!normalized) return true

  if (typeof value === 'string') {
    return stringMatches(value, normalized, fieldKey)
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    const label = fieldKey ? fieldLabel(fieldKey).toLowerCase() : ''
    return `${label} ${fieldKey ?? ''} ${String(value)}`.toLowerCase().includes(normalized)
  }

  if (Array.isArray(value)) {
    return value.some((item, index) => contentMatchesSearch(item, normalized, fieldKey ?? String(index)))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(([key, child]) =>
      contentMatchesSearch(child, normalized, key),
    )
  }

  return false
}

export function countEditableFields(value: unknown): number {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return 1
  }

  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + countEditableFields(item), 0)
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (sum, child) => sum + countEditableFields(child),
      0,
    )
  }

  return 0
}

export function countTranslatableFields(value: unknown, fieldKey: string | null = null): number {
  if (typeof value === 'string') {
    return fieldKey && isTechnicalField(fieldKey) ? 0 : 1
  }

  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + countTranslatableFields(item, fieldKey), 0)
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<number>(
      (sum, [key, child]) => sum + countTranslatableFields(child, key),
      0,
    )
  }

  return 0
}
