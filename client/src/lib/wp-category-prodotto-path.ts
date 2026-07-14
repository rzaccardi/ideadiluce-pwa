import type { CategoryLandingKey } from '@/types/category-landing'

const AMBIENTE_WP_TO_ROOM: Record<string, string> = {
  bagno: 'bagno',
  'camera-da-letto': 'camera',
  cucina: 'cucina',
  esterno: 'esterno',
  soggiorno: 'soggiorno',
  studio: 'studio',
}

export type WpCategoryProdottoView =
  | { kind: 'landing'; pageKey: CategoryLandingKey }
  | { kind: 'ambiente-hub' }
  | { kind: 'ambiente-room'; room: string; wpRoomSlug: string }
  | { kind: 'catalog'; categorySlug: string; displaySlug: string; rootWorld?: 'design' | 'technical' }

export function wpCategoryProdottoPathFromSegments(segments: string[]): string {
  const parts = segments.filter(Boolean)
  return parts.length ? `/categoria-prodotto/${parts.join('/')}` : '/categoria-prodotto'
}

/** Path interno PWA per navigazione in-app (nuovi link). */
export function resolveInternalPathFromWpView(view: WpCategoryProdottoView): string {
  switch (view.kind) {
    case 'landing':
      if (view.pageKey === 'design') return '/illuminazione-arredo'
      if (view.pageKey === 'technical') return '/illuminazione-tecnica'
      return '/categoria-prodotto/illuminazione-tecnica/prodotti-tecnici'
    case 'ambiente-hub':
      return '/acquista-ambiente'
    case 'ambiente-room':
      return `/ambienti/${view.room}`
    case 'catalog':
      return `/categoria/${view.displaySlug}`
  }
}

export function resolveWpCategoryProdottoView(segments: string[]): WpCategoryProdottoView | null {
  const parts = segments.filter(Boolean)
  if (!parts.length) return null

  if (parts[0] === 'ambienti') {
    if (parts.length === 1) return { kind: 'ambiente-hub' }
    const wpRoomSlug = parts[1]
    const room = AMBIENTE_WP_TO_ROOM[wpRoomSlug] ?? wpRoomSlug
    return { kind: 'ambiente-room', room, wpRoomSlug }
  }

  if (parts[0] === 'senza-categoria') {
    return { kind: 'catalog', categorySlug: '', displaySlug: 'senza-categoria' }
  }

  if (parts[0] === 'illuminazione-arredo') {
    if (parts.length === 1) return { kind: 'landing', pageKey: 'design' }
    const leaf = parts[parts.length - 1]
    return { kind: 'catalog', categorySlug: leaf, displaySlug: leaf, rootWorld: 'design' }
  }

  if (parts[0] === 'illuminazione-tecnica') {
    if (parts.length === 1) return { kind: 'landing', pageKey: 'technical' }
    if (parts[1] === 'prodotti-tecnici' && parts.length === 2) {
      return { kind: 'landing', pageKey: 'technical-products' }
    }
    const leaf = parts[parts.length - 1]
    return { kind: 'catalog', categorySlug: leaf, displaySlug: leaf, rootWorld: 'technical' }
  }

  const leaf = parts[parts.length - 1]
  return { kind: 'catalog', categorySlug: leaf, displaySlug: leaf }
}

export function isWpCategoryProdottoPath(path: string): boolean {
  return normalizePath(path).startsWith('/categoria-prodotto')
}

function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash
}
