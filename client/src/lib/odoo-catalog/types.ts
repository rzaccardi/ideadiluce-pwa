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
  /** `product.attribute.value.html_color` (hex/RGB). */
  html_color?: string | number | null
  htmlColor?: string | number | null
  color_hex?: string | null
  hex?: string | null
  color_rgb?: string | number | readonly number[] | null
  rgb?: string | number | readonly number[] | { r?: number; g?: number; b?: number } | null
  color?: string | number | null
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
}

export type OdooCatalogBrand = {
  slug?: string
  name?: string
}

export type OdooCatalogDimensions = {
  length_cm?: number | null
  width_cm?: number | null
  height_cm?: number | null
}

/**
 * Relazioni sul dettaglio prodotto (`GET /api/v2/product/<id>`).
 *
 * Campo Odoo website_sale → `relation`:
 * - `alternative_product_ids` → `alternative` (sinonimi / equivalenti di marca)
 * - `accessory_product_ids` → `accessory`
 * - `optional_product_ids` → `optional` (accessori/optional, non equivalenti)
 *
 * Alias accettati per gli equivalenti: `equivalent`, `equivalente`, `synonym`,
 * `sinonimo`, `oem`, `cross_reference`. Senza questi record la PWA nasconde la sezione.
 */
export type OdooCatalogRelatedProduct = {
  relation?: 'related' | 'accessory' | 'alternative' | 'optional' | string
  /** ID `product.template` quando l’API catalogo lo espone. */
  id?: number
  slug?: string
  title?: string
  short_description?: string
  price_from?: number
  currency?: string
  image?: OdooCatalogImage
  brand?: OdooCatalogBrand | null
  spec_tags?: string[]
  specs?: OdooCatalogSpec[]
  sku?: string | null
  manufacturer_code?: string | null
  ced?: string | null
  ean?: string | null
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
  /** Sul dettaglio è sempre presente; in lista solo se Odoo la espone. */
  gallery?: OdooCatalogGalleryItem[]
  hover_image?: OdooCatalogImage
  image_ambiente?: OdooCatalogImage
  /** Opzionale: chip tecnici pre-calcolati dal proxy BFF. */
  spec_tags?: string[]
  specs?: OdooCatalogSpec[]
  qty_available?: number
  is_orderable?: boolean
  availability?: OdooCatalogAvailability
  categories?: OdooCatalogCategoryRef[]
  category_slug?: string | null
  brand?: OdooCatalogBrand | null
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
