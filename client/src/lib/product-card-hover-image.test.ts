import { describe, expect, it } from 'vitest'
import {
  pickDefaultFotoHoverPreview,
  pickProductCardAccesaImageUrl,
  pickProductCardHoverImageUrl,
  resolveProductCardImagePair,
} from './product-card-hover-image'

function urlsMatch(a: string | null | undefined, b: string | null | undefined) {
  if (!a?.trim() || !b?.trim()) return false
  return a.replace(/image_\d+/, 'image_SIZE') === b.replace(/image_\d+/, 'image_SIZE')
}

describe('pickProductCardHoverImageUrl', () => {
  const packshot = 'https://cdn.example/web/image/product.template/1/image_512'

  it('preferisce il tag Odoo accesa al posto di ambiente', () => {
    expect(
      pickProductCardHoverImageUrl(
        [
          { type: 'image', tag: 'foto', url: packshot },
          { type: 'image', tag: 'ambiente', url: 'https://cdn.example/ambiente.jpg' },
          { type: 'image', tag: 'accesa', url: 'https://cdn.example/accesa.jpg' },
        ],
        packshot,
        urlsMatch,
      ),
    ).toBe('https://cdn.example/accesa.jpg')
  })

  it('preferisce accesa anche se l’extra foto non è taggata ambiente', () => {
    expect(
      pickProductCardHoverImageUrl(
        [
          { type: 'image', tag: 'foto', url: packshot },
          { type: 'image', tag: 'accesa', url: 'https://cdn.example/accesa.jpg' },
          { type: 'image', tag: 'foto', url: 'https://cdn.example/extra.jpg' },
        ],
        packshot,
        urlsMatch,
      ),
    ).toBe('https://cdn.example/accesa.jpg')
  })

  it('se manca accesa preferisce il tag Odoo ambiente', () => {
    expect(
      pickProductCardHoverImageUrl(
        [
          { type: 'image', tag: 'foto', url: packshot },
          { type: 'image', tag: 'ambiente', url: 'https://cdn.example/ambiente.jpg' },
        ],
        packshot,
        urlsMatch,
      ),
    ).toBe('https://cdn.example/ambiente.jpg')
  })

  it('se manca ambiente usa l’ultima extra foto diversa dal packshot', () => {
    expect(
      pickProductCardHoverImageUrl(
        [
          { type: 'image', tag: 'foto', url: packshot },
          { type: 'image', tag: 'foto', url: 'https://cdn.example/dup.jpg' },
          { type: 'image', tag: 'foto', url: 'https://cdn.example/ambiente.jpg' },
        ],
        packshot,
        urlsMatch,
      ),
    ).toBe('https://cdn.example/ambiente.jpg')
  })

  it('resta null se manca una seconda foto', () => {
    expect(
      pickProductCardHoverImageUrl(
        [{ type: 'image', tag: 'foto', url: packshot }],
        packshot,
        urlsMatch,
      ),
    ).toBeNull()
  })
})

describe('resolveProductCardImagePair', () => {
  const packshot = 'https://cdn.example/web/image/product.template/1/image_512'
  const ambiente = 'https://cdn.example/web/image/product.image/900/image_512'

  it('se l’immagine principale è l’ambientata usa il packshot come default', () => {
    expect(
      resolveProductCardImagePair(
        [
          { type: 'image', tag: 'ambiente', url: ambiente },
          { type: 'image', tag: 'foto', url: packshot },
        ],
        ambiente,
        urlsMatch,
      ),
    ).toEqual({ imageUrl: packshot, hoverImageUrl: ambiente, accesaImageUrl: null })
  })

  it('se c’è accesa la usa in hover al posto dell’ambientata', () => {
    const accesa = 'https://cdn.example/web/image/product.image/901/image_512'
    expect(
      resolveProductCardImagePair(
        [
          { type: 'image', tag: 'foto', url: packshot },
          { type: 'image', tag: 'ambiente', url: ambiente },
          { type: 'image', tag: 'accesa', url: accesa },
        ],
        packshot,
        urlsMatch,
      ),
    ).toEqual({ imageUrl: packshot, hoverImageUrl: accesa, accesaImageUrl: accesa })
  })

  it('l’immagine dedicata ambiente non batte accesa in gallery', () => {
    const accesa = 'https://cdn.example/web/image/product.image/901/image_512'
    expect(
      resolveProductCardImagePair(
        [
          { type: 'image', tag: 'foto', url: packshot },
          { type: 'image', tag: 'ambiente', url: ambiente },
          { type: 'image', tag: 'accesa', url: accesa },
        ],
        packshot,
        urlsMatch,
        ambiente,
      ),
    ).toEqual({ imageUrl: packshot, hoverImageUrl: accesa, accesaImageUrl: accesa })
  })
})

describe('pickDefaultFotoHoverPreview', () => {
  const packshot = 'https://cdn.example/web/image/product.template/1/image_1920'
  const accesa = 'https://cdn.example/web/image/product.image/901/image_1920'
  const ambiente = 'https://cdn.example/web/image/product.image/900/image_1920'
  const extra = 'https://cdn.example/web/image/product.image/775/image_1920'
  const gallery = [
    { type: 'image', tag: 'foto', url: packshot },
    { type: 'image', tag: 'accesa', url: accesa },
    { type: 'image', tag: 'ambiente', url: ambiente },
    { type: 'image', tag: 'foto', url: extra },
  ]

  it('sulla foto default usa accesa al posto di ambiente', () => {
    expect(
      pickDefaultFotoHoverPreview(gallery, { type: 'image', tag: 'foto', url: packshot }, urlsMatch),
    ).toEqual({ url: accesa, tag: 'accesa' })
  })

  it('sulla hero variante (URL diverso dal packshot gallery) usa comunque accesa', () => {
    expect(
      pickDefaultFotoHoverPreview(
        gallery,
        { type: 'image', tag: 'foto', url: 'https://cdn.example/web/image/product.product/2036/image_1920' },
        urlsMatch,
        true,
      ),
    ).toEqual({ url: accesa, tag: 'accesa' })
  })

  it('non applica overlay su tab accesa o ambiente', () => {
    expect(
      pickDefaultFotoHoverPreview(gallery, { type: 'image', tag: 'accesa', url: accesa }, urlsMatch),
    ).toBeNull()
    expect(
      pickDefaultFotoHoverPreview(
        gallery,
        { type: 'image', tag: 'ambiente', url: ambiente },
        urlsMatch,
      ),
    ).toBeNull()
  })

  it('non applica overlay sulla foto secondaria del tab Foto', () => {
    expect(
      pickDefaultFotoHoverPreview(
        gallery,
        { type: 'image', tag: 'foto', url: extra },
        urlsMatch,
        false,
      ),
    ).toBeNull()
  })
})

describe('pickProductCardAccesaImageUrl', () => {
  const packshot = 'https://cdn.example/web/image/product.template/1/image_512'

  it('restituisce solo il tag accesa, non ambiente', () => {
    expect(
      pickProductCardAccesaImageUrl(
        [
          { type: 'image', tag: 'foto', url: packshot },
          { type: 'image', tag: 'ambiente', url: 'https://cdn.example/ambiente.jpg' },
          { type: 'image', tag: 'accesa', url: 'https://cdn.example/accesa.jpg' },
        ],
        packshot,
        urlsMatch,
      ),
    ).toBe('https://cdn.example/accesa.jpg')
  })

  it('è null se manca il tab accesa', () => {
    expect(
      pickProductCardAccesaImageUrl(
        [
          { type: 'image', tag: 'foto', url: packshot },
          { type: 'image', tag: 'ambiente', url: 'https://cdn.example/ambiente.jpg' },
        ],
        packshot,
        urlsMatch,
      ),
    ).toBeNull()
  })
})
