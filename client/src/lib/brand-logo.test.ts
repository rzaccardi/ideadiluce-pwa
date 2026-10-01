import { describe, expect, it } from 'vitest'
import {
  brandLogoContentAspect,
  resolveBrandLogo,
  resolveBrandLogoSrc,
} from './brand-logo'

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

describe('resolveBrandLogo', () => {
  it('include bbox contenuto per ritaglio CSS', () => {
    const flos = resolveBrandLogo('flos')
    expect(flos?.src).toBe('/brands/flos.jpg')
    expect(flos?.stem).toBe('flos')
    expect(flos?.content[0]).toBeGreaterThan(0.2)
    expect(flos?.content[2]).toBeLessThan(0.8)
  })

  it('per artemide il crop è quasi full-bleed in orizzontale', () => {
    const artemide = resolveBrandLogo('artemide')
    expect(artemide?.content[0]).toBe(0)
    expect(artemide?.content[2]).toBe(1)
  })
})

describe('brandLogoContentAspect', () => {
  it('riduce l’aspect rispetto al canvas 150×32 quando c’è padding laterale', () => {
    const flos = resolveBrandLogo('flos')!
    const canvasAspect = 150 / 32
    expect(brandLogoContentAspect(flos.content)).toBeLessThan(canvasAspect)
    expect(brandLogoContentAspect(flos.content)).toBeGreaterThan(2)
  })
})
