/**
 * Pulisce HTML/descrizioni esportate da WooCommerce/WordPress.
 * Rimuove sequenze \r\n letterali, a capo spurii e spazi tra tag.
 */
export function normalizeWooContent(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null

  let s = raw
    // Entità numeriche WordPress per CRLF
    .replace(/&#(?:13|x0*d);?/gi, '')
    .replace(/&#(?:10|x0*a);?/gi, '')
    // Sequenze escape letterali (visibili in pagina come "\r\n")
    .replace(/\\r\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\n/g, '\n')
    // A capo reali
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Zero-width / BOM sporadici
    .replace(/[\u200B-\u200D\uFEFF]/g, '')

  // Tra tag HTML: niente newline (evita "\r\n" visibili e buchi)
  s = s.replace(/>\s*\n+\s*</g, '><')

  // Testo tra tag: newline → spazio (es. "</h3>\nTitolo\n<div>")
  s = s.replace(/>([^<]+)</g, (_, text: string) => {
    const cleaned = text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim()
    return cleaned ? `>${cleaned}<` : '><'
  })

  // Paragrafi / righe vuote ripetute
  s = s.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
  s = s.replace(/(<br\s*\/?>\s*){3,}/gi, '<br />')

  // Export phpMyAdmin / editor Woo: href=\"https://...\" → href="https://..."
  s = s.replace(/\\"/g, '"')

  // href=""https://..."" o href="https://..." con virgolette spurie
  s = s.replace(
    /\b(href|src)\s*=\s*"+([^"]+)"+/gi,
    (_, attr: string, url: string) => `${attr}="${url.trim()}"`,
  )

  // Link esterni: apri in nuova scheda (comportamento Woo)
  s = s.replace(
    /<a\s+([^>]*href="https?:\/\/[^"]+"[^>]*)>/gi,
    (_match, attrs: string) => {
      if (/\btarget=/i.test(attrs)) return `<a ${attrs}>`
      if (/\brel=/i.test(attrs)) {
        return `<a ${attrs.replace(/rel="([^"]*)"/i, 'rel="$1 noopener noreferrer"')}>`
      }
      return `<a ${attrs} target="_blank" rel="noopener noreferrer">`
    },
  )

  // Spazi multipli (non dentro tag — approssimazione sufficiente per export Woo)
  s = s.replace(/\s{2,}/g, ' ')

  s = s.trim()
  return s || null
}

export function normalizeWooExcerpt(raw: string | null | undefined, maxLen = 300): string | null {
  const html = normalizeWooContent(raw)
  if (!html) return null
  const plain = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!plain) return null
  return plain.length > maxLen ? `${plain.slice(0, maxLen - 1)}…` : plain
}
