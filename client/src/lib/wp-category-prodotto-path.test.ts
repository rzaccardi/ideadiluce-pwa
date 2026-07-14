import { describe, expect, it } from 'vitest'
import {
  resolveInternalPathFromWpView,
  resolveWpCategoryProdottoView,
  wpCategoryProdottoPathFromSegments,
} from './wp-category-prodotto-path'

describe('wp-category-prodotto-path', () => {
  it('risolve landing e catalogo', () => {
    expect(resolveWpCategoryProdottoView(['illuminazione-arredo'])?.kind).toBe('landing')
    expect(resolveWpCategoryProdottoView(['illuminazione-arredo', 'sospensione'])?.kind).toBe('catalog')
  })

  it('mappa ambienti WP', () => {
    const room = resolveWpCategoryProdottoView(['ambienti', 'camera-da-letto'])
    expect(room?.kind).toBe('ambiente-room')
    if (room?.kind === 'ambiente-room') expect(room.room).toBe('camera')
  })

  it('espone path interni PWA distinti da URL indicizzati', () => {
    const view = resolveWpCategoryProdottoView(['illuminazione-tecnica', 'led', 'ar111'])
    expect(view?.kind).toBe('catalog')
    if (view?.kind === 'catalog') {
      expect(wpCategoryProdottoPathFromSegments(['illuminazione-tecnica', 'led', 'ar111'])).toBe(
        '/categoria-prodotto/illuminazione-tecnica/led/ar111',
      )
      expect(resolveInternalPathFromWpView(view)).toBe('/categoria/ar111')
    }
  })
})
