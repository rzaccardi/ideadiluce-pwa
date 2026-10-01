import { describe, expect, it } from 'vitest'
import {
  resolveDcActiveNavId,
  resolveNavDropdownHref,
} from './dc-static-routes'

describe('resolveDcActiveNavId', () => {
  it('marca Arredo su path canonici e alias tipologici', () => {
    expect(resolveDcActiveNavId('/illuminazione-arredo')).toBe('arredo')
    expect(resolveDcActiveNavId('/en/illuminazione-arredo')).toBe('arredo')
    expect(resolveDcActiveNavId('/categoria-prodotto/illuminazione-arredo')).toBe('arredo')
    expect(resolveDcActiveNavId('/tipologia/sospensione')).toBe('arredo')
    expect(resolveDcActiveNavId('/stile/moderno')).toBe('arredo')
  })

  it('marca Tecnica su landing e sottocategorie WP', () => {
    expect(resolveDcActiveNavId('/categoria-prodotto/illuminazione-tecnica')).toBe('tecnico')
    expect(resolveDcActiveNavId('/categoria-prodotto/illuminazione-tecnica/led/ar111')).toBe(
      'tecnico',
    )
    expect(resolveDcActiveNavId('/illuminazione-tecnica')).toBe('tecnico')
    expect(resolveDcActiveNavId('/categoria-tecnica/led')).toBe('tecnico')
  })

  it('risolve le altre voci nav note', () => {
    expect(resolveDcActiveNavId('/attacco/gu10')).toBe('attacco')
    expect(resolveDcActiveNavId('/ambienti/soggiorno')).toBe('ambienti')
    expect(resolveDcActiveNavId('/brand/osram')).toBe('brand')
    expect(resolveDcActiveNavId('/guide')).toBe('guide')
    expect(resolveDcActiveNavId('/negozio')).toBeNull()
  })
})

describe('resolveNavDropdownHref', () => {
  it('espone href cliccabili per Arredo e Tecnica', () => {
    expect(resolveNavDropdownHref('arredo')).toBe('/illuminazione-arredo')
    expect(resolveNavDropdownHref('tecnico')).toBe('/categoria-prodotto/illuminazione-tecnica')
    expect(resolveNavDropdownHref('arredo', '/custom')).toBe('/custom')
  })
})
