import type { MessageKey } from '@/i18n/messages/keys'
import type { CategoryFilterGroup } from '@/types/category-landing'
import { translateCatalogFilterOptionLabel } from '@/lib/catalog-taxonomy-i18n'

/** Mappa label IT (defaults / facet builder) → chiavi i18n UI. */
const FILTER_GROUP_LABEL_KEYS: Record<string, MessageKey> = {
  Filtri: 'catalog.filters',
  'Filtri tecnici': 'catalog.filtersTechnical',
  Tipologia: 'catalog.tipologia',
  Ambiente: 'catalog.ambiente',
  Stile: 'catalog.stile',
  Attacco: 'catalog.attacco',
  Kelvin: 'catalog.kelvin',
  Wattaggio: 'catalog.wattaggio',
  Brand: 'catalog.brand',
  Marca: 'catalog.brand',
  Categoria: 'catalog.categoryLabel',
  Sottocategoria: 'catalog.subcategory',
  Tag: 'catalog.tag',
  Prezzo: 'catalog.price',
  Disponibilità: 'catalog.availability',
  'Temperatura colore': 'catalog.colorTemp',
  Finitura: 'catalog.finitura',
}

const FILTER_OPTION_LABEL_KEYS: Record<string, MessageKey> = {
  'Pronta consegna': 'catalog.readyToShip',
  'Su ordinazione': 'catalog.onOrder',
}

export function translateCategoryFilterGroups(
  groups: ReadonlyArray<CategoryFilterGroup>,
  t: (key: MessageKey) => string,
): CategoryFilterGroup[] {
  return groups.map((group): CategoryFilterGroup => {
    const labelKey = FILTER_GROUP_LABEL_KEYS[group.label]
    const label = labelKey ? t(labelKey) : group.label
    return {
      kind: group.kind,
      label,
      options: group.options.map((opt) => {
        const stockKey = FILTER_OPTION_LABEL_KEYS[opt.label]
        if (stockKey) return { ...opt, label: t(stockKey) }
        return {
          ...opt,
          label: translateCatalogFilterOptionLabel(opt, t),
        }
      }),
    } as CategoryFilterGroup
  })
}
