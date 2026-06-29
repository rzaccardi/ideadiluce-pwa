/** Tipi payload Arfly API v2 (tlb_idl_ecommerce). */

export type ArflyImage = {
  url: string
  alt: string
}

export type ArflySpec = {
  key: string
  label: string
  unit: string
  value_type: string
  cardinality: string
  value: string | number | boolean | null
  display: string
}

export type ArflyVariantAttribute = {
  attribute_id: number
  label: string
  value: string
}

export type ArflyAvailability = {
  qty_available?: number
  is_orderable?: boolean
  restock_date?: string | null
  customer_lead_time_days?: number | null
  is_unrecoverable?: boolean
}

export type ArflyProductDocument = {
  id?: number | string
  name?: string
  type?: string | null
  format?: string | null
  size_bytes?: number | null
  url?: string
}

export type ArflyCategoryRef = {
  id?: number | string
  slug?: string
  name?: string
  parent_id?: number | string | null
}

export type ArflyBrand = {
  slug?: string
  name?: string
}

export type ArflyDimensions = {
  length_cm?: number | null
  width_cm?: number | null
  height_cm?: number | null
}

export type ArflyRelatedProduct = {
  relation?: 'related' | 'accessory' | 'alternative' | string
  slug?: string
  title?: string
  short_description?: string
  price_from?: number
  currency?: string
  image?: ArflyImage
  qty_available?: number
  availability?: ArflyAvailability
}

export type ArflyVariant = {
  id: number
  ced: string
  manufacturer_code: string
  attributes: ArflyVariantAttribute[]
  lst_price: number
  image: ArflyImage
  specs: ArflySpec[]
  qty_available?: number
  is_orderable?: boolean
  availability?: ArflyAvailability
  documents?: ArflyProductDocument[]
  ean?: string | null
}

export type ArflyProductSeo = {
  meta_title: string
  meta_description: string
  og_image: ArflyImage
  alternates?: Array<{ locale?: string; href?: string; lang?: string; url?: string }>
}

export type ArflyProductListItem = {
  id: number
  title: string
  slug: string
  short_description: string
  price_from: number
  price_to: number
  currency: string
  image: ArflyImage
  spec_tags?: string[]
  specs?: ArflySpec[]
  qty_available?: number
  is_orderable?: boolean
  availability?: ArflyAvailability
  categories?: ArflyCategoryRef[]
  category_slug?: string | null
  brand?: ArflyBrand | null
  sku?: string | null
  default_code?: string | null
  manufacturer_code?: string | null
  ced?: string | null
}

export type ArflyProductDetail = ArflyProductListItem & {
  description: string
  seo: ArflyProductSeo
  gallery: ArflyImage[]
  specs: ArflySpec[]
  variants: ArflyVariant[]
  documents: ArflyProductDocument[]
  related_products?: ArflyRelatedProduct[]
  ean?: string | null
  weight_kg?: number | null
  length_meters?: number | null
  dimensions?: ArflyDimensions
}

export type ArflyWebsiteRef = {
  id: number
  name: string
}

export type ArflyProductListResponse = {
  website: ArflyWebsiteRef
  lang: string
  page: number
  per_page: number
  total: number
  total_pages: number
  items: ArflyProductListItem[]
}

export type ArflyProductDetailResponse = {
  website: ArflyWebsiteRef
  lang: string
  product: ArflyProductDetail
}

export type ArflyCategoryListResponse = {
  website: ArflyWebsiteRef
  lang: string
  items: ArflyCategoryRef[]
}

export type ArflyBrandListResponse = {
  website: ArflyWebsiteRef
  lang: string
  items: ArflyBrand[]
}
