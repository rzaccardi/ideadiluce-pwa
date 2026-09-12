import { describe, expect, it } from 'vitest'
import {
  pickProductCardHoverImageUrl,
  resolveProductCardImagePair,
} from './product-card-hover-image'

function urlsMatch(a: string | null | undefined, b: string | null | undefined) {
  if (!a?.trim() || !b?.trim()) return false
  return a.replace(/image_\d+/, 'image_SIZE') === b.replace(/image_\d+/, 'image_SIZE')
}

describe('pickProductCardHoverImageUrl', () => {
  const packshot = 'https://cdn.example/web/image/product.template/1/image_512'

  it('preferisce il tag Odoo ambiente', () => {
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
    ).toEqual({ imageUrl: packshot, hoverImageUrl: ambiente })
  })
})
