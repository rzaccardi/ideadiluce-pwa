const NAMED_HTML_ENTITIES: Record<string, string> = {
  apos: "'",
  quot: '"',
  amp: '&',
  lt: '<',
  gt: '>',
  nbsp: '\u00a0',
}

export function decodeDeepLHtmlEntities(text: string): string {
  if (!text.includes('&')) return text

  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (entity, name: string) => NAMED_HTML_ENTITIES[name] ?? entity)
}

export function decodeDeepLHtmlEntitiesInTree<T>(value: T): T {
  if (typeof value === 'string') {
    return decodeDeepLHtmlEntities(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => decodeDeepLHtmlEntitiesInTree(item)) as T
  }

  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      next[key] = decodeDeepLHtmlEntitiesInTree(child)
    }
    return next as T
  }

  return value
}
