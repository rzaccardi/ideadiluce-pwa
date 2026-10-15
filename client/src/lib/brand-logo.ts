/**
 * Loghi marchi catalogo.
 *
 * 1. Overlay gestiti dal BO (`setManagedBrandLogos`) — light/dark su CDN.
 * 2. Fallback statico `/public/brands/{stem}.jpg` (solo light; in dark di solito testo).
 *
 * Gli asset statici sono JPG 150×32 con canvas bianco e padding irregolare.
 * Il crop (bbox contenuto) evita alone bianco / ritaglio incoerente in UI.
 * I loghi gestiti (PNG trasparente) usano canvas full-bleed senza crop.
 */

const BRAND_LOGO_STEMS = new Set([
  '3f-filippi',
  'artemide',
  'bega',
  'carlo-bezzi',
  'century',
  'dura-lamp',
  'eglo',
  'erc',
  'flos',
  'fontana-arte',
  'foscarini',
  'general-electric',
  'hitachi',
  'ideal-lux',
  'iguzzini',
  'kartell',
  'ledvance',
  'mazda',
  'mean-well',
  'osram',
  'pallucco',
  'philips',
  'sylvania',
  'tci',
  'tlb-1',
  'tlb-italy',
  'tridonic',
  'venini',
  'vossloh',
])

/** slug prodotto/API → stem file in `/brands` */
const BRAND_LOGO_ALIASES: Record<string, string> = {
  tlb: 'tlb-italy',
  tlbitaly: 'tlb-italy',
  'tlb-italy': 'tlb-italy',
  'tlb-1': 'tlb-1',
  duralamp: 'dura-lamp',
  'dura-lamp': 'dura-lamp',
  fontanaarte: 'fontana-arte',
  'fontana-arte': 'fontana-arte',
  ideallux: 'ideal-lux',
  'ideal-lux': 'ideal-lux',
  meanwell: 'mean-well',
  'mean-well': 'mean-well',
  generalelectric: 'general-electric',
  'general-electric': 'general-electric',
  '3ffilippi': '3f-filippi',
  '3f-filippi': '3f-filippi',
  carlobezzi: 'carlo-bezzi',
  'carlo-bezzi': 'carlo-bezzi',
  flos: 'flos',
  artemide: 'artemide',
  foscarini: 'foscarini',
  'i-guzzini': 'iguzzini',
  iguzzini: 'iguzzini',
}

/**
 * Bbox del wordmark [x0, y0, x1, y1] in frazioni del canvas 150×32
 * (padding bianco escluso, +1px di sicurezza antialias).
 */
const BRAND_LOGO_CONTENT: Record<string, readonly [number, number, number, number]> = {
  '3f-filippi': [0.12, 0.0312, 0.88, 0.9688],
  artemide: [0, 0.0625, 1, 0.9688],
  bega: [0.1733, 0, 0.8333, 1],
  'carlo-bezzi': [0.02, 0, 0.9867, 1],
  century: [0.3133, 0.0312, 0.6867, 0.9688],
  'dura-lamp': [0.18, 0, 0.82, 1],
  eglo: [0.1933, 0.0312, 0.8133, 1],
  erc: [0.2533, 0, 0.7467, 1],
  flos: [0.2533, 0.0312, 0.7467, 0.9688],
  'fontana-arte': [0, 0.125, 1, 0.875],
  foscarini: [0.0867, 0, 0.9133, 1],
  'general-electric': [0.1667, 0, 0.8267, 1],
  hitachi: [0.0133, 0.125, 0.9933, 0.9375],
  'ideal-lux': [0.0533, 0.0312, 0.96, 0.9688],
  iguzzini: [0.0867, 0, 0.92, 1],
  kartell: [0.1533, 0, 0.8467, 0.9688],
  ledvance: [0.0933, 0.0312, 0.9067, 0.9688],
  mazda: [0.0067, 0.0625, 0.9933, 0.9375],
  'mean-well': [0.32, 0, 0.68, 1],
  osram: [0.0933, 0.0625, 0.9067, 0.9375],
  pallucco: [0.0733, 0.0312, 0.9267, 1],
  philips: [0.0067, 0, 0.9933, 1],
  sylvania: [0, 0.125, 1, 0.9062],
  tci: [0.2133, 0, 0.7867, 1],
  'tlb-1': [0.3533, 0, 0.6467, 1],
  'tlb-italy': [0.0933, 0, 0.8933, 1],
  tridonic: [0, 0.0938, 1, 0.9062],
  venini: [0.02, 0.0312, 0.98, 0.9688],
  vossloh: [0, 0, 1, 1],
}

/** Canvas nativo degli asset in `/public/brands`. */
export const BRAND_LOGO_CANVAS = { width: 150, height: 32 } as const

/** [x0, y0, x1, y1] in 0–1 sul canvas. */
export type BrandLogoContentBox = readonly [number, number, number, number]

export type ResolvedBrandLogo = {
  src: string
  stem: string
  /** Bbox wordmark; se assente si usa l’intero canvas. */
  content: BrandLogoContentBox
  /** Origine: CDN gestito dal BO oppure JPG statico. */
  source: 'managed' | 'static'
}

export type ManagedBrandLogoUrls = {
  lightUrl: string | null
  darkUrl: string | null
}

const managedLogos = new Map<string, ManagedBrandLogoUrls>()

function normalizeLogoKey(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function resolveStem(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null
  const key = normalizeLogoKey(slug)
  const stem = BRAND_LOGO_ALIASES[key] ?? key
  if (!BRAND_LOGO_STEMS.has(stem)) return null
  return stem
}

function lookupManaged(slug: string | null | undefined): ManagedBrandLogoUrls | null {
  if (!slug?.trim()) return null
  const key = normalizeLogoKey(slug)
  const aliasStem = BRAND_LOGO_ALIASES[key]
  return managedLogos.get(key) ?? (aliasStem ? managedLogos.get(aliasStem) ?? null : null)
}

/** Popola/sostituisce la mappa loghi gestiti dal BO (bootstrap / brand-logos). */
export function setManagedBrandLogos(
  logos: Record<string, ManagedBrandLogoUrls> | null | undefined,
): void {
  managedLogos.clear()
  if (!logos) return
  for (const [slug, urls] of Object.entries(logos)) {
    const key = normalizeLogoKey(slug)
    if (!key) continue
    if (!urls.lightUrl && !urls.darkUrl) continue
    managedLogos.set(key, {
      lightUrl: urls.lightUrl ?? null,
      darkUrl: urls.darkUrl ?? null,
    })
  }
}

/** Merge incrementale da BrandListItemDTO (logoLightUrl / logoDarkUrl). */
export function mergeManagedBrandLogosFromBrands(
  brands: ReadonlyArray<{
    slug: string
    logoLightUrl?: string | null
    logoDarkUrl?: string | null
  }>,
): void {
  for (const brand of brands) {
    const key = normalizeLogoKey(brand.slug)
    if (!key) continue
    if (!brand.logoLightUrl && !brand.logoDarkUrl) continue
    managedLogos.set(key, {
      lightUrl: brand.logoLightUrl ?? null,
      darkUrl: brand.logoDarkUrl ?? null,
    })
  }
}

/** Path pubblico del logo brand (light), o `null` se non c’è asset. */
export function resolveBrandLogoSrc(slug: string | null | undefined): string | null {
  const managed = lookupManaged(slug)
  if (managed?.lightUrl) return managed.lightUrl
  const stem = resolveStem(slug)
  return stem ? `/brands/${stem}.jpg` : null
}

function staticStemFromUrl(url: string): string | null {
  const match = url.match(/\/brands\/([a-z0-9-]+)\.jpe?g(?:\?|$)/i)
  return match?.[1] ? match[1].toLowerCase() : null
}

function resolvedFromSrc(
  src: string,
  slug: string | null | undefined,
): ResolvedBrandLogo {
  const staticStem = staticStemFromUrl(src)
  if (staticStem) {
    return {
      src: `/brands/${staticStem}.jpg`,
      stem: staticStem,
      content: BRAND_LOGO_CONTENT[staticStem] ?? [0, 0, 1, 1],
      source: 'static',
    }
  }
  return {
    src,
    stem: normalizeLogoKey(slug ?? '') || 'managed',
    content: [0, 0, 1, 1],
    source: 'managed',
  }
}

/**
 * Logo risolto per tema.
 * - managed: URL CDN (dark dedicato se c’è, altrimenti light)
 * - static: JPG `/brands` con crop — stesso asset anche in dark mode
 */
export function resolveBrandLogo(
  slug: string | null | undefined,
  mode: 'light' | 'dark' = 'light',
): ResolvedBrandLogo | null {
  const managed = lookupManaged(slug)
  if (managed) {
    const src =
      mode === 'dark'
        ? managed.darkUrl || managed.lightUrl
        : managed.lightUrl || managed.darkUrl
    if (src) return resolvedFromSrc(src, slug)
  }

  const stem = resolveStem(slug)
  if (!stem) return null
  return {
    src: `/brands/${stem}.jpg`,
    stem,
    content: BRAND_LOGO_CONTENT[stem] ?? [0, 0, 1, 1],
    source: 'static',
  }
}

/** Aspect ratio del wordmark ritagliato (width / height). */
export function brandLogoContentAspect(content: BrandLogoContentBox): number {
  const [x0, y0, x1, y1] = content
  const cw = Math.max(0.01, x1 - x0)
  const ch = Math.max(0.01, y1 - y0)
  return (BRAND_LOGO_CANVAS.width * cw) / (BRAND_LOGO_CANVAS.height * ch)
}
