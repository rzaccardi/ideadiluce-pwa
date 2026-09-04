import { describe, expect, it } from 'vitest'
import { pickProductCardHoverImageUrl } from './product-card-hover-image.js'

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
          { type: 'image', tag: 'foto', url: 'https://cdn.example/extra-foto.jpg' },
          { type: 'image', tag: 'ambiente', url: 'https://cdn.example/ambiente.jpg' },
        ],
        packshot,
        urlsMatch,
      ),
    ).toBe('https://cdn.example/ambiente.jpg')
  })

  it('se manca ambiente usa la prima extra foto diversa dal packshot', () => {
    expect(
      pickProductCardHoverImageUrl(
        [
          { type: 'image', tag: 'foto', url: packshot },
          { type: 'image', tag: 'foto', url: 'https://cdn.example/web/image/product.image/9/image_1920' },
        ],
        packshot,
        urlsMatch,
      ),
    ).toBe('https://cdn.example/web/image/product.image/9/image_1920')
  })

  it('non usa schede tecniche come hover', () => {
    expect(
      pickProductCardHoverImageUrl(
        [
          { type: 'image', tag: 'foto', url: packshot },
          { type: 'image', tag: 'attacco', url: 'https://cdn.example/attacco.jpg' },
          { type: 'image', tag: 'misure', url: 'https://cdn.example/misure.jpg' },
        ],
        packshot,
        urlsMatch,
      ),
    ).toBeNull()
  })

  it('resta null se c’è solo il packshot', () => {
    expect(
      pickProductCardHoverImageUrl(
        [{ type: 'image', tag: 'foto', url: packshot.replace('image_512', 'image_1920') }],
        packshot,
        urlsMatch,
      ),
    ).toBeNull()
  })
})
