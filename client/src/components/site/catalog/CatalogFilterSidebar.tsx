'use client'

import type { CategoryDTO } from '@/types/dto'
import type { BrandListItemDTO } from '@/types/site-content'
import {
  CATALOG_COLOR_TEMPS,
  CATALOG_PRICE_BUCKETS,
  CATALOG_SOCKET_FILTERS,
  type CatalogPriceBucket,
} from '@/lib/catalog-filters'
import { cn } from '@/utils/cn'

type Props = {
  rootCategories: ReadonlyArray<CategoryDTO>
  subcategories: ReadonlyArray<CategoryDTO>
  brands: ReadonlyArray<BrandListItemDTO>
  selectedCategorySlug?: string
  selectedBrandSlug?: string
  selectedAttacco?: string
  selectedColorTemp?: string
  selectedPriceBucket?: CatalogPriceBucket
  inStockOnly: boolean
  onSelectCategory: (slug?: string) => void
  onSelectBrand: (slug?: string) => void
  onSelectAttacco: (value?: string) => void
  onSelectColorTemp: (value?: string) => void
  onSelectPriceBucket: (value?: CatalogPriceBucket) => void
  onToggleInStock: (enabled: boolean) => void
  onReset: () => void
  className?: string
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
            checked ? 'border-idl-amber bg-idl-amber text-white' : 'border-idl-tech-chip-border',
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
  onClick,
  children,
}: {
  active: boolean
  mono?: boolean
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
    </button>
  )
}

export function CatalogFilterSidebar({
  rootCategories,
  subcategories,
  brands,
  selectedCategorySlug,
  selectedBrandSlug,
  selectedAttacco,
  selectedColorTemp,
  selectedPriceBucket,
  inStockOnly,
  onSelectCategory,
  onSelectBrand,
  onSelectAttacco,
  onSelectColorTemp,
  onSelectPriceBucket,
  onToggleInStock,
  onReset,
  className,
}: Props) {
  const visibleBrands = brands.slice(0, 12)

  return (
    <aside className={className}>
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[15px] font-extrabold tracking-tight">Filtri</div>
        <button type="button" onClick={onReset} className="text-[12.5px] font-bold text-idl-amber">
          Azzera
        </button>
      </div>

      {rootCategories.length > 0 ? (
        <FilterGroup label="Categoria">
          <div className="space-y-0.5">
            {rootCategories.map((category) => (
              <CheckboxRow
                key={category.id}
                checked={selectedCategorySlug === category.slug}
                label={category.name}
                onClick={() =>
                  onSelectCategory(selectedCategorySlug === category.slug ? undefined : category.slug)
                }
              />
            ))}
          </div>
        </FilterGroup>
      ) : null}

      {subcategories.length > 0 ? (
        <FilterGroup label="Sottocategoria">
          <div className="space-y-0.5">
            {subcategories.map((category) => (
              <CheckboxRow
                key={category.id}
                checked={selectedCategorySlug === category.slug}
                label={category.name}
                onClick={() =>
                  onSelectCategory(selectedCategorySlug === category.slug ? undefined : category.slug)
                }
              />
            ))}
          </div>
        </FilterGroup>
      ) : null}

      <FilterGroup label="Attacco">
        <div className="flex flex-wrap gap-1.5">
          {CATALOG_SOCKET_FILTERS.map((socket) => (
            <ChipButton
              key={socket}
              mono
              active={selectedAttacco === socket}
              onClick={() => onSelectAttacco(selectedAttacco === socket ? undefined : socket)}
            >
              {socket}
            </ChipButton>
          ))}
        </div>
      </FilterGroup>

      {visibleBrands.length > 0 ? (
        <FilterGroup label="Brand">
          <div className="space-y-0.5">
            {visibleBrands.map((brand) => (
              <CheckboxRow
                key={brand.slug}
                checked={selectedBrandSlug === brand.slug}
                label={brand.name}
                count={brand.productCount}
                onClick={() =>
                  onSelectBrand(selectedBrandSlug === brand.slug ? undefined : brand.slug)
                }
              />
            ))}
          </div>
        </FilterGroup>
      ) : null}

      <FilterGroup label="Temperatura colore">
        <div className="flex flex-wrap gap-1.5">
          {CATALOG_COLOR_TEMPS.map((temp) => (
            <ChipButton
              key={temp}
              mono
              active={selectedColorTemp === temp}
              onClick={() => onSelectColorTemp(selectedColorTemp === temp ? undefined : temp)}
            >
              {temp}
            </ChipButton>
          ))}
        </div>
      </FilterGroup>

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
