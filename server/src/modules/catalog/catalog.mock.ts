import type { CategoryDTO } from '../../types/dto.js'

export type MockProductVariant = {
  ref: string
  label: string
  imageUrl: string | null
  attributes: { name: string; value: string }[]
}

export type MockProduct = {
  slug: string
  name: string
  shortDescription: string | null
  longDescription: string | null
  priceCents: number
  currency: string
  imageUrl: string | null
  categorySlug: string | null
  sku: string | null
  inStock: boolean
  variants: MockProductVariant[]
}

export const MOCK_CATEGORIES: CategoryDTO[] = [
  { id: 'c1', slug: 'illuminazione', name: 'Illuminazione', parentId: null },
  { id: 'c2', slug: 'lampade', name: 'Lampade', parentId: 'c1' },
]

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    slug: 'sospensione-vetro',
    name: 'Lampada a sospensione vetro',
    shortDescription: 'Design minimale',
    longDescription: 'Dettagli da Odoo in futuro.',
    priceCents: 12900,
    currency: 'EUR',
    imageUrl: null,
    categorySlug: 'lampade',
    sku: 'SKU-001',
    inStock: true,
    variants: [
      { ref: 'VAR-MOCK-001-AMBER', label: 'Vetro ambra', imageUrl: null, attributes: [] },
      { ref: 'VAR-MOCK-001-SMOKE', label: 'Vetro fumé', imageUrl: null, attributes: [] },
    ],
  },
  {
    slug: 'applique-led',
    name: 'Applique LED',
    shortDescription: 'Luce calda',
    longDescription: 'Prodotto demo.',
    priceCents: 8900,
    currency: 'EUR',
    imageUrl: null,
    categorySlug: 'lampade',
    sku: 'SKU-002',
    inStock: true,
    variants: [
      { ref: 'VAR-MOCK-002-WARM', label: 'Luce calda', imageUrl: null, attributes: [] },
      { ref: 'VAR-MOCK-002-NEUTRAL', label: 'Luce neutra', imageUrl: null, attributes: [] },
    ],
  },
]
