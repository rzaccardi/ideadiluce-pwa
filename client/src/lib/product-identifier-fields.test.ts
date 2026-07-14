import { describe, expect, it } from 'vitest'
import { collectProductIdentifierFields, formatProductIdentifierInline } from './product-identifier-fields'

const labels = {
  brand: 'Marca',
  manufacturerCode: 'MPN',
  ced: 'CED',
  sku: 'COD',
  defaultCode: 'Codice',
  ean: 'EAN',
  weightKg: 'Peso',
  lengthMeters: 'Lunghezza',
  dimensions: 'Dimensioni',
} as const

describe('collectProductIdentifierFields', () => {
  it('mostra tutti i codici distinti disponibili', () => {
    const fields = collectProductIdentifierFields(
      {
        brand: { slug: 'vossloh', name: 'VOSSLOH' },
        sku: '141624',
        ced: '002144',
        manufacturerCode: 'L392702127',
        ean: '8718739073586',
        defaultCode: null,
      },
      null,
    )

    expect(fields.map((field) => field.key)).toEqual([
      'brand',
      'manufacturerCode',
      'ced',
      'sku',
      'ean',
    ])
  })

  it('deduplica valori identici tra sku e manufacturerCode', () => {
    const fields = collectProductIdentifierFields({
      sku: '141624',
      manufacturerCode: '141624',
      ced: null,
      ean: null,
      defaultCode: null,
    })

    expect(fields).toEqual([{ key: 'manufacturerCode', value: '141624' }])
  })

  it('preferisce i codici della variante selezionata', () => {
    const fields = collectProductIdentifierFields(
      { sku: 'OLD', ean: '111', ced: '001', manufacturerCode: 'OLD-MPN' },
      { ean: '8718739073586', ced: '002144', manufacturerCode: 'L392702127' },
      { includeBrand: false },
    )

    expect(fields.map((field) => field.key)).toEqual([
      'manufacturerCode',
      'ced',
      'sku',
      'ean',
    ])
    expect(fields.find((field) => field.key === 'manufacturerCode')?.value).toBe('L392702127')
    expect(fields.find((field) => field.key === 'ean')?.value).toBe('8718739073586')
  })

  it('formatta la riga inline con etichette', () => {
    const line = formatProductIdentifierInline(
      [
        { key: 'ced', value: '002024' },
        { key: 'manufacturerCode', value: '2024' },
      ],
      labels,
    )

    expect(line).toBe('CED 002024 · MPN 2024')
  })
})
