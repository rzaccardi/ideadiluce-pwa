function compactBrandKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

/**
 * Toglie il brand in coda al titolo (es. «… Pirce Artemide» → «… Pirce»).
 * Il logo in card lo mostra già. «TLB Italy» vale come «TLB».
 */
export function omitTrailingBrandFromProductName(
  name: string,
  brand?: { name?: string | null; slug?: string | null } | null,
): string {
  const trimmed = name.trim()
  if (!trimmed || !brand) return trimmed

  const keys = [brand.name, brand.slug]
    .map((value) => (value ? compactBrandKey(value) : ''))
    .filter((value) => value.length >= 2)
  if (!keys.length) return trimmed

  const tokens = trimmed.split(/\s+/)
  const maxTake = Math.min(4, tokens.length - 1)
  for (let take = maxTake; take >= 1; take -= 1) {
    const suffixKey = compactBrandKey(tokens.slice(-take).join(' '))
    const matches = keys.some((key) => suffixKey === key || suffixKey === `${key}italy`)
    if (!matches) continue
    const rest = tokens
      .slice(0, -take)
      .join(' ')
      .replace(/[\s\-–—|·,/]+$/u, '')
      .trim()
    if (rest) return rest
  }

  return trimmed
}

/** Separa titolo breve (es. «Eclisse») dal resto del nome prodotto. */
export function extractProductDisplayTitle(name: string): { title: string; rest: string | null } {
  const match = name.match(/^(.+?)\s*[—–-]\s+(.+)$/)
  if (match && match[1].length <= 48) {
    return { title: match[1].trim(), rest: match[2].trim() }
  }
  return { title: name.trim(), rest: null }
}
