import { describe, expect, it } from 'vitest'
import { pickProductCardHoverImageUrl } from './product-card-hover-image'

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
