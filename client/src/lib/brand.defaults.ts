import type { BrandListItemDTO } from '@/types/site-content'

export type BrandCategory =
  | 'design'
  | 'tecnico'
  | 'decorativo'
  | 'outdoor'
  | 'smart'
  | 'professionale'
  | 'made-in-italy'
  | 'lampadine'

export type BrandDisplayStyle = 'serif' | 'bold' | 'bold-accent'

export type BrandMeta = {
  slug: string
  name: string
  displayStyle: BrandDisplayStyle
  categories: BrandCategory[]
  description: string
  tags: string[]
  productLines: string
  featured?: boolean
  defaultProductCount?: number
}

export type BrandCard = {
  slug: string
  name: string
  displayStyle: BrandDisplayStyle
  categories: BrandCategory[]
  description: string
  tags: string[]
  productLines: string
  productCount: number
  href: string
  featured: boolean
}

export const BRAND_HERO = {
  eyebrow: 'DIRECTORY MARCHI',
  title: 'Brand di illuminazione',
  subtitle:
    'Scopri i marchi selezionati da IdeaDiLuce: lampade di design, lampadine, soluzioni LED, prodotti tecnici e illuminazione decorativa. Scegli il brand che conosci, o trovalo in base a cosa cerchi.',
  searchPlaceholder: 'Cerca per marchio, categoria o prodotto',
  searchCta: 'Cerca',
}

export const BRAND_HERO_FILTERS: { id: BrandCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tutti' },
  { id: 'design', label: 'Design' },
  { id: 'tecnico', label: 'Tecnici' },
  { id: 'lampadine', label: 'Lampadine' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'smart', label: 'Smart' },
  { id: 'professionale', label: 'Professionale' },
  { id: 'made-in-italy', label: 'Made in Italy' },
]

/** Brand a catalogo Odoo (facet live). `defaultProductCount` = snapshot di riferimento. */
export const BRAND_META: BrandMeta[] = [
  {
    slug: 'osram',
    name: 'OSRAM',
    displayStyle: 'bold',
    categories: ['tecnico', 'lampadine'],
    description: 'Lampadine LED e sorgenti professionali per ogni attacco.',
    tags: ['Lampadine', 'Tubi', 'Speciali'],
    productLines: 'Lampadine · Tubi · Speciali',
    featured: true,
    defaultProductCount: 251,
  },
  {
    slug: 'tlb',
    name: 'TLB',
    displayStyle: 'bold-accent',
    categories: ['tecnico', 'professionale', 'made-in-italy'],
    description: 'Produzione italiana: prodotti tecnici, alimentatori e illuminazione su misura.',
    tags: ['Alimentatori', 'Faretti', 'Made in Italy'],
    productLines: 'Alimentatori · Faretti · Made in Italy',
    featured: true,
    defaultProductCount: 115,
  },
  {
    slug: 'philips',
    name: 'PHILIPS',
    displayStyle: 'bold',
    categories: ['tecnico', 'lampadine', 'smart'],
    description: 'Lampadine LED e illuminazione smart per casa, esterno e atmosfera.',
    tags: ['Lampadine', 'Smart', 'Strisce LED'],
    productLines: 'Lampadine · Smart · Strisce LED',
    featured: true,
    defaultProductCount: 96,
  },
  {
    slug: 'general-electric',
    name: 'GENERAL ELECTRIC',
    displayStyle: 'bold',
    categories: ['tecnico', 'lampadine'],
    description: 'Sorgenti e componenti per illuminazione residenziale e professionale.',
    tags: ['Lampadine', 'Sorgenti'],
    productLines: 'Lampadine · Sorgenti',
    defaultProductCount: 57,
  },
  {
    slug: 'sylvania',
    name: 'SYLVANIA',
    displayStyle: 'bold',
    categories: ['tecnico', 'lampadine'],
    description: 'Lampadine e soluzioni LED per casa e professionale.',
    tags: ['Lampadine', 'LED'],
    productLines: 'Lampadine · LED',
    defaultProductCount: 32,
  },
  {
    slug: 'spl',
    name: 'SPL',
    displayStyle: 'bold',
    categories: ['tecnico'],
    description: 'Componentistica e prodotti tecnici per illuminazione.',
    tags: ['Tecnico'],
    productLines: 'Catalogo tecnico',
    defaultProductCount: 29,
  },
  {
    slug: 'vossloh',
    name: 'VOSSLOH',
    displayStyle: 'bold',
    categories: ['tecnico'],
    description: 'Alimentatori e componentistica per illuminazione affidabile.',
    tags: ['Alimentatori', 'Reattori', 'Driver'],
    productLines: 'Alimentatori · Reattori · Driver',
    defaultProductCount: 27,
  },
  {
    slug: 'ledvance',
    name: 'LEDVANCE',
    displayStyle: 'bold',
    categories: ['tecnico', 'lampadine'],
    description: 'LED retrofit, tubi e sistemi per casa e professionale.',
    tags: ['Lampadine', 'Tubi T8', 'Pannelli'],
    productLines: 'Lampadine · Tubi T8 · Pannelli',
    defaultProductCount: 19,
  },
  {
    slug: 'aigostar',
    name: 'AIGOSTAR',
    displayStyle: 'bold',
    categories: ['tecnico', 'lampadine'],
    description: 'Lampadine e soluzioni LED convenienti.',
    tags: ['Lampadine', 'LED'],
    productLines: 'Lampadine · LED',
    defaultProductCount: 11,
  },
  {
    slug: 'patron',
    name: 'PATRON',
    displayStyle: 'bold',
    categories: ['tecnico'],
    description: 'Prodotti tecnici per illuminazione.',
    tags: ['Tecnico'],
    productLines: 'Catalogo tecnico',
    defaultProductCount: 7,
  },
  {
    slug: 'ilesa',
    name: 'ILESA',
    displayStyle: 'bold',
    categories: ['tecnico'],
    description: 'Componentistica e accessori per illuminazione.',
    tags: ['Tecnico'],
    productLines: 'Catalogo tecnico',
    defaultProductCount: 6,
  },
  {
    slug: 'duralamp',
    name: 'DURALAMP',
    displayStyle: 'bold',
    categories: ['tecnico', 'lampadine'],
    description: 'Lampadine e sorgenti per applicazioni tecniche.',
    tags: ['Lampadine'],
    productLines: 'Lampadine',
    defaultProductCount: 6,
  },
  {
    slug: 'century',
    name: 'CENTURY',
    displayStyle: 'bold',
    categories: ['tecnico'],
    description: 'Prodotti tecnici per illuminazione.',
    tags: ['Tecnico'],
    productLines: 'Catalogo tecnico',
    defaultProductCount: 3,
  },
  {
    slug: 'thorgeon',
    name: 'THORGEON',
    displayStyle: 'bold',
    categories: ['tecnico'],
    description: 'Prodotti tecnici per illuminazione.',
    tags: ['Tecnico'],
    productLines: 'Catalogo tecnico',
    defaultProductCount: 3,
  },
  {
    slug: 'tci',
    name: 'TCI',
    displayStyle: 'bold',
    categories: ['tecnico', 'professionale'],
    description: 'Driver e alimentatori LED professionali.',
    tags: ['Driver', 'Alimentatori'],
    productLines: 'Driver · Alimentatori',
    defaultProductCount: 2,
  },
  {
    slug: 'genelux',
    name: 'GENELUX',
    displayStyle: 'bold',
    categories: ['tecnico'],
    description: 'Prodotti tecnici per illuminazione.',
    tags: ['Tecnico'],
    productLines: 'Catalogo tecnico',
    defaultProductCount: 0,
  },
]

export const BRAND_THEMATIC = {
  design: {
    eyebrow: 'DESIGN',
    title: "Per lampade d'autore",
    subtitle: 'Marchi selezionati per arredare con la luce.',
    slugs: ['osram', 'philips', 'ledvance', 'general-electric', 'sylvania'],
    allHref: '/negozio?world=design',
  },
  technical: {
    eyebrow: 'TECNICI & LAMPADINE',
    title: 'Per prodotti e ricambi',
    subtitle: 'Sorgenti, alimentatori e componenti professionali.',
    slugs: ['osram', 'tlb', 'philips', 'vossloh', 'ledvance', 'tci'],
    allHref: '/negozio?world=technical',
  },
}

export const BRAND_CONSULT_CTA = {
  title: 'Cerchi un prodotto di un marchio specifico?',
  description:
    "Anche se non lo vedi a catalogo possiamo procurartelo. Contattaci con marca e codice: lo troviamo o ti proponiamo un'alternativa compatibile.",
  primaryCta: { label: 'Contattaci', href: '/contatti' },
  secondaryCta: { label: 'Cerca per codice', href: '/prodotto-non-trovato' },
}

function normalizeBrandKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function brandHref(slug: string): string {
  return `/brand/${slug}`
}

export function brandSlugFromDisplayName(name: string): string | null {
  const meta = BRAND_META.find((brand) => brand.name.toLowerCase() === name.toLowerCase())
  if (meta) return meta.slug
  const normalized = normalizeBrandKey(name)
  return normalized || null
}

/** Listing prodotti del brand (tassonomia `/brand/[slug]`). */
export function brandCatalogHref(slug: string): string {
  return brandHref(slug)
}

function categoryLabel(category: BrandCategory): string {
  const labels: Record<BrandCategory, string> = {
    design: 'DESIGN',
    tecnico: 'TECNICO',
    decorativo: 'DECORATIVO',
    outdoor: 'OUTDOOR',
    smart: 'SMART',
    professionale: 'TECNICO · PRO',
    'made-in-italy': 'MADE IN ITALY',
    lampadine: 'LAMPADINE',
  }
  return labels[category]
}

export function primaryCategoryLabel(categories: BrandCategory[]): string {
  if (categories.includes('design')) return categoryLabel('design')
  if (categories.includes('professionale')) return categoryLabel('professionale')
  if (categories.includes('decorativo')) return categoryLabel('decorativo')
  if (categories.includes('tecnico')) return categoryLabel('tecnico')
  return categoryLabel(categories[0] ?? 'tecnico')
}

export function isDesignCategory(categories: BrandCategory[]): boolean {
  return categories.includes('design') || categories.includes('decorativo')
}

function findBrandMeta(hub: BrandListItemDTO): BrandMeta | undefined {
  const nameKey = normalizeBrandKey(hub.name)
  const slugAliases = hub.slug === 'tlb-italy' ? ['tlb', 'tlb-italy'] : [hub.slug]
  return (
    BRAND_META.find((meta) => slugAliases.includes(meta.slug)) ??
    BRAND_META.find((meta) => normalizeBrandKey(meta.name) === nameKey) ??
    BRAND_META.find((meta) => meta.slug === nameKey)
  )
}

function hubMatchForMeta(
  meta: BrandMeta,
  hubByKey: Map<string, BrandListItemDTO>,
  hubBySlug: Map<string, BrandListItemDTO>,
): BrandListItemDTO | undefined {
  return (
    hubBySlug.get(meta.slug) ??
    hubByKey.get(normalizeBrandKey(meta.name)) ??
    (meta.slug === 'tlb' ? hubBySlug.get('tlb-italy') : undefined)
  )
}

function cardFromMeta(meta: BrandMeta, hub?: BrandListItemDTO): BrandCard {
  const slug = hub?.slug === 'tlb-italy' ? 'tlb' : (hub?.slug ?? meta.slug)
  return {
    slug,
    name: hub?.name ?? meta.name,
    displayStyle: meta.displayStyle,
    categories: meta.categories,
    description: meta.description,
    tags: meta.tags,
    productLines: meta.productLines,
    productCount: hub?.productCount ?? meta.defaultProductCount ?? 0,
    href: brandHref(slug),
    featured: meta.featured ?? false,
  }
}

/** Home: solo brand presenti in API, nell’ordine degli item CMS. */
export function resolveHomeBrandCards(
  items: ReadonlyArray<string | { name: string; href?: string }>,
  hubBrands: BrandListItemDTO[],
): BrandCard[] {
  const hubByName = new Map(hubBrands.map((b) => [b.name.toLowerCase(), b]))
  const hubBySlug = new Map(hubBrands.map((b) => [b.slug, b]))
  const hubByKey = new Map(hubBrands.map((b) => [normalizeBrandKey(b.name), b]))

  return items.flatMap((item) => {
    const name = typeof item === 'string' ? item : item.name
    const customHref = typeof item === 'string' ? undefined : item.href
    const fromMeta = BRAND_META.find((brand) => brand.name.toLowerCase() === name.toLowerCase())
    const hub =
      hubByName.get(name.toLowerCase()) ??
      (fromMeta ? hubMatchForMeta(fromMeta, hubByKey, hubBySlug) : undefined) ??
      hubBySlug.get(normalizeBrandKey(name))

    if (!hub) return []

    const meta = findBrandMeta(hub) ?? fromMeta
    const card = meta
      ? cardFromMeta(meta, hub)
      : {
          slug: hub.slug,
          name: hub.name,
          displayStyle: 'bold' as BrandDisplayStyle,
          categories: ['tecnico'] as BrandCategory[],
          description: '',
          tags: [],
          productLines: '',
          productCount: hub.productCount ?? 0,
          href: brandHref(hub.slug),
          featured: false,
        }

    return [{ ...card, href: customHref ?? card.href }]
  })
}

/**
 * Directory `/brand`: tutti i brand catalogo in `BRAND_META`,
 * arricchiti con conteggi/slug API quando disponibili.
 */
export function mergeBrandCards(hubBrands: BrandListItemDTO[]): BrandCard[] {
  const hubByKey = new Map(hubBrands.map((b) => [normalizeBrandKey(b.name), b]))
  const hubBySlug = new Map(hubBrands.map((b) => [b.slug, b]))
  const seen = new Set<string>()
  const cards: BrandCard[] = []

  for (const meta of BRAND_META) {
    const hub = hubMatchForMeta(meta, hubByKey, hubBySlug)
    const card = cardFromMeta(meta, hub)
    seen.add(normalizeBrandKey(card.name))
    seen.add(normalizeBrandKey(meta.name))
    seen.add(meta.slug)
    if (hub) seen.add(hub.slug)
    cards.push(card)
  }

  for (const hub of hubBrands) {
    const key = normalizeBrandKey(hub.name)
    if (seen.has(key) || seen.has(hub.slug)) continue
    cards.push({
      slug: hub.slug,
      name: hub.name,
      displayStyle: 'bold',
      categories: ['tecnico'],
      description: 'Marchio disponibile nel catalogo Idea di Luce.',
      tags: [],
      productLines: 'Catalogo completo',
      productCount: hub.productCount ?? 0,
      href: brandHref(hub.slug),
      featured: false,
    })
  }

  return cards.sort((a, b) => a.name.localeCompare(b.name, 'it'))
}
