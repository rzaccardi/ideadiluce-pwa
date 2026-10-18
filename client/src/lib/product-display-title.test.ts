import { describe, expect, it } from 'vitest'
import { omitTrailingBrandFromProductName } from '@/lib/product-display-title'

describe('omitTrailingBrandFromProductName', () => {
  it('toglie il brand in coda al titolo della card arredo', () => {
    expect(
      omitTrailingBrandFromProductName('Lampada da Terra Arco Flos', { name: 'FLOS', slug: 'flos' }),
    ).toBe('Lampada da Terra Arco')
    expect(
      omitTrailingBrandFromProductName('Lampada da Parete Bonnet FontanaArte', {
        name: 'FONTANA ARTE',
        slug: 'fontana-arte',
      }),
    ).toBe('Lampada da Parete Bonnet')
  })

  it('tratta TLB Italy come il brand TLB', () => {
    expect(
      omitTrailingBrandFromProductName('Lampada da Incasso Star Light 5 TLB Italy', {
        name: 'TLB',
        slug: 'tlb',
      }),
    ).toBe('Lampada da Incasso Star Light 5')
  })

  it('lascia il titolo se coincide solo con il brand', () => {
    expect(omitTrailingBrandFromProductName('Flos', { name: 'FLOS', slug: 'flos' })).toBe('Flos')
  })
})
