export type ProductCardHoverGalleryItem = {
  type?: string
  tag?: string
  url?: string | null
}

/** Tag gallery che non sono foto ambientate (schede, misure, dettagli tecnici). */
const HOVER_EXCLUDE_TAGS = new Set([
  'attacco',
  'misure',
  'misura',
  'accesa',
  'applicazione',
  'dettaglio',
  'certificazione',
])

/**
 * Sceglie l’immagine hover stile FLOS per le card arredo.
 * 1. prima immagine taggata `ambiente`
 * 2. fallback: prima extra `foto` diversa dal packshot
 * Se manca una seconda foto utile → `null` (resta solo packshot).
 */
export function pickProductCardHoverImageUrl(
  gallery: readonly ProductCardHoverGalleryItem[] | null | undefined,
  packshotUrl: string | null | undefined,
  urlsMatch: (a: string | null | undefined, b: string | null | undefined) => boolean,
): string | null {
  if (!gallery?.length) return null

  const images = gallery.filter(
    (item): item is ProductCardHoverGalleryItem & { url: string } =>
      Boolean(item.url?.trim()) && (item.type ?? 'image') === 'image',
  )
  if (!images.length) return null

  const isDifferentFromPackshot = (url: string) => !packshotUrl?.trim() || !urlsMatch(url, packshotUrl)

  const ambiente = images.find(
    (item) => (item.tag || 'foto') === 'ambiente' && isDifferentFromPackshot(item.url),
  )
  if (ambiente) return ambiente.url

  const extra = images.find((item) => {
    const tag = item.tag || 'foto'
    if (HOVER_EXCLUDE_TAGS.has(tag)) return false
    return isDifferentFromPackshot(item.url)
  })
  return extra?.url ?? null
}
