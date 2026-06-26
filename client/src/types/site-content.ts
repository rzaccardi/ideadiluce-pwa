export type SiteLink = {
  label: string
  href: string
}

export type SiteNavColumn = {
  title: string
  links: SiteLink[]
}

export type SiteMegaMenuPanel = {
  columns: SiteNavColumn[]
  promo?: {
    title: string
    description: string
    ctaLabel: string
    ctaHref: string
    variant: 'design' | 'technical'
  }
}

export type SiteShellContent = {
  utilityBar: {
    messages: string[]
    links: SiteLink[]
  }
  nav: {
    items: Array<
      | { kind: 'dropdown'; id: string; label: string; href?: string; panel: SiteMegaMenuPanel }
      | { kind: 'link'; id: string; label: string; href: string }
    >
  }
  trustBar: Array<{ title: string; subtitle: string }>
  footer: {
    columns: Array<{ title: string; links: SiteLink[] }>
    notFoundCta: { title: string; description: string; ctaLabel: string; ctaHref: string }
    legalNote: string
  }
}

export type HomeHeroHalf = {
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  footerLine?: string
  chips?: string[]
}

export type HomePathCard = {
  title: string
  description: string
  ctaLabel: string
  href: string
  variant: 'design' | 'technical' | 'dark'
}

export type HomeRoomCard = {
  title: string
  imageUrl: string
  href: string
}

export type HomeSocketTile = {
  code: string
  hint: string
  href: string
}

export type HomeGuideCard = {
  category: string
  title: string
  meta: string
  href: string
}

export type HomePageContent = {
  hero: { design: HomeHeroHalf; technical: HomeHeroHalf }
  search: {
    title: string
    subtitle: string
    placeholder: string
    ctaLabel: string
    hints: string[]
  }
  sockets: {
    eyebrow: string
    title: string
    subtitle: string
    linkLabel: string
    linkHref: string
    items: HomeSocketTile[]
  }
  paths: { title: string; subtitle: string; cards: HomePathCard[] }
  rooms: { eyebrow: string; title: string; subtitle: string; items: HomeRoomCard[] }
  designShowcase: {
    eyebrow: string
    title: string
    subtitle: string
    linkLabel: string
    linkHref: string
    productCount: number
    searchQuery?: string
  }
  technicalShowcase: {
    eyebrow: string
    title: string
    subtitle: string
    linkLabel: string
    linkHref: string
    productCount: number
    searchQuery?: string
  }
  brands: {
    title: string
    subtitle: string
    items: Array<string | { name: string; href?: string }>
  }
  guides: {
    eyebrow: string
    title: string
    subtitle: string
    linkLabel: string
    linkHref: string
    items: HomeGuideCard[]
  }
  b2b: {
    eyebrow: string
    title: string
    description: string
    ctaLabel: string
    ctaHref: string
    bullets: string[]
  }
  leadGen: { title: string; description: string; ctaLabel: string; ctaHref: string }
  newsletter: {
    title: string
    description: string
    placeholder: string
    ctaLabel: string
    privacyNote: string
  }
}

export type EditorialTile = {
  title: string
  description?: string
  href: string
  imageUrl?: string
  meta?: string
  category?: string
  code?: string
}

export type EditorialPageContent = {
  eyebrow?: string
  title: string
  subtitle?: string
  intro?: string
  items: EditorialTile[]
  cta?: SiteLink
  footerNote?: string
}

export type ContentBlock =
  | { kind: 'prose'; paragraphs: string[] }
  | {
      kind: 'features'
      title?: string
      items: Array<{ num?: string; title: string; description: string }>
    }
  | { kind: 'cards'; title?: string; subtitle?: string; items: EditorialTile[] }
  | { kind: 'bullets'; title?: string; items: string[] }
  | {
      kind: 'steps'
      title?: string
      items: Array<{ title: string; description: string }>
    }
  | {
      kind: 'cta'
      title: string
      description?: string
      primaryLabel: string
      primaryHref: string
      secondaryLabel?: string
      secondaryHref?: string
      variant?: 'dark' | 'light' | 'accent'
    }
  | {
      kind: 'contact'
      company?: string
      vat?: string
      rea?: string
      address?: string
      phone?: string
      phoneHref?: string
      email?: string
      hours?: string
      whatsapp?: string
    }
  | {
      kind: 'lead-form'
      form: 'product-not-found' | 'contact' | 'b2b'
      title?: string
      description?: string
    }

export type ContentPageContent = {
  layout?: 'default' | 'hero-dark' | 'legal' | 'article'
  eyebrow?: string
  title: string
  subtitle?: string
  intro?: string
  heroBadges?: string[]
  blocks: ContentBlock[]
  cta?: SiteLink
  seo?: { noindex?: boolean }
}

export type ProfessionistiPageContent = {
  eyebrow: string
  title: string
  subtitle: string
  hero: {
    primaryCta: SiteLink
    secondaryCta: SiteLink
  }
  quickReorder: {
    title: string
    placeholder: string
    exampleLines: string[]
    ctaLabel: string
    footnote: string
    loginHint: string
  }
  features: Array<{ num: string; title: string; description: string }>
  audiences: {
    title: string
    items: Array<{ title: string; description: string }>
  }
  registration: {
    title: string
    description: string
    benefits: string[]
    formNote: string
    submitLabel: string
    sectors: string[]
    fields: {
      companyName: string
      vat: string
      sector: string
      contactName: string
      email: string
      phone: string
      message: string
    }
    placeholders: {
      companyName: string
      vat: string
      contactName: string
      email: string
      phone: string
    }
  }
  seo?: { noindex?: boolean }
}

export type CatalogWorldConfig = {
  title: string
  description: string
  defaultQuery?: string
}

export type CatalogPageContent = {
  worlds: {
    design: CatalogWorldConfig
    technical: CatalogWorldConfig
  }
}

export type SitePageKey =
  | 'shell'
  | 'home'
  | 'attacco'
  | 'ambienti'
  | 'brand'
  | 'guide'
  | 'catalog'
  | 'chi-siamo'
  | 'showroom'
  | 'professionisti'
  | 'lavora-con-noi'
  | 'spedizioni'
  | 'pagamenti'
  | 'garanzia'
  | 'contatti'
  | 'privacy'
  | 'cookie'
  | 'prodotto-non-trovato'
  | 'guide-luce-calda-naturale-fredda'
  | 'guide-gu10-gu53'
  | 'guide-lampadina-r7s'
  | 'guide-illuminare-soggiorno'
  | 'guide-glossario'
  | 'guide-scegliere-lampadina-led'
  | 'guide-alimentatore-striscia-led'

export type EditorialPageKey = Extract<
  SitePageKey,
  'attacco' | 'ambienti' | 'brand' | 'guide'
>

export type ContentPageKey = Extract<
  SitePageKey,
  | 'chi-siamo'
  | 'showroom'
  | 'lavora-con-noi'
  | 'spedizioni'
  | 'pagamenti'
  | 'garanzia'
  | 'contatti'
  | 'privacy'
  | 'cookie'
  | 'prodotto-non-trovato'
  | 'guide-luce-calda-naturale-fredda'
  | 'guide-gu10-gu53'
  | 'guide-lampadina-r7s'
  | 'guide-illuminare-soggiorno'
  | 'guide-glossario'
  | 'guide-scegliere-lampadina-led'
  | 'guide-alimentatore-striscia-led'
>

export type SitePageContentMap = {
  shell: SiteShellContent
  home: HomePageContent
  attacco: EditorialPageContent
  ambienti: EditorialPageContent
  brand: EditorialPageContent
  guide: EditorialPageContent
  catalog: CatalogPageContent
  professionisti: ProfessionistiPageContent
} & {
  [K in ContentPageKey]: ContentPageContent
}

export type SitePageDTO<K extends SitePageKey = SitePageKey> = {
  pageKey: K
  locale: string
  content: SitePageContentMap[K]
  updatedAt: string | null
}

export type CatalogWorld = 'design' | 'technical'

export type BrandListItemDTO = {
  slug: string
  name: string
  productCount?: number
}
