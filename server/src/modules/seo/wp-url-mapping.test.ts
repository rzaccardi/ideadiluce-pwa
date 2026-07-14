import { describe, expect, it } from 'vitest'
import {
  classifyWpUrl,
  listWpIndexedRedirects,
  resolveWpIndexedPath,
} from './wp-url-mapping.js'

describe('wp-url-mapping', () => {
  it('classifica prodotti, brand e categorie come serveInPlace', () => {
    expect(resolveWpIndexedPath('/prodotto/wheel-ideal-lux/')?.serveInPlace).toBe(true)
    expect(resolveWpIndexedPath('/brand/artemide/')?.serveInPlace).toBe(true)
    expect(resolveWpIndexedPath('/categoria-prodotto/illuminazione-arredo/sospensione/')?.serveInPlace).toBe(
      true,
    )
    expect(resolveWpIndexedPath('/categoria-prodotto/ambienti/bagno/')?.toPath).toBeNull()
  })

  it('mappa post WordPress verso guide', () => {
    expect(resolveWpIndexedPath('/2024/06/26/luce-calda-o-fredda/')?.toPath).toBe(
      '/guide/luce-calda-o-fredda',
    )
  })

  it('non crea redirect per categorie prodotto', () => {
    const redirects = listWpIndexedRedirects([
      '/categoria-prodotto/ambienti/bagno/',
      '/categoria-prodotto/illuminazione-tecnica/led/ar111/',
    ])
    expect(redirects).toHaveLength(0)
  })

  it('classifica tipi URL', () => {
    expect(classifyWpUrl('/prodotto/foo')).toBe('product')
    expect(classifyWpUrl('/categoria-prodotto/x')).toBe('product_category')
    expect(classifyWpUrl('/2024/01/01/post')).toBe('post')
  })
})
