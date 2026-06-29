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

export const BRAND_DIRECTORY_FILTERS: {
  id: BrandCategory | 'all'
  label: string
  dot?: string
}[] = [
  { id: 'all', label: 'Tutti' },
  { id: 'design', label: 'Design', dot: '#9a7b33' },
  { id: 'tecnico', label: 'Tecnico', dot: '#3f4651' },
  { id: 'decorativo', label: 'Decorativo', dot: '#c9a063' },
  { id: 'outdoor', label: 'Outdoor', dot: '#1f9d57' },
  { id: 'smart', label: 'Smart', dot: '#d9831a' },
]

export const BRAND_META: BrandMeta[] = [
  {
    slug: 'artemide',
    name: 'Artemide',
    displayStyle: 'serif',
    categories: ['design'],
    description: 'Icone del design italiano per interni contemporanei e spazi contract.',
    tags: ['Sospensioni', 'Tavolo', 'Applique'],
    productLines: 'Sospensioni · Tavolo · Parete',
    featured: true,
    defaultProductCount: 124,
  },
  {
    slug: 'philips',
    name: 'Philips',
    displayStyle: 'bold',
    categories: ['tecnico', 'lampadine', 'smart'],
    description: 'Lampadine LED e illuminazione smart per casa, esterno e atmosfera.',
    tags: ['Lampadine', 'Smart', 'Strisce LED'],
    productLines: 'Lampadine · Smart · Strisce LED',
    featured: true,
    defaultProductCount: 86,
  },
  {
    slug: 'tlb-italy',
    name: 'TLB Italy',
    displayStyle: 'bold-accent',
    categories: ['tecnico', 'professionale', 'made-in-italy'],
    description: 'Produzione italiana: prodotti tecnici, alimentatori e illuminazione su misura.',
    tags: ['Alimentatori', 'Faretti', 'Made in Italy'],
    productLines: 'Alimentatori · Faretti · Made in Italy',
    featured: true,
    defaultProductCount: 142,
  },
  {
    slug: 'flos',
    name: 'Flos',
    displayStyle: 'serif',
    categories: ['design'],
    description: 'Lampade decorative iconiche, dai progetti Castiglioni al contemporaneo.',
    tags: ['Sospensioni', 'Tavolo', 'Parete'],
    productLines: 'Sospensioni · Tavolo · Parete',
    defaultProductCount: 98,
  },
  {
    slug: 'fontanaarte',
    name: 'FontanaArte',
    displayStyle: 'serif',
    categories: ['design'],
    description: 'Vetro e luce nella tradizione milanese, da Gio Ponti in poi.',
    tags: ['Tavolo', 'Sospensioni', 'Terra'],
    productLines: 'Tavolo · Sospensioni · Terra',
    defaultProductCount: 54,
  },
  {
    slug: 'davide-groppi',
    name: 'Davide Groppi',
    displayStyle: 'serif',
    categories: ['design'],
    description: 'Poesia minimalista della luce, pezzi essenziali e scenografici.',
    tags: ['Sospensioni', 'Terra', 'Parete'],
    productLines: 'Sospensioni · Terra · Parete',
    defaultProductCount: 37,
  },
  {
    slug: 'ideal-lux',
    name: 'Ideal Lux',
    displayStyle: 'bold',
    categories: ['decorativo', 'outdoor'],
    description: 'Ampia gamma decorativa e outdoor con ottimo rapporto qualità-prezzo.',
    tags: ['Sospensioni', 'Applique', 'Outdoor'],
    productLines: 'Sospensioni · Applique · Outdoor',
    defaultProductCount: 210,
  },
  {
    slug: 'eglo',
    name: 'Eglo',
    displayStyle: 'bold',
    categories: ['decorativo', 'outdoor', 'smart'],
    description: 'Illuminazione residenziale e outdoor, anche connessa.',
    tags: ['Plafoniere', 'Outdoor', 'Smart'],
    productLines: 'Plafoniere · Outdoor · Smart',
    defaultProductCount: 175,
  },
  {
    slug: 'osram',
    name: 'Osram',
    displayStyle: 'bold',
    categories: ['tecnico', 'lampadine'],
    description: 'Lampadine LED e sorgenti professionali per ogni attacco.',
    tags: ['Lampadine', 'Tubi', 'Speciali'],
    productLines: 'Lampadine · Tubi · Speciali',
    defaultProductCount: 160,
  },
  {
    slug: 'ledvance',
    name: 'Ledvance',
    displayStyle: 'bold',
    categories: ['tecnico', 'lampadine'],
    description: 'LED retrofit, tubi e sistemi per casa e professionale.',
    tags: ['Lampadine', 'Tubi T8', 'Pannelli'],
    productLines: 'Lampadine · Tubi T8 · Pannelli',
    defaultProductCount: 132,
  },
  {
    slug: 'mean-well',
    name: 'Mean Well',
    displayStyle: 'bold',
    categories: ['tecnico', 'professionale'],
    description: 'Alimentatori e driver LED professionali, anche IP67 per esterno.',
    tags: ['Alimentatori', 'Driver', 'IP67'],
    productLines: 'Alimentatori · Driver · IP67',
    defaultProductCount: 94,
  },
  {
    slug: 'vossloh',
    name: 'Vossloh',
    displayStyle: 'bold',
    categories: ['tecnico'],
    description: 'Alimentatori e componentistica per illuminazione affidabile.',
    tags: ['Alimentatori', 'Reattori', 'Driver'],
    productLines: 'Alimentatori · Reattori · Driver',
    defaultProductCount: 61,
  },
]

export const BRAND_THEMATIC = {
  design: {
    eyebrow: 'DESIGN',
    title: "Per lampade d'autore",
    subtitle: 'Marchi iconici per arredare con la luce.',
    slugs: ['artemide', 'flos', 'fontanaarte', 'davide-groppi', 'ideal-lux'],
    allHref: '/negozio?world=design',
  },
  technical: {
    eyebrow: 'TECNICI & LAMPADINE',
    title: 'Per prodotti e ricambi',
    subtitle: 'Sorgenti, alimentatori e componenti professionali.',
    slugs: ['philips', 'osram', 'ledvance', 'mean-well', 'vossloh'],
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

export function brandCatalogHref(slug: string): string {
  return `/negozio?brand=${encodeURIComponent(slug)}`
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

export function resolveHomeBrandCards(
  items: ReadonlyArray<string | { name: string; href?: string }>,
  hubBrands: BrandListItemDTO[],
): BrandCard[] {
  const merged = mergeBrandCards(hubBrands)
  const byName = new Map(merged.map((brand) => [brand.name.toLowerCase(), brand]))
  const bySlug = new Map(merged.map((brand) => [brand.slug, brand]))

  return items.flatMap((item) => {
    const name = typeof item === 'string' ? item : item.name
    const customHref = typeof item === 'string' ? undefined : item.href
    const fromMeta = BRAND_META.find((brand) => brand.name.toLowerCase() === name.toLowerCase())
    const fromHub =
      byName.get(name.toLowerCase()) ??
      (fromMeta ? bySlug.get(fromMeta.slug) : undefined)

    if (fromHub) {
      return [
        {
          ...fromHub,
          href: customHref ?? fromHub.href,
        },
      ]
    }

    if (fromMeta) {
      return [
        {
          slug: fromMeta.slug,
          name: fromMeta.name,
          displayStyle: fromMeta.displayStyle,
          categories: fromMeta.categories,
          description: fromMeta.description,
          tags: fromMeta.tags,
          productLines: fromMeta.productLines,
          productCount: fromMeta.defaultProductCount ?? 0,
          href: customHref ?? brandHref(fromMeta.slug),
          featured: fromMeta.featured ?? false,
        },
      ]
    }

    const slug = brandSlugFromDisplayName(name)
    if (!slug) return []

    return [
      {
        slug,
        name,
        displayStyle: 'bold' as BrandDisplayStyle,
        categories: ['tecnico'] as BrandCategory[],
        description: '',
        tags: [],
        productLines: '',
        productCount: 0,
        href: customHref ?? brandHref(slug),
        featured: false,
      },
    ]
  })
}

export function mergeBrandCards(hubBrands: BrandListItemDTO[]): BrandCard[] {
  const hubByKey = new Map(hubBrands.map((b) => [normalizeBrandKey(b.name), b]))
  const seen = new Set<string>()
  const cards: BrandCard[] = []

  for (const meta of BRAND_META) {
    const hub = hubByKey.get(normalizeBrandKey(meta.name)) ?? hubByKey.get(meta.slug)
    const slug = hub?.slug ?? meta.slug
    seen.add(normalizeBrandKey(meta.name))
    cards.push({
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
    })
  }

  for (const hub of hubBrands) {
    const key = normalizeBrandKey(hub.name)
    if (seen.has(key)) continue
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
