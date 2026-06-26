/** Separa titolo breve (es. «Eclisse») dal resto del nome prodotto. */
export function extractProductDisplayTitle(name: string): { title: string; rest: string | null } {
  const match = name.match(/^(.+?)\s*[—–-]\s+(.+)$/)
  if (match && match[1].length <= 48) {
    return { title: match[1].trim(), rest: match[2].trim() }
  }
  return { title: name.trim(), rest: null }
}
