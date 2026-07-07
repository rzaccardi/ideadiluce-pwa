import type { HomePageContent } from '@/types/site-content'

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
    { key: 'sospensione', label: 'Sospensioni', href: '/negozio?world=design&q=sospensione' },
    { key: 'parete', label: 'Applique', href: '/negozio?world=design&q=applique' },
    { key: 'tavolo', label: 'Tavolo', href: '/negozio?world=design&q=tavolo' },
    { key: 'terra', label: 'Piantane', href: '/negozio?world=design&q=piantana' },
    { key: 'plafoniere', label: 'Plafoniere', href: '/negozio?world=design&q=plafoniere' },
    { key: 'faretto', label: 'Faretti', href: '/negozio?world=design&q=faretto' },
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
    linkLabel: 'Tutti i prodotti',
    linkHref: '/negozio?world=design',
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
      title: cms.designShowcase.title || DEFAULT_HOME2_IT.bestSellers.title,
      subtitle: cms.designShowcase.subtitle || DEFAULT_HOME2_IT.bestSellers.subtitle,
      linkLabel: cms.designShowcase.linkLabel || DEFAULT_HOME2_IT.bestSellers.linkLabel,
      linkHref: cms.designShowcase.linkHref || DEFAULT_HOME2_IT.bestSellers.linkHref,
    },
    inspiration: {
      ...DEFAULT_HOME2_IT.inspiration,
      title: cms.rooms.title || DEFAULT_HOME2_IT.inspiration.title,
      subtitle: cms.rooms.subtitle || DEFAULT_HOME2_IT.inspiration.subtitle,
    },
    brandsEyebrow: cms.brands.title || DEFAULT_HOME2_IT.brandsEyebrow,
  }
}

/** Assegna immagini catalogo a tile/indici in modo deterministico. */
export function pickCatalogImages(
  products: ReadonlyArray<{ imageUrl?: string | null; slug: string }>,
  count: number,
): string[] {
  const urls = products
    .map((p) => p.imageUrl?.trim())
    .filter((url): url is string => Boolean(url))
  if (!urls.length) return []

  const picked: string[] = []
  for (let i = 0; i < count; i += 1) {
    picked.push(urls[i % urls.length]!)
  }
  return picked
}
