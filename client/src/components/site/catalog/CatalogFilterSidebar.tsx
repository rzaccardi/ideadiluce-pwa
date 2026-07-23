'use client'

import type { CategoryDTO } from '@/types/dto'
import type { BrandListItemDTO } from '@/types/site-content'
import {
  CATALOG_PRICE_BUCKETS,
  type CatalogPriceBucket,
} from '@/lib/catalog-filters'
import {
  attaccoFacetToParam,
  facetAttaccoOptions,
  facetBrandOptions,
  facetCategoryOptions,
  facetColorTempOptions,
  facetTaxonomyOptions,
  facetWattaggioNumericValues,
  type FacetChipOption,
} from '@/lib/catalog-facets-ui'
import type { CatalogFiltersDTO } from '@/types/dto'
import { cn } from '@/utils/cn'
import {
  ExpandableFilterList,
  FILTER_CHIP_INITIAL_VISIBLE,
  FILTER_LIST_INITIAL_VISIBLE,
} from './ExpandableFilterList'
import { WattaggioRangeFilter } from './WattaggioRangeFilter'

type Props = {
  rootCategories: ReadonlyArray<CategoryDTO>
  subcategories: ReadonlyArray<CategoryDTO>
  brands: ReadonlyArray<BrandListItemDTO>
  selectedCategorySlug?: string
  selectedBrandSlug?: string
  selectedTipologia?: string
  selectedAmbiente?: string
  selectedStile?: string
  selectedAttacco?: string
  selectedColorTemp?: string
  selectedWattaggioMin?: number
  selectedWattaggioMax?: number
  selectedPriceBucket?: CatalogPriceBucket
  inStockOnly: boolean
  /** Facet live Odoo — popola attacco / Kelvin / watt / brand / categorie. */
  facets?: CatalogFiltersDTO | null | Readonly<CatalogFiltersDTO>
  onSelectCategory: (slug?: string) => void
  onSelectBrand: (slug?: string) => void
  onSelectTipologia?: (value?: string) => void
  onSelectAmbiente?: (value?: string) => void
  onSelectStile?: (value?: string) => void
  onSelectAttacco: (value?: string) => void
  onSelectColorTemp: (value?: string) => void
  onSelectWattaggioRange?: (range: { min?: number; max?: number }) => void
  onSelectPriceBucket: (value?: CatalogPriceBucket) => void
  onToggleInStock: (enabled: boolean) => void
  onReset: () => void
  className?: string
  showHeader?: boolean
}

function CheckboxRow({
  checked,
  label,
  count,
  onClick,
}: {
  checked: boolean
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between py-1 text-left text-[13.5px]',
        checked ? 'font-semibold text-idl-ink' : 'text-idl-graphite-2',
      )}
    >
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded border-[1.5px] text-[11px]',
            checked ? 'border-idl-amber bg-idl-amber text-white dark:text-idl-design' : 'border-idl-tech-chip-border',
          )}
        >
          {checked ? '✓' : null}
        </span>
        {label}
      </span>
      {count != null ? <span className="text-[11.5px] text-idl-muted">{count}</span> : null}
    </button>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-idl-tech-border py-3.5 first:border-t-0 first:pt-0">
      <div className="mb-2.5 font-mono text-[10.5px] tracking-[0.1em] text-idl-muted uppercase">
        {label}
      </div>
      {children}
    </div>
  )
}

function ChipButton({
  active,
  mono,
  count,
  onClick,
  children,
}: {
  active: boolean
  mono?: boolean
  count?: number
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[5px] px-[11px] py-1.5 text-[11.5px] transition',
        mono && 'font-mono',
        active
          ? 'bg-idl-ink font-mono text-white'
          : 'border border-idl-tech-border bg-idl-tech-panel text-idl-graphite-2 hover:border-idl-muted',
      )}
    >
      {children}
      {count != null ? <span className="ml-1 opacity-70">{count}</span> : null}
    </button>
  )
}

function ChipGroup({
  options,
  isActive,
  onSelect,
}: {
  options: ReadonlyArray<FacetChipOption>
  isActive: (opt: FacetChipOption) => boolean
  onSelect: (opt: FacetChipOption | undefined) => void
}) {
  return (
    <ExpandableFilterList
      items={options}
      initialVisible={FILTER_CHIP_INITIAL_VISIBLE}
      getKey={(opt) => opt.value}
      isSelected={isActive}
      listClassName="flex flex-wrap gap-1.5"
      renderItem={(opt) => {
        const active = isActive(opt)
        return (
          <ChipButton
            mono
            count={opt.count}
            active={active}
            onClick={() => onSelect(active ? undefined : opt)}
          >
            {opt.label}
          </ChipButton>
        )
      }}
    />
  )
}

export function CatalogFilterSidebar({
  rootCategories,
  subcategories,
  brands,
  selectedCategorySlug,
  selectedBrandSlug,
  selectedTipologia,
  selectedAmbiente,
  selectedStile,
  selectedAttacco,
  selectedColorTemp,
  selectedWattaggioMin,
  selectedWattaggioMax,
  selectedPriceBucket,
  inStockOnly,
  facets,
  onSelectCategory,
  onSelectBrand,
  onSelectTipologia,
  onSelectAmbiente,
  onSelectStile,
  onSelectAttacco,
  onSelectColorTemp,
  onSelectWattaggioRange,
  onSelectPriceBucket,
  onToggleInStock,
  onReset,
  className,
  showHeader = true,
}: Props) {
  const facetCats = facetCategoryOptions(facets)
  const facetBrands = facetBrandOptions(facets)
  const tipologie = facetTaxonomyOptions(facets, 'tipologie')
  const ambienti = facetTaxonomyOptions(facets, 'ambienti')
  const stili = facetTaxonomyOptions(facets, 'stili')
  const sockets = facetAttaccoOptions(facets)
  const colorTemps = facetColorTempOptions(facets)
  const wattaggi = facetWattaggioNumericValues(facets)

  const displayRoots =
    facetCats.roots.length > 0
      ? facetCats.roots.map((c) => ({ id: c.slug, slug: c.slug, name: c.name, count: c.count }))
      : rootCategories.map((c) => ({ id: c.id, slug: c.slug, name: c.name, count: undefined as number | undefined }))

  const displaySubs =
    facetCats.children.length > 0
      ? facetCats.children.map((c) => ({ id: c.slug, slug: c.slug, name: c.name, count: c.count }))
      : subcategories.map((c) => ({ id: c.id, slug: c.slug, name: c.name, count: undefined as number | undefined }))

  const visibleBrands =
    facetBrands.length > 0
      ? facetBrands
      : brands.map((b) => ({ slug: b.slug, name: b.name, count: b.productCount }))

  return (
    <aside className={className}>
      {showHeader ? (
        <div className="mb-3.5 flex items-center justify-between">
          <div className="text-[15px] font-extrabold tracking-tight">Filtri</div>
          <button type="button" onClick={onReset} className="text-[12.5px] font-bold text-idl-amber">
            Azzera
          </button>
        </div>
      ) : null}

      {displayRoots.length > 0 ? (
        <FilterGroup label="Categoria">
          <ExpandableFilterList
            items={displayRoots}
            initialVisible={FILTER_LIST_INITIAL_VISIBLE}
            getKey={(category) => String(category.id)}
            isSelected={(category) => selectedCategorySlug === category.slug}
            listClassName="space-y-0.5"
            renderItem={(category) => (
              <CheckboxRow
                checked={selectedCategorySlug === category.slug}
                label={category.name}
                count={category.count}
                onClick={() =>
                  onSelectCategory(selectedCategorySlug === category.slug ? undefined : category.slug)
                }
              />
            )}
          />
        </FilterGroup>
      ) : null}

      {displaySubs.length > 0 ? (
        <FilterGroup label="Sottocategoria">
          <ExpandableFilterList
            items={displaySubs}
            initialVisible={FILTER_LIST_INITIAL_VISIBLE}
            getKey={(category) => String(category.id)}
            isSelected={(category) => selectedCategorySlug === category.slug}
            listClassName="space-y-0.5"
            renderItem={(category) => (
              <CheckboxRow
                checked={selectedCategorySlug === category.slug}
                label={category.name}
                count={category.count}
                onClick={() =>
                  onSelectCategory(selectedCategorySlug === category.slug ? undefined : category.slug)
                }
              />
            )}
          />
        </FilterGroup>
      ) : null}

      {tipologie.length > 0 && onSelectTipologia ? (
        <FilterGroup label="Tipologia">
          <ExpandableFilterList
            items={tipologie}
            initialVisible={FILTER_LIST_INITIAL_VISIBLE}
            getKey={(opt) => opt.value}
            isSelected={(opt) => selectedTipologia === opt.value}
            listClassName="space-y-0.5"
            renderItem={(opt) => (
              <CheckboxRow
                checked={selectedTipologia === opt.value}
                label={opt.label}
                count={opt.count}
                onClick={() =>
                  onSelectTipologia(selectedTipologia === opt.value ? undefined : opt.value)
                }
              />
            )}
          />
        </FilterGroup>
      ) : null}

      {ambienti.length > 0 && onSelectAmbiente ? (
        <FilterGroup label="Ambiente">
          <ExpandableFilterList
            items={ambienti}
            initialVisible={FILTER_LIST_INITIAL_VISIBLE}
            getKey={(opt) => opt.value}
            isSelected={(opt) => selectedAmbiente === opt.value}
            listClassName="space-y-0.5"
            renderItem={(opt) => (
              <CheckboxRow
                checked={selectedAmbiente === opt.value}
                label={opt.label}
                count={opt.count}
                onClick={() =>
                  onSelectAmbiente(selectedAmbiente === opt.value ? undefined : opt.value)
                }
              />
            )}
          />
        </FilterGroup>
      ) : null}

      {stili.length > 0 && onSelectStile ? (
        <FilterGroup label="Stile">
          <ExpandableFilterList
            items={stili}
            initialVisible={FILTER_LIST_INITIAL_VISIBLE}
            getKey={(opt) => opt.value}
            isSelected={(opt) =>
              Boolean(selectedStile && selectedStile.toLowerCase() === opt.value.toLowerCase())
            }
            listClassName="space-y-0.5"
            renderItem={(opt) => {
              const checked = Boolean(
                selectedStile && selectedStile.toLowerCase() === opt.value.toLowerCase(),
              )
              return (
                <CheckboxRow
                  checked={checked}
                  label={opt.label}
                  count={opt.count}
                  onClick={() => onSelectStile(checked ? undefined : opt.value)}
                />
              )
            }}
          />
        </FilterGroup>
      ) : null}

      {sockets.length > 0 ? (
        <FilterGroup label="Attacco">
          <ChipGroup
            options={sockets}
            isActive={(opt) =>
              Boolean(
                selectedAttacco &&
                  selectedAttacco.toLowerCase() ===
                    attaccoFacetToParam(opt.value, opt.label).toLowerCase(),
              )
            }
            onSelect={(opt) =>
              onSelectAttacco(opt ? attaccoFacetToParam(opt.value, opt.label) : undefined)
            }
          />
        </FilterGroup>
      ) : null}

      {wattaggi.length >= 2 && onSelectWattaggioRange ? (
        <FilterGroup label="Wattaggio">
          <WattaggioRangeFilter
            values={wattaggi}
            min={selectedWattaggioMin}
            max={selectedWattaggioMax}
            onChange={onSelectWattaggioRange}
            tone="tech"
          />
        </FilterGroup>
      ) : null}

      {visibleBrands.length > 0 ? (
        <FilterGroup label="Brand">
          <ExpandableFilterList
            items={visibleBrands}
            initialVisible={FILTER_LIST_INITIAL_VISIBLE}
            getKey={(brand) => brand.slug}
            isSelected={(brand) => selectedBrandSlug === brand.slug}
            listClassName="space-y-0.5"
            renderItem={(brand) => (
              <CheckboxRow
                checked={selectedBrandSlug === brand.slug}
                label={brand.name}
                count={brand.count}
                onClick={() =>
                  onSelectBrand(selectedBrandSlug === brand.slug ? undefined : brand.slug)
                }
              />
            )}
          />
        </FilterGroup>
      ) : null}

      {colorTemps.length > 0 ? (
        <FilterGroup label="Temperatura colore">
          <ChipGroup
            options={colorTemps}
            isActive={(opt) => selectedColorTemp === opt.value}
            onSelect={(opt) => onSelectColorTemp(opt?.value)}
          />
        </FilterGroup>
      ) : null}

      <FilterGroup label="Prezzo">
        <div className="space-y-0.5">
          {CATALOG_PRICE_BUCKETS.map((bucket) => (
            <CheckboxRow
              key={bucket.id}
              checked={selectedPriceBucket === bucket.id}
              label={bucket.label}
              onClick={() =>
                onSelectPriceBucket(selectedPriceBucket === bucket.id ? undefined : bucket.id)
              }
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Disponibilità">
        <CheckboxRow
          checked={inStockOnly}
          label="Pronta consegna"
          onClick={() => onToggleInStock(!inStockOnly)}
        />
      </FilterGroup>
    </aside>
  )
}
