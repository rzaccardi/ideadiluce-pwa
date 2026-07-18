/** Tipi spec Odoo (`tlb.product.spec.type`) usati dal catalogo storefront. */
export const ODOO_SPEC_TYPE_ATTACCO = 24
export const ODOO_SPEC_TYPE_COLOR_TEMP = 3

export const ODOO_SPEC_OPTION_MODEL = 'tlb.product.spec.option'
export const ODOO_SPEC_MODEL = 'tlb.product.spec'

/** Radici `product.category` per segmento catalogo (allineato a search hints). */
export const ODOO_INTERNAL_CATEGORY_ARREDO = 59
export const ODOO_INTERNAL_CATEGORY_TECNICO = 71

/** Alias slug storefront → radice categoria interna Odoo. */
export const ODOO_CATEGORY_SLUG_ROOT_ALIASES: Record<string, number> = {
  'illuminazione-tecnica': ODOO_INTERNAL_CATEGORY_TECNICO,
  'prodotti-tecnici': ODOO_INTERNAL_CATEGORY_TECNICO,
  arredo: ODOO_INTERNAL_CATEGORY_ARREDO,
  'illuminazione-arredo': ODOO_INTERNAL_CATEGORY_ARREDO,
  'illuminazione-design': ODOO_INTERNAL_CATEGORY_ARREDO,
}
