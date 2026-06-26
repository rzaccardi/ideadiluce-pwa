import { defaultSiteContent } from './site-content.defaults.js'
import type { SitePageKey } from './site.types.js'

function deepMergeDefaults<T>(defaults: T, saved: unknown): T {
  if (saved === undefined || saved === null) {
    return structuredClone(defaults)
  }

  if (typeof defaults !== 'object' || defaults === null) {
    return saved as T
  }

  if (Array.isArray(defaults)) {
    return (Array.isArray(saved) ? saved : defaults) as T
  }

  if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) {
    return saved as T
  }

  const base = structuredClone(defaults as Record<string, unknown>)
  const patch = saved as Record<string, unknown>

  for (const [key, value] of Object.entries(patch)) {
    if (key in base) {
      base[key] = deepMergeDefaults(base[key], value)
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
