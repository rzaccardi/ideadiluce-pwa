export type SiteContentSection =
  | { id: string; label: string; root: string }
  | { id: string; label: string; pick: string[] }
  | { id: string; label: string; navItemsOnly: true }
  | { id: string; label: string; navMegaMenu: string }
  | { id: string; label: string; articleEditor: true }

const EDITORIAL_SECTIONS: SiteContentSection[] = [
  { id: 'header', label: 'Intestazione', pick: ['eyebrow', 'title', 'subtitle', 'intro'] },
  { id: 'items', label: 'Elenco contenuti', pick: ['items'] },
  { id: 'footer', label: 'Chiusura pagina', pick: ['cta', 'footerNote'] },
]

const ARTICLE_PAGE_SECTIONS: SiteContentSection[] = [
  { id: 'header', label: 'Intestazione', pick: ['layout', 'eyebrow', 'title', 'subtitle', 'intro', 'heroBadges'] },
  { id: 'article-body', label: 'Copertina e impaginazione', articleEditor: true },
  { id: 'footer', label: 'Chiusura e SEO', pick: ['cta', 'seo'] },
]

const CONTENT_PAGE_SECTIONS: SiteContentSection[] = [
  { id: 'header', label: 'Intestazione', pick: ['layout', 'eyebrow', 'title', 'subtitle', 'intro', 'heroBadges', 'coverImage'] },
  { id: 'blocks', label: 'Blocchi contenuto', pick: ['blocks'] },
  { id: 'footer', label: 'Chiusura e SEO', pick: ['cta', 'seo'] },
]

const SITE_CONTENT_SECTIONS: Record<string, SiteContentSection[]> = {
  shell: [
    { id: 'utilityBar', label: 'Barra utilità', root: 'utilityBar' },
    { id: 'nav', label: 'Voci di navigazione', navItemsOnly: true },
    { id: 'megaArredo', label: 'Mega menu · Arredo', navMegaMenu: 'arredo' },
    { id: 'megaTecnico', label: 'Mega menu · Tecnico', navMegaMenu: 'tecnico' },
    { id: 'trustBar', label: 'Barra fiducia', root: 'trustBar' },
    { id: 'footer', label: 'Footer', root: 'footer' },
  ],
  home: [
    { id: 'hero', label: 'Hero', root: 'hero' },
    { id: 'search', label: 'Ricerca', root: 'search' },
    { id: 'sockets', label: 'Attacchi lampada', root: 'sockets' },
    { id: 'paths', label: 'Percorsi', root: 'paths' },
    { id: 'rooms', label: 'Ambienti', root: 'rooms' },
    { id: 'designShowcase', label: 'Vetrina design', root: 'designShowcase' },
    { id: 'technicalShowcase', label: 'Vetrina tecnica', root: 'technicalShowcase' },
    { id: 'brands', label: 'Brand', root: 'brands' },
    { id: 'guides', label: 'Guide', root: 'guides' },
    { id: 'b2b', label: 'Sezione B2B', root: 'b2b' },
    { id: 'leadGen', label: 'Lead generation', root: 'leadGen' },
    { id: 'newsletter', label: 'Newsletter', root: 'newsletter' },
  ],
  catalog: [{ id: 'worlds', label: 'Mondi catalogo', root: 'worlds' }],
  attacco: EDITORIAL_SECTIONS,
  ambienti: EDITORIAL_SECTIONS,
  brand: EDITORIAL_SECTIONS,
  guide: EDITORIAL_SECTIONS,
  professionisti: [
    { id: 'intro', label: 'Introduzione', pick: ['eyebrow', 'title', 'subtitle'] },
    { id: 'hero', label: 'Hero e CTA', pick: ['hero'] },
    { id: 'quickReorder', label: 'Riordino rapido', pick: ['quickReorder'] },
    { id: 'features', label: 'Vantaggi', pick: ['features'] },
    { id: 'audiences', label: 'Target', pick: ['audiences'] },
    { id: 'registration', label: 'Registrazione', pick: ['registration'] },
    { id: 'seo', label: 'SEO', pick: ['seo'] },
  ],
}

const CONTENT_PAGE_KEYS = new Set([
  'chi-siamo',
  'showroom',
  'lavora-con-noi',
  'spedizioni',
  'pagamenti',
  'garanzia',
  'contatti',
  'privacy',
  'cookie',
  'termini',
  'prodotto-non-trovato',
])

type NavItem = Record<string, unknown> & { kind?: string; id?: string; panel?: unknown }

function getNavItems(content: Record<string, unknown>): NavItem[] {
  const nav = content.nav
  if (!nav || typeof nav !== 'object') return []
  const items = (nav as Record<string, unknown>).items
  return Array.isArray(items) ? (items as NavItem[]) : []
}

function findNavDropdown(content: Record<string, unknown>, menuId: string): NavItem | undefined {
  return getNavItems(content).find((item) => item.kind === 'dropdown' && item.id === menuId)
}

function pickNavItemsOnly(content: Record<string, unknown>) {
  return {
    items: getNavItems(content).map((item) => {
      if (item.kind === 'dropdown') {
        const { panel: _panel, ...rest } = item
        return rest
      }
      return item
    }),
  }
}

function mergeNavItemsOnly(content: Record<string, unknown>, sectionValue: unknown) {
  if (!sectionValue || typeof sectionValue !== 'object') return content
  const nextItems = (sectionValue as Record<string, unknown>).items
  if (!Array.isArray(nextItems)) return content

  const mergedItems = nextItems.map((item) => {
    if (!item || typeof item !== 'object') return item
    const navItem = item as NavItem
    if (navItem.kind !== 'dropdown') return navItem

    const existing = findNavDropdown(content, String(navItem.id ?? ''))
    return {
      ...navItem,
      panel:
        existing?.panel ??
        ({
          columns: [],
        } satisfies Record<string, unknown>),
    }
  })

  return {
    ...content,
    nav: {
      ...(typeof content.nav === 'object' && content.nav !== null ? (content.nav as Record<string, unknown>) : {}),
      items: mergedItems,
    },
  }
}

function pickNavMegaMenu(content: Record<string, unknown>, menuId: string) {
  const item = findNavDropdown(content, menuId)
  const panel = item?.panel
  if (panel && typeof panel === 'object') return panel
  return { columns: [] }
}

function mergeNavMegaMenu(content: Record<string, unknown>, menuId: string, sectionValue: unknown) {
  const items = getNavItems(content).map((item) => {
    if (item.kind !== 'dropdown' || item.id !== menuId) return item
    return { ...item, panel: sectionValue }
  })

  return {
    ...content,
    nav: {
      ...(typeof content.nav === 'object' && content.nav !== null ? (content.nav as Record<string, unknown>) : {}),
      items,
    },
  }
}

export function getSiteContentSections(pageKey: string): SiteContentSection[] {
  if (SITE_CONTENT_SECTIONS[pageKey]) return SITE_CONTENT_SECTIONS[pageKey]
  if (pageKey.startsWith('guide-')) return ARTICLE_PAGE_SECTIONS
  if (CONTENT_PAGE_KEYS.has(pageKey)) return CONTENT_PAGE_SECTIONS
  return [{ id: 'all', label: 'Contenuto pagina', pick: [] }]
}

export function pickSectionValue(content: Record<string, unknown>, section: SiteContentSection) {
  if ('navItemsOnly' in section) return pickNavItemsOnly(content)
  if ('navMegaMenu' in section) return pickNavMegaMenu(content, section.navMegaMenu)
  if ('articleEditor' in section) {
    const picked: Record<string, unknown> = {}
    if ('coverImage' in content) picked.coverImage = content.coverImage
    if ('layout' in content) picked.layout = content.layout
    if ('blocks' in content) picked.blocks = content.blocks
    return picked
  }
  if ('root' in section) {
    return content[section.root]
  }
  if ('pick' in section) {
    if (section.pick.length === 0) return content
    const picked: Record<string, unknown> = {}
    for (const key of section.pick) {
      if (key in content) picked[key] = content[key]
    }
    return picked
  }
  return content
}

export function mergeSectionValue(
  content: Record<string, unknown>,
  section: SiteContentSection,
  sectionValue: unknown,
) {
  if ('navItemsOnly' in section) return mergeNavItemsOnly(content, sectionValue)
  if ('navMegaMenu' in section) return mergeNavMegaMenu(content, section.navMegaMenu, sectionValue)
  if ('articleEditor' in section) {
    return { ...content, ...(sectionValue as Record<string, unknown>) }
  }
  if ('root' in section) {
    return { ...content, [section.root]: sectionValue }
  }
  if ('pick' in section) {
    if (section.pick.length === 0) {
      return sectionValue as Record<string, unknown>
    }
    return { ...content, ...(sectionValue as Record<string, unknown>) }
  }
  return content
}
