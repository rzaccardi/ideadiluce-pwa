/** Tipi payload OdooCatalog API v2 (tlb_idl_ecommerce) — contratto 2026-07-20. */

export type OdooCatalogImage = {
  url: string
  alt: string
}

export type OdooCatalogGalleryTag =
  | 'foto'
  | 'attacco'
  | 'misure'
  | 'accesa'
  | 'applicazione'
  | 'ambiente'
  | 'dettaglio'
  | 'certificazione'
  | (string & {})

export type OdooCatalogGalleryItem = {
  type: 'image' | 'video'
  tag: OdooCatalogGalleryTag
  url: string
  alt: string
}

export type OdooCatalogSpecValueType = 'integer' | 'float' | 'char' | 'boolean' | 'selection'
export type OdooCatalogSpecCardinality = 'single' | 'discrete_set' | 'continuous_range'

export type OdooCatalogSpecValue =
  | string
  | number
  | boolean
  | null
  | { set: Array<string | number | boolean> }
  | { min: number; max: number }

export type OdooCatalogSpec = {
  key: string
  label: string
  unit: string
  value_type: OdooCatalogSpecValueType | string
  cardinality: OdooCatalogSpecCardinality | string
  value: OdooCatalogSpecValue
  display: string
}

export type OdooCatalogVariantAttribute = {
  attribute_id: number
  label: string
  value: string
}

export type OdooCatalogAvailability = {
  qty_available?: number
  is_orderable?: boolean
  restock_date?: string | null
  customer_lead_time_days?: number | null
  is_unrecoverable?: boolean
}

export type OdooCatalogDocumentType = 'datasheet' | 'scheda_ue' | 'ce' | 'istruzioni' | (string & {})

export type OdooCatalogProductDocument = {
  id?: number | string
  name?: string
  type?: OdooCatalogDocumentType | null
  format?: string | null
  mimetype?: string | null
  size_bytes?: number | null
  url?: string
}

export type OdooCatalogCategoryRef = {
  id?: number | string
  slug?: string
  name?: string
  parent_id?: number | string | null
  parent_slug?: string | null
}

export type OdooCatalogBrand = {
  id?: number | string
  slug?: string
  name?: string
}

export type OdooCatalogTaxonomy = {
  world?: 'design' | 'technical' | string | null
  tipologia?: string[]
  ambiente?: string[]
  stile?: string[]
}

export type OdooCatalogDimensions = {
  length_cm?: number | null
  width_cm?: number | null
  height_cm?: number | null
}

export type OdooCatalogRelatedProduct = {
  relation?: 'related' | 'accessory' | 'alternative' | string
  slug?: string
  title?: string
  short_description?: string
  price_from?: number
  currency?: string
  image?: OdooCatalogImage
  qty_available?: number
  availability?: OdooCatalogAvailability
}

export type OdooCatalogVariant = {
  id: number
  ced: string
  manufacturer_code: string | null
  attributes: OdooCatalogVariantAttribute[]
  lst_price: number
  image: OdooCatalogImage
  specs: OdooCatalogSpec[]
  qty_available?: number
  is_orderable?: boolean
  availability?: OdooCatalogAvailability
  documents?: OdooCatalogProductDocument[]
  ean?: string | null
}

export type OdooCatalogProductSeo = {
  meta_title: string
  meta_description: string
  og_image: OdooCatalogImage
  alternates?: Array<{ locale?: string; href?: string; lang?: string; url?: string }>
}

export type OdooCatalogProductListItem = {
  id: number
  title: string
  slug: string
  short_description: string
  price_from: number
  price_to: number
  currency: string
  image: OdooCatalogImage
  spec_tags?: string[]
  specs?: OdooCatalogSpec[]
  qty_available?: number
  is_orderable?: boolean
  availability?: OdooCatalogAvailability
  categories?: OdooCatalogCategoryRef[]
  category_slug?: string | null
  brand?: OdooCatalogBrand | null
  tags?: string[]
  taxonomy?: OdooCatalogTaxonomy | null
  sku?: string | null
  manufacturer_code?: string | null
  ced?: string | null
  ean?: string | null
  /** @deprecated Non più nel contratto v2 — solo compat lettura legacy. */
  default_code?: string | null
}

export type OdooCatalogProductDetail = OdooCatalogProductListItem & {
  description: string
  seo: OdooCatalogProductSeo
  gallery: OdooCatalogGalleryItem[]
  specs: OdooCatalogSpec[]
  variants: OdooCatalogVariant[]
  documents: OdooCatalogProductDocument[]
  related_products?: OdooCatalogRelatedProduct[]
  ean?: string | null
  weight_kg?: number | null
  length_meters?: number | null
  dimensions?: OdooCatalogDimensions
}

export type OdooCatalogWebsiteRef = {
  id: number
  name: string
}

export type OdooCatalogProductListResponse = {
  website: OdooCatalogWebsiteRef
  lang: string
  page: number
  per_page: number
  total: number
  total_pages: number
  items: OdooCatalogProductListItem[]
}

export type OdooCatalogProductSearchSort = 'relevance' | 'price_asc' | 'price_desc' | 'name_asc'

export type OdooCatalogAppliedFilters = Record<string, unknown>

export type OdooCatalogProductSearchResponse = OdooCatalogProductListResponse & {
  sort?: OdooCatalogProductSearchSort | string
  applied_filters?: OdooCatalogAppliedFilters
}

export type OdooCatalogFacetValue = {
  value: string | number
  label: string
  count: number
}

export type OdooCatalogFacetSlug = {
  slug: string
  name: string
  count: number
  parent_slug?: string | null
  children?: OdooCatalogFacetCategory[]
}

export type OdooCatalogFacetCategory = OdooCatalogFacetSlug

export type OdooCatalogFacetSpec = {
  key: string
  label: string
  unit: string
  values: Array<{ value: string | number; label?: string; display?: string; count: number }>
}

export type OdooCatalogFiltersResponse = {
  website: OdooCatalogWebsiteRef
  lang: string
  total_matching: number
  applied_filters?: OdooCatalogAppliedFilters
  worlds: OdooCatalogFacetValue[]
  categories: OdooCatalogFacetCategory[]
  brands: Array<{ slug: string; name: string; count: number }>
  tipologie: OdooCatalogFacetValue[]
  ambienti: OdooCatalogFacetValue[]
  stili: OdooCatalogFacetValue[]
  attacchi: OdooCatalogFacetValue[]
  wattaggi: OdooCatalogFacetValue[]
  color_temps: OdooCatalogFacetValue[]
  tags: OdooCatalogFacetValue[]
  specs: OdooCatalogFacetSpec[]
}

export type OdooCatalogProductDetailResponse = {
  website: OdooCatalogWebsiteRef
  lang: string
  product: OdooCatalogProductDetail
}

export type OdooCatalogCategoryListResponse = {
  website: OdooCatalogWebsiteRef
  lang: string
  items: OdooCatalogCategoryRef[]
}

export type OdooCatalogBrandListResponse = {
  website: OdooCatalogWebsiteRef
  lang: string
  items: OdooCatalogBrand[]
}
