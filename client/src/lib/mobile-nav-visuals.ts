/** Immagini e metadati per le card del menu mobile. */

import type { HomeRoomCard } from '@/types/site-content'

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
