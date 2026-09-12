import { describe, expect, it } from 'vitest'
import {
  catalogDocumentDownloadPath,
  mergeProductDocuments,
  resolveProductDocumentHref,
} from './product-documents'

const datasheet = {
  id: '184223',
  name: 'DS_L36W840.pdf',
  type: 'datasheet' as const,
  format: 'pdf',
  mimetype: 'application/pdf',
  url: 'https://tlbdb.odoo.com/web/content/184223?download=true',
  publicCurrentUrl: 'https://tlbdb.odoo.com/product-docs/102261/datasheet/current',
}

describe('mergeProductDocuments', () => {
  it('unisce template e variante senza duplicati e scarta i file senza url', () => {
    expect(
      mergeProductDocuments(
        {
          documents: [
            datasheet,
            { ...datasheet, id: 'empty', url: '', publicCurrentUrl: null },
          ],
        },
        {
          documents: [{ ...datasheet, id: 'ce', name: 'CE.pdf', type: 'ce' }],
        },
      ),
    ).toEqual([datasheet, { ...datasheet, id: 'ce', name: 'CE.pdf', type: 'ce' }])
  })
})

describe('resolveProductDocumentHref', () => {
  it('usa il download PWA invece dell URL pubblico Odoo', () => {
    expect(resolveProductDocumentHref(datasheet, { slug: 'lampada', variantRef: '9124' })).toBe(
      catalogDocumentDownloadPath('lampada', '184223', '9124'),
    )
    expect(catalogDocumentDownloadPath('lampada', '184223', '9124')).toContain(
      '/api/v1/catalog/products/lampada/documents/184223/download',
    )
    expect(catalogDocumentDownloadPath('lampada', '184223', '9124')).toContain('variantRef=9124')
  })
})
