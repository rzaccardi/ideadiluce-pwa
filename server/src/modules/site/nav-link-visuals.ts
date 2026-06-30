import type { SiteLink, SiteNavColumn } from './site.types.js'

const ROOM_VISUALS: Record<string, { imageUrl: string; videoUrl?: string }> = {
  '/ambienti/soggiorno': { imageUrl: '/site/images/room-soggiorno.webp' },
  '/ambienti/cucina': { imageUrl: '/site/images/room-cucina.webp' },
  '/ambienti/camera': {
    imageUrl: '/site/images/room-camera.webp',
    videoUrl: '/site/videos/room-camera.mp4',
  },
  '/ambienti/bagno': { imageUrl: '/site/images/room-bagno.webp' },
  '/ambienti/studio': { imageUrl: '/site/images/room-studio.webp' },
  '/ambienti/esterno': { imageUrl: '/site/images/room-esterno.webp' },
}

const LAMP_VISUAL_RULES: Array<{ test: (text: string) => boolean; imageUrl: string }> = [
  { test: (t) => /sospensione|pendant/i.test(t), imageUrl: '/site/images/lamp-pendant.webp' },
  { test: (t) => /parete|applique/i.test(t), imageUrl: '/site/images/lamp-applique.webp' },
  { test: (t) => /tavolo|table/i.test(t), imageUrl: '/site/images/lamp-table.webp' },
  { test: (t) => /terra|floor|piantana/i.test(t), imageUrl: '/site/images/lamp-floor.webp' },
  { test: (t) => /plafonier|soffitto/i.test(t), imageUrl: '/site/images/lamp-sphere.webp' },
  { test: (t) => /faretto|incasso|spot/i.test(t), imageUrl: '/site/images/prod-spot.webp' },
]

const TECH_VISUAL_RULES: Array<{ test: (text: string) => boolean; imageUrl: string }> = [
  { test: (t) => /driver|alimentator/i.test(t), imageUrl: '/site/images/prod-driver.webp' },
  { test: (t) => /striscia|profilo|spot|proiettor/i.test(t), imageUrl: '/site/images/prod-spot.webp' },
  { test: (t) => /\bled\b|lampadina|bulb/i.test(t), imageUrl: '/site/images/prod-bulb.webp' },
  { test: (t) => /r7s/i.test(t), imageUrl: '/site/images/prod-r7s.webp' },
  { test: (t) => /trasformator|portalampad|dimmer/i.test(t), imageUrl: '/site/images/prod-driver.webp' },
]

const LOOK_VISUALS = [
  '/site/images/lk-1.webp',
  '/site/images/lk-2.webp',
  '/site/images/lk-3.webp',
  '/site/images/lk-4.webp',
  '/site/images/look-cucina.webp',
] as const

export function isVisualNavColumn(title: string): boolean {
  return /tipolog|ambiente|stile|attacco|prodotti tecnici|applicazioni/i.test(title)
}

function pathFromHref(href: string): string {
  return href.split('?')[0] ?? href
}

function searchText(href: string, label: string): string {
  const query = href.includes('?') ? (href.split('?')[1] ?? '') : ''
  const q = new URLSearchParams(query).get('q')
  return [label, q ?? ''].filter(Boolean).join(' ')
}

export function defaultNavLinkVisual(
  href: string,
  label: string,
  columnTitle: string,
  index: number,
): Pick<SiteLink, 'imageUrl' | 'videoUrl'> {
  if (/stile/i.test(columnTitle)) {
    return { imageUrl: LOOK_VISUALS[index % LOOK_VISUALS.length] }
  }

  const path = pathFromHref(href)
  const room = ROOM_VISUALS[path]
  if (room) return room

  const text = searchText(href, label)
  for (const rule of LAMP_VISUAL_RULES) {
    if (rule.test(text)) return { imageUrl: rule.imageUrl }
  }
  for (const rule of TECH_VISUAL_RULES) {
    if (rule.test(text)) return { imageUrl: rule.imageUrl }
  }

  return {}
}

export function enrichNavColumn(column: SiteNavColumn): SiteNavColumn {
  if (!isVisualNavColumn(column.title)) return column
  return {
    ...column,
    links: column.links.map((link, index) => ({
      ...link,
      ...defaultNavLinkVisual(link.href, link.label, column.title, index),
    })),
  }
}

export function enrichNavColumns(columns: SiteNavColumn[]): SiteNavColumn[] {
  return columns.map(enrichNavColumn)
}
