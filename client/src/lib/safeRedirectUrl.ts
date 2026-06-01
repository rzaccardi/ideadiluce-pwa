/** Accetta solo http/https per evitare javascript: e schemi pericolosi in redirect UI. */
export function safeHttpUrlForRedirect(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  try {
    const u = new URL(raw.trim())
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString()
    return null
  } catch {
    return null
  }
}
