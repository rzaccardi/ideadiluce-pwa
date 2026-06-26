export function parseInlineStyle(style: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of style.split(';')) {
    const idx = part.indexOf(':')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (key) out[key] = value
  }
  return out
}

export function mergeInlineStyles(base: string, extra: string): string {
  const merged = { ...parseInlineStyle(base), ...parseInlineStyle(extra) }
  return Object.entries(merged)
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}
