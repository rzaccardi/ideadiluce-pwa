import { describe, expect, it } from 'vitest'
import { catalogProductSlugMatches } from '../../adapters/odoo-catalog/odooCatalogSlugIndex.js'
import { parseExplicitOdooTemplateId, parseOdooTemplateId, parseOdooVariantId } from './odooRef.js'

describe('catalogProductSlugMatches', () => {
  it('richiede match esatto con lo slug della scheda API', () => {
    expect(
      catalogProductSlugMatches(
        'tubo-fluorescente-neon-t8-18w-840',
        'tubo-fluorescente-neon-t8-18w-840',
      ),
    ).toBe(true)
    expect(
      catalogProductSlugMatches(
        'tubo-fluorescente-neon-t8-18w-840',
        'driver-dc-led-18w-24v-mean-well',
      ),
    ).toBe(false)
  })
})

describe('parseExplicitOdooTemplateId', () => {
  it('accetta solo ref espliciti', () => {
    expect(parseExplicitOdooTemplateId('6933')).toBe(6933)
    expect(parseExplicitOdooTemplateId('tpl-6933')).toBe(6933)
    expect(parseExplicitOdooTemplateId('p-6933')).toBe(6933)
  })

  it('non interpreta suffissi numerici di slug storefront come template id', () => {
    expect(parseExplicitOdooTemplateId('tubo-fluorescente-neon-t8-18w-840')).toBeNull()
    expect(parseExplicitOdooTemplateId('driver-dc-led-18w-24v-mean-well')).toBeNull()
  })
})

describe('parseOdooTemplateId', () => {
  it('mantiene il legacy cart/mock con suffisso -{id}', () => {
    expect(parseOdooTemplateId('legacy-product-840')).toBe(840)
    expect(parseOdooTemplateId('6933')).toBe(6933)
  })
})

describe('parseOdooVariantId', () => {
  it('parsa id numerici e VAR-{id}', () => {
    expect(parseOdooVariantId('7997')).toBe(7997)
    expect(parseOdooVariantId('VAR-7997')).toBe(7997)
    expect(parseOdooVariantId('sku-7997')).toBeNull()
  })
})
