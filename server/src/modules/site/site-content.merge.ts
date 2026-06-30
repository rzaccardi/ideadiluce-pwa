import { defaultSiteContent } from './site-content.defaults.js'
import type { SitePageKey } from './site.types.js'

function mergeContentBlocks(defaults: unknown[], saved: unknown): unknown[] {
  if (!Array.isArray(saved)) return structuredClone(defaults)
  const defaultBlocks = defaults as Array<{ kind?: string }>
  const savedBlocks = saved as Array<{ kind?: string }>
  const savedKinds = new Set(savedBlocks.map((block) => block?.kind).filter(Boolean))
  const merged = [...savedBlocks]
  for (const block of defaultBlocks) {
    if (block?.kind && !savedKinds.has(block.kind)) {
      merged.push(structuredClone(block))
    }
  }
  return merged
}

function deepMergeDefaults<T>(defaults: T, saved: unknown, key?: string): T {
  if (saved === undefined || saved === null) {
    return structuredClone(defaults)
  }

  if (typeof defaults !== 'object' || defaults === null) {
    return saved as T
  }

  if (Array.isArray(defaults)) {
    if (key === 'blocks') {
      return mergeContentBlocks(defaults as unknown[], saved) as T
    }
    return (Array.isArray(saved) ? saved : defaults) as T
  }

  if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) {
    return saved as T
  }

  const base = structuredClone(defaults as Record<string, unknown>)
  const patch = saved as Record<string, unknown>

  for (const [key, value] of Object.entries(patch)) {
    if (key in base) {
      base[key] = deepMergeDefaults(base[key], value, key)
    } else {
      base[key] = value
    }
  }

  return base as T
}

export function mergeSiteContentWithDefaults(pageKey: SitePageKey, content: unknown) {
  const defaults = defaultSiteContent(pageKey)
  return deepMergeDefaults(defaults, content)
}
