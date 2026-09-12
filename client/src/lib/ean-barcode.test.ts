import { describe, expect, it } from 'vitest'
import {
  barcodeToPdf,
  barcodeToSvg,
  ean13Checksum,
  encodeProductBarcode,
  normalizeBarcodeDigits,
} from './ean-barcode'

describe('encodeProductBarcode', () => {
  it('normalizza spazi e trattini', () => {
    expect(normalizeBarcodeDigits('871 8739-073586')).toBe('8718739073586')
  })

  it('codifica EAN-13 valido in 95 moduli', () => {
    expect(ean13Checksum('871873907358')).toBe(6)
    const encoded = encodeProductBarcode('8718739073586')
    expect(encoded?.format).toBe('EAN-13')
    expect(encoded?.modules).toHaveLength(95)
    expect(encoded?.modules[0]).toBe(1)
    expect(encoded?.modules[1]).toBe(0)
    expect(encoded?.modules[2]).toBe(1)
  })

  it('codifica UPC-A a 12 cifre come EAN-13 con zero iniziale', () => {
    const encoded = encodeProductBarcode('036000291452')
    expect(encoded?.format).toBe('UPC-A')
    expect(encoded?.digits).toBe('0036000291452')
    expect(encoded?.modules).toHaveLength(95)
  })

  it('codifica EAN-8 in 67 moduli', () => {
    const encoded = encodeProductBarcode('90311017')
    expect(encoded?.format).toBe('EAN-8')
    expect(encoded?.modules).toHaveLength(67)
  })

  it('accetta GTIN-14 con zero iniziale', () => {
    const encoded = encodeProductBarcode('08718739073586')
    expect(encoded?.digits).toBe('8718739073586')
  })

  it('restituisce null se non è un barcode EAN/UPC', () => {
    expect(encodeProductBarcode('SKU-123')).toBeNull()
    expect(encodeProductBarcode('')).toBeNull()
  })
})

describe('barcode export', () => {
  it('genera SVG con rettangoli', () => {
    const encoded = encodeProductBarcode('8718739073586')
    expect(encoded).not.toBeNull()
    const svg = barcodeToSvg(encoded!)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('<rect')
    expect(svg).toContain('8718739073586'.slice(0, 1))
  })

  it('genera un PDF con header valido', () => {
    const encoded = encodeProductBarcode('8718739073586')
    expect(encoded).not.toBeNull()
    const pdf = barcodeToPdf(encoded!, { productName: 'Lampadina E27', brand: 'OSRAM' })
    const header = new TextDecoder().decode(pdf.slice(0, 8))
    expect(header).toBe('%PDF-1.4')
    expect(new TextDecoder().decode(pdf)).toContain('%%EOF')
  })
})
