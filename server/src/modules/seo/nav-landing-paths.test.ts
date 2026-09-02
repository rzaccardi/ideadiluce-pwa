import { describe, expect, it } from 'vitest'
import {
  listNavAmbienteSlugs,
  listNavAttaccoSlugs,
  listNavCatalogLandingPaths,
  listNavCategoriaTecnicaSlugs,
  listNavStileSlugs,
  listNavTipologiaSlugs,
} from './nav-landing-paths.js'

describe('nav-landing-paths', () => {
  it('raccoglie categorie, attacchi e ambienti da menu, mega-menu e link', () => {
    const paths = listNavCatalogLandingPaths()

    expect(paths).toContain('/attacco')
    expect(paths).toContain('/attacco/e27')
    expect(paths).toContain('/attacco/gu10')
    expect(paths).toContain('/attacco/gu5-3')
    expect(paths).toContain('/attacco/g13')
    expect(paths).toContain('/attacco/2g11')

    expect(paths).toContain('/ambienti')
    expect(paths).toContain('/ambienti/soggiorno')
    expect(paths).toContain('/ambienti/cucina')
    expect(paths).toContain('/ambienti/esterno')

    expect(paths).toContain('/tipologia/sospensione')
    expect(paths).toContain('/tipologia/parete')
    expect(paths).toContain('/stile/moderno')
    expect(paths).toContain('/stile/design')

    expect(paths).toContain('/categoria-tecnica/led')
    expect(paths).toContain('/categoria-tecnica/driver')
    expect(paths).toContain('/categoria-prodotto/illuminazione-tecnica')
    expect(paths).toContain('/categoria-prodotto/illuminazione-arredo')
    expect(paths).toContain('/illuminazione-arredo')
  })

  it('estrae slug a un segmento', () => {
    expect(listNavAttaccoSlugs()).toEqual(
      expect.arrayContaining(['e27', 'gu10', 'gu5-3', 'g13', '2g11', 'g24']),
    )
    expect(listNavAmbienteSlugs()).toEqual(
      expect.arrayContaining(['soggiorno', 'cucina', 'camera', 'bagno', 'studio', 'esterno']),
    )
    expect(listNavTipologiaSlugs()).toEqual(
      expect.arrayContaining(['sospensione', 'parete', 'tavolo', 'terra', 'plafoniere', 'incasso']),
    )
    expect(listNavStileSlugs()).toEqual(expect.arrayContaining(['moderno', 'outdoor', 'design']))
    expect(listNavCategoriaTecnicaSlugs()).toEqual(
      expect.arrayContaining(['led', 'alogene', 'driver', 'strip', 'automotive']),
    )
  })

  it('non include query string né path fuori catalogo', () => {
    const paths = listNavCatalogLandingPaths()
    expect(paths.some((path) => path.includes('?'))).toBe(false)
    expect(paths).not.toContain('/professionisti')
    expect(paths).not.toContain('/brand')
    expect(paths).not.toContain('/negozio')
  })
})
