import { describe, expect, it } from 'vitest'
import { selectTechnicalEquivalents } from './technical-equivalents'
import type { ProductRelatedDTO } from '@/types/dto'

function related(partial: Partial<ProductRelatedDTO> & { slug: string }): ProductRelatedDTO {
  return {
    locale: 'IT',
    name: partial.name ?? partial.slug,
    shortDescription: null,
    priceCents: 490,
    priceDisplayMode: 'ex_vat',
    currency: 'EUR',
    imageUrl: null,
    categorySlug: null,
    relation: 'alternative',
    ...partial,
  }
}

describe('selectTechnicalEquivalents', () => {
  it('nasconde la lista se non ci sono equivalenti', () => {
    expect(selectTechnicalEquivalents([], 'attuale')).toEqual([])
    expect(selectTechnicalEquivalents(undefined, 'attuale')).toEqual([])
  })

  it('esclude il prodotto in pagina e le relation non-alternative', () => {
    const items = selectTechnicalEquivalents(
      [
        related({ slug: 'attuale', name: 'Attuale' }),
        related({ slug: 'osram-t8', name: 'OSRAM T8' }),
        related({ slug: 'portalampade', name: 'Portalampade', relation: 'accessory' }),
        related({ slug: 'altro', name: 'Altro', relation: 'related' }),
      ],
      'attuale',
    )
    expect(items.map((item) => item.slug)).toEqual(['osram-t8'])
  })
})
