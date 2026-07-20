import type { HomePageContent } from '@/types/site-content'
import type { ProductCardDTO } from '@/types/dto'
import { FALLBACK_ROOM_ITEMS } from '@/lib/mobile-nav-visuals'

export const HOME2_PLACEHOLDER_IMAGES = {
  hero: '/site/images/lamp-pendant.webp',
  split: [
    '/site/images/lamp-sphere.webp',
    '/site/images/look-cucina.webp',
  ] as const,
  categoryByKey: {
    sospensione: '/site/images/lamp-pendant.webp',
    parete: '/site/images/lamp-applique.webp',
    tavolo: '/site/images/lamp-table.webp',
    terra: '/site/images/lamp-floor.webp',
    plafoniere: '/site/images/lamp-sphere.webp',
    faretto: '/site/images/prod-spot.webp',
  } satisfies Record<string, string>,
  inspiration: [
    '/site/images/lk-1.webp',
    '/site/images/lk-2.webp',
    '/site/images/lk-3.webp',
    '/site/images/lk-4.webp',
    '/site/images/look-cucina.webp',
    '/site/images/lamp-pendant.webp',
    '/site/images/lamp-applique.webp',
    '/site/images/lamp-table.webp',
  ] as const,
} as const

export type Home2ShowcasePlaceholder = {
  slug: string
  name: string
  shortDescription: string
  imageUrl: string
  href: string
  categorySlug: string
}

export const HOME2_PLACEHOLDER_SHOWCASE: Home2ShowcasePlaceholder[] = [
  {
    slug: 'placeholder-sospensione',
    name: 'Sospensioni design',
    shortDescription: 'Pezzi iconici per zona pranzo e living',
    imageUrl: '/site/images/lamp-pendant.webp',
    href: '/negozio?world=design&tipologia=sospensione',
    categorySlug: 'DESIGN',
  },
  {
    slug: 'placeholder-applique',
    name: 'Applique da parete',
    shortDescription: 'Luce laterale e atmosfera',
    imageUrl: '/site/images/lamp-applique.webp',
    href: '/negozio?world=design&tipologia=parete',
    categorySlug: 'DESIGN',
  },
  {
    slug: 'placeholder-tavolo',
    name: 'Lampade da tavolo',
    shortDescription: 'Complementi per scrivania e comodino',
    imageUrl: '/site/images/lamp-table.webp',
    href: '/negozio?world=design&tipologia=tavolo',
    categorySlug: 'DESIGN',
  },
  {
    slug: 'placeholder-piantana',
    name: 'Piantane',
    shortDescription: 'Luce d\'accento e lettura',
    imageUrl: '/site/images/lamp-floor.webp',
    href: '/negozio?world=design&tipologia=terra',
    categorySlug: 'DESIGN',
  },
  {
    slug: 'placeholder-plafoniera',
    name: 'Plafoniere',
    shortDescription: 'Illuminazione generale con carattere',
    imageUrl: '/site/images/lamp-sphere.webp',
    href: '/negozio?world=design&tipologia=plafoniere',
    categorySlug: 'DESIGN',
  },
  {
    slug: 'placeholder-faretto',
    name: 'Faretti e incasso',
    shortDescription: 'Fascio direzionale e scenografie',
    imageUrl: '/site/images/prod-spot.webp',
    href: '/negozio?world=design&tipologia=incasso',
    categorySlug: 'DESIGN',
  },
  {
    slug: 'placeholder-soggiorno',
    name: 'Soggiorno',
    shortDescription: 'Composizioni per il living',
    imageUrl: '/site/images/room-soggiorno.webp',
    href: '/ambienti/soggiorno',
    categorySlug: 'AMBIENTE',
  },
  {
    slug: 'placeholder-cucina',
    name: 'Cucina',
    shortDescription: 'Luce funzionale e calda',
    imageUrl: '/site/images/room-cucina.webp',
    href: '/ambienti/cucina',
    categorySlug: 'AMBIENTE',
  },
]

export type Home2CategoryTile = {
  key: string
  label: string
  href: string
}

export type Home2PromoItem = {
  label: string
  description: string
}

export type Home2SplitBlock = {
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
  href: string
}

export type Home2PageContent = {
  hero: {
    eyebrow: string
    title: string
    description: string
    ctaLabel: string
    ctaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
  }
  promos: Home2PromoItem[]
  splitBlocks: [Home2SplitBlock, Home2SplitBlock]
  categoryTiles: Home2CategoryTile[]
  bestSellers: {
    eyebrow: string
    title: string
    subtitle: string
    linkLabel: string
    linkHref: string
  }
  inspiration: {
    eyebrow: string
    title: string
    subtitle: string
    linkLabel: string
    linkHref: string
  }
  brandsEyebrow: string
}

export const DEFAULT_HOME2_IT: Home2PageContent = {
  hero: {
    eyebrow: 'Illuminazione d\'arredo',
    title: 'La luce che definisce lo spazio',
    description:
      'Sospensioni iconiche, applique scultoree e piantane di design. Selezioniamo brand, finiture e composizioni per ambienti che meritano carattere.',
    ctaLabel: 'Esplora il catalogo',
    ctaHref: '/illuminazione-arredo',
    secondaryCtaLabel: 'Prenota in showroom',
    secondaryCtaHref: '/contatti',
  },
  promos: [
    { label: 'Showroom Roma', description: 'Consulenza e composizione luce' },
    { label: 'Brand internazionali', description: 'Artemide, Flos, FontanaArte…' },
    { label: 'Spedizione tracciata', description: 'In tutta Italia' },
    { label: 'Assistenza reale', description: 'Prima e dopo l\'acquisto' },
  ],
  splitBlocks: [
    {
      eyebrow: 'Catalogo design',
      title: 'Illuminazione d\'arredo',
      description: 'Lampade, sospensioni e complementi per chi cerca estetica, materia e luce scenografica.',
      ctaLabel: 'Scopri la selezione',
      href: '/illuminazione-arredo',
    },
    {
      eyebrow: 'Shop the look',
      title: 'Acquista per ambiente',
      description: 'Soggiorno, cucina, camera e outdoor: composizioni già pensate per ogni stanza.',
      ctaLabel: 'Scegli l\'ambiente',
      href: '/acquista-ambiente',
    },
  ],
  categoryTiles: [
    { key: 'sospensione', label: 'Sospensioni', href: '/negozio?world=design&tipologia=sospensione' },
    { key: 'parete', label: 'Applique', href: '/negozio?world=design&tipologia=parete' },
    { key: 'tavolo', label: 'Tavolo', href: '/negozio?world=design&tipologia=tavolo' },
    { key: 'terra', label: 'Piantane', href: '/negozio?world=design&tipologia=terra' },
    { key: 'plafoniere', label: 'Plafoniere', href: '/negozio?world=design&tipologia=plafoniere' },
    { key: 'faretto', label: 'Faretti', href: '/negozio?world=design&tipologia=incasso' },
  ],
  bestSellers: {
    eyebrow: 'In evidenza',
    title: 'I pezzi più richiesti',
    subtitle: 'Selezione curata dal catalogo arredo — pronta consegna e su ordinazione.',
    linkLabel: 'Vedi tutto',
    linkHref: '/illuminazione-arredo',
  },
  inspiration: {
    eyebrow: 'Lasciati ispirare',
    title: 'Design che si vede',
    subtitle: 'Scorri la selezione visiva: ogni prodotto è una scelta di stile.',
    linkLabel: 'Tutti gli ambienti',
    linkHref: '/acquista-ambiente',
  },
  brandsEyebrow: 'I brand che amiamo',
}

/** Arricchisce copy homepage2 con dati CMS home quando disponibili. */
export function mergeHome2Content(cms: HomePageContent | null): Home2PageContent {
  if (!cms) return DEFAULT_HOME2_IT

  return {
    ...DEFAULT_HOME2_IT,
    hero: {
      ...DEFAULT_HOME2_IT.hero,
      eyebrow: cms.hero.design.eyebrow || DEFAULT_HOME2_IT.hero.eyebrow,
      title: cms.hero.design.title || DEFAULT_HOME2_IT.hero.title,
      description: cms.hero.design.description || DEFAULT_HOME2_IT.hero.description,
      ctaLabel: cms.hero.design.ctaLabel || DEFAULT_HOME2_IT.hero.ctaLabel,
      ctaHref: cms.hero.design.ctaHref || DEFAULT_HOME2_IT.hero.ctaHref,
    },
    bestSellers: {
      ...DEFAULT_HOME2_IT.bestSellers,
      eyebrow: cms.designShowcase.eyebrow || DEFAULT_HOME2_IT.bestSellers.eyebrow,
      title: cms.designShowcase.title || DEFAULT_HOME2_IT.bestSellers.title,
      subtitle: cms.designShowcase.subtitle || DEFAULT_HOME2_IT.bestSellers.subtitle,
      linkLabel: cms.designShowcase.linkLabel || DEFAULT_HOME2_IT.bestSellers.linkLabel,
      linkHref: cms.designShowcase.linkHref || DEFAULT_HOME2_IT.bestSellers.linkHref,
    },
    inspiration: {
      ...DEFAULT_HOME2_IT.inspiration,
      eyebrow: cms.rooms.eyebrow || DEFAULT_HOME2_IT.inspiration.eyebrow,
      title: cms.rooms.title || DEFAULT_HOME2_IT.inspiration.title,
      subtitle: cms.rooms.subtitle || DEFAULT_HOME2_IT.inspiration.subtitle,
    },
    brandsEyebrow: cms.brands.title || DEFAULT_HOME2_IT.brandsEyebrow,
  }
}

export function resolveHome2CategoryPlaceholder(key: string, index = 0): string {
  const mapped = HOME2_PLACEHOLDER_IMAGES.categoryByKey[key as keyof typeof HOME2_PLACEHOLDER_IMAGES.categoryByKey]
  if (mapped) return mapped
  return HOME2_PLACEHOLDER_IMAGES.inspiration[index % HOME2_PLACEHOLDER_IMAGES.inspiration.length]!
}

/** Assegna immagini catalogo a tile/indici in modo deterministico, con fallback placeholder. */
export function pickCatalogImages(
  products: ReadonlyArray<{ imageUrl?: string | null; slug: string }>,
  count: number,
  fallbacks: ReadonlyArray<string> = [],
): string[] {
  const urls = products
    .map((p) => p.imageUrl?.trim())
    .filter((url): url is string => Boolean(url))

  const picked: string[] = []
  for (let i = 0; i < count; i += 1) {
    picked.push(
      urls[i] ?? urls[i % Math.max(urls.length, 1)] ?? fallbacks[i] ?? fallbacks[i % Math.max(fallbacks.length, 1)] ?? '',
    )
  }
  return picked
}

export function resolveHome2HeroImage(products: ReadonlyArray<{ imageUrl?: string | null }>): string {
  return products[0]?.imageUrl?.trim() || HOME2_PLACEHOLDER_IMAGES.hero
}

export function resolveHome2Rooms(cms: HomePageContent) {
  const items = cms.rooms.items?.filter((room) => room.imageUrl?.trim()) ?? []
  return items.length ? items : FALLBACK_ROOM_ITEMS
}

function hasProductImage(product: ProductCardDTO): boolean {
  return Boolean(product.imageUrl?.trim())
}

export function toHome2PlaceholderProduct(item: Home2ShowcasePlaceholder): ProductCardDTO {
  return {
    slug: item.slug,
    locale: 'it',
    name: item.name,
    shortDescription: item.shortDescription,
    priceCents: 0,
    priceDisplayMode: 'ex_vat',
    currency: 'EUR',
    imageUrl: item.imageUrl,
    categorySlug: item.categorySlug,
    inStock: true,
  }
}

export function resolveHome2ShowcaseProducts(
  products: ReadonlyArray<ProductCardDTO>,
  limit = 8,
): { products: ProductCardDTO[]; placeholderHrefs: Record<string, string> } {
  const catalog = products.filter(hasProductImage).slice(0, limit)

  if (catalog.length >= limit) {
    return { products: catalog, placeholderHrefs: {} }
  }

  const placeholders = HOME2_PLACEHOLDER_SHOWCASE.slice(0, limit - catalog.length)
  const placeholderHrefs = Object.fromEntries(placeholders.map((item) => [item.slug, item.href]))

  if (catalog.length === 0) {
    const all = HOME2_PLACEHOLDER_SHOWCASE.slice(0, limit)
    return {
      products: all.map(toHome2PlaceholderProduct),
      placeholderHrefs: Object.fromEntries(all.map((item) => [item.slug, item.href])),
    }
  }

  return {
    products: [...catalog, ...placeholders.map(toHome2PlaceholderProduct)],
    placeholderHrefs,
  }
}
