import { describe, expect, it } from 'vitest'
import { resolveBrandLogoSrc } from './brand-logo'

describe('resolveBrandLogoSrc', () => {
  it('risolve slug file presenti in /brands', () => {
    expect(resolveBrandLogoSrc('artemide')).toBe('/brands/artemide.jpg')
    expect(resolveBrandLogoSrc('Flos')).toBe('/brands/flos.jpg')
    expect(resolveBrandLogoSrc('mean-well')).toBe('/brands/mean-well.jpg')
  })

  it('applica alias noti (tlb, duralamp, …)', () => {
    expect(resolveBrandLogoSrc('tlb')).toBe('/brands/tlb-italy.jpg')
    expect(resolveBrandLogoSrc('tlb-italy')).toBe('/brands/tlb-italy.jpg')
    expect(resolveBrandLogoSrc('duralamp')).toBe('/brands/dura-lamp.jpg')
    expect(resolveBrandLogoSrc('fontanaarte')).toBe('/brands/fontana-arte.jpg')
  })

  it('restituisce null se manca lo slug o l’asset', () => {
    expect(resolveBrandLogoSrc(null)).toBeNull()
    expect(resolveBrandLogoSrc('')).toBeNull()
    expect(resolveBrandLogoSrc('brand-inesistente')).toBeNull()
  })
})
