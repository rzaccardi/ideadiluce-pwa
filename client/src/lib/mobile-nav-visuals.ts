/** Immagini e metadati per le card del menu mobile. */

import type { HomeRoomCard, SiteLink, SiteNavColumn } from '@/types/site-content'

export type NavLinkVisual =
  | { kind: 'image'; imageUrl: string; videoUrl?: string }
  | { kind: 'look'; imageUrl: string }

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

function pathFromHref(href: string): string {
  return href.split('?')[0] ?? href
}

function searchText(href: string, label: string): string {
  const query = href.includes('?') ? (href.split('?')[1] ?? '') : ''
  const q = new URLSearchParams(query).get('q')
  return [label, q ?? ''].filter(Boolean).join(' ')
}

export function resolveNavLinkVisual(href: string, label: string): NavLinkVisual | null {
  const path = pathFromHref(href)
  const room = ROOM_VISUALS[path]
  if (room) return { kind: 'image', ...room }

  const text = searchText(href, label)
  for (const rule of LAMP_VISUAL_RULES) {
    if (rule.test(text)) return { kind: 'image', imageUrl: rule.imageUrl }
  }
  for (const rule of TECH_VISUAL_RULES) {
    if (rule.test(text)) return { kind: 'image', imageUrl: rule.imageUrl }
  }

  return null
}

export function resolveMenuLinkVisual(
  link: Pick<SiteLink, 'href' | 'label' | 'imageUrl' | 'videoUrl'>,
  columnTitle: string,
  index: number,
): NavLinkVisual | null {
  if (link.imageUrl) {
    return { kind: 'image', imageUrl: link.imageUrl, videoUrl: link.videoUrl }
  }
  if (/stile/i.test(columnTitle)) return resolveStyleLookVisual(index)
  return resolveNavLinkVisual(link.href, link.label)
}

export function enrichNavColumn(column: SiteNavColumn): SiteNavColumn {
  if (!isVisualColumn(column.title)) return column
  return {
    ...column,
    links: column.links.map((link, index) => {
      const visual = resolveMenuLinkVisual(link, column.title, index)
      if (!visual || visual.kind !== 'image') return link
      return {
        ...link,
        imageUrl: link.imageUrl ?? visual.imageUrl,
        videoUrl: link.videoUrl ?? visual.videoUrl,
      }
    }),
  }
}

export function enrichNavColumns(columns: SiteNavColumn[]): SiteNavColumn[] {
  return columns.map(enrichNavColumn)
}

export function resolveStyleLookVisual(index: number): NavLinkVisual {
  return { kind: 'look', imageUrl: LOOK_VISUALS[index % LOOK_VISUALS.length] }
}

export function isVisualColumn(title: string): boolean {
  return /tipolog|ambiente|stile|attacco|prodotti tecnici|applicazioni/i.test(title)
}

export function shortMobileTabLabel(id: string, label: string): string {
  if (id === 'attacco') return 'Attacco'
  if (id === 'altro') return 'Altro'
  if (label.length <= 12) return label
  return label.split(' ')[0] ?? label
}

export const FALLBACK_ROOM_ITEMS: HomeRoomCard[] = [
  { title: 'Soggiorno', href: '/ambienti/soggiorno', imageUrl: '/site/images/room-soggiorno.webp' },
  { title: 'Cucina', href: '/ambienti/cucina', imageUrl: '/site/images/room-cucina.webp' },
  {
    title: 'Camera',
    href: '/ambienti/camera',
    imageUrl: '/site/images/room-camera.webp',
    videoUrl: '/site/videos/room-camera.mp4',
  },
  { title: 'Bagno', href: '/ambienti/bagno', imageUrl: '/site/images/room-bagno.webp' },
  { title: 'Studio', href: '/ambienti/studio', imageUrl: '/site/images/room-studio.webp' },
  { title: 'Esterno', href: '/ambienti/esterno', imageUrl: '/site/images/room-esterno.webp' },
]

export const FALLBACK_GUIDE_ITEMS = [
  {
    category: 'ARREDO',
    title: 'Luce CALDA o FREDDA: la scelta illuminante',
    meta: 'Giugno 2024 · Leggi →',
    href: '/guide/luce-calda-o-fredda',
  },
  {
    category: 'BASE',
    title: 'Luce calda, naturale o fredda?',
    meta: '5 min · Leggi →',
    href: '/guide/luce-calda-naturale-fredda',
  },
  {
    category: 'ATTACCHI',
    title: 'GU10 o GU5.3: qual è la differenza?',
    meta: '4 min · Leggi →',
    href: '/guide/gu10-gu53',
  },
  {
    category: 'ACQUISTO',
    title: 'Come scegliere una lampadina R7s',
    meta: '6 min · Leggi →',
    href: '/guide/lampadina-r7s',
  },
  {
    category: 'AMBIENTE',
    title: 'Come illuminare il soggiorno',
    meta: '7 min · Leggi →',
    href: '/guide/illuminare-soggiorno',
  },
] as const

type MobileNavTabItem = {
  kind: string
  id?: string
  label: string
  href?: string
}

/** Id stabile per i tab del menu mobile (anche se il CMS omette `id`). */
export function resolveMobileNavTabId(item: MobileNavTabItem, index: number): string {
  if (item.id) return item.id
  if (item.kind === 'dropdown') return `dropdown-${index}`
  const href = item.href ?? ''
  if (/acquista-ambiente|\/ambienti$/i.test(href) || /^ambienti$/i.test(item.label)) return 'ambienti'
  if (href === '/brand' || /^brand$/i.test(item.label)) return 'brand'
  if (/^\/(blog|guide)$/i.test(href) || /^guide$/i.test(item.label)) return 'guide'
  return `link-${index}`
}
