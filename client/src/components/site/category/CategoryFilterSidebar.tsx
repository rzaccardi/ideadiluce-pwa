'use client'

import type { CategoryFilterGroup } from '@/types/category-landing'
import { cn } from '@/utils/cn'
import {
  ExpandableFilterList,
  FILTER_CHIP_INITIAL_VISIBLE,
  FILTER_LIST_INITIAL_VISIBLE,
} from '@/components/site/catalog/ExpandableFilterList'
import { WattaggioRangeFilter } from '@/components/site/catalog/WattaggioRangeFilter'

type Props = {
  title: string
  resetLabel: string
  groups: ReadonlyArray<CategoryFilterGroup>
  selectedValues: ReadonlySet<string>
  onToggleValue: (value: string) => void
  onReset: () => void
  variant?: 'design' | 'technical'
  className?: string
  sticky?: boolean
  wattaggioValues?: ReadonlyArray<number>
  wattaggioMin?: number
  wattaggioMax?: number
  onSelectWattaggioRange?: (range: { min?: number; max?: number }) => void
}

export function CategoryFilterSidebar({
  title,
  resetLabel,
  groups,
  selectedValues,
  onToggleValue,
  onReset,
  variant = 'design',
  className,
  sticky = true,
  wattaggioValues,
  wattaggioMin,
  wattaggioMax,
  onSelectWattaggioRange,
}: Props) {
  const isDesign = variant === 'design'
  const tone = isDesign ? 'design' : 'tech'
  const showWattRange =
    variant === 'technical' &&
    wattaggioValues != null &&
    wattaggioValues.length >= 2 &&
    onSelectWattaggioRange != null

  return (
    <aside className={cn(sticky && 'lg:sticky lg:top-24', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[15px] font-extrabold tracking-tight">{title}</div>
        <button
          type="button"
          onClick={onReset}
          className={cn('text-[12.5px] font-semibold', isDesign ? 'text-idl-brass' : 'font-bold text-idl-amber')}
        >
          {resetLabel}
        </button>
      </div>

      {groups.map((group) => (
        <div
          key={group.label}
          className={cn('border-t py-4', isDesign ? 'border-idl-path-design-border' : 'border-idl-tech-border')}
        >
          <div
            className={cn(
              'mb-2.5 font-mono text-[11px] tracking-[0.1em] uppercase',
              isDesign ? 'text-idl-ink-muted' : 'text-idl-muted',
            )}
          >
            {group.label}
          </div>

          {group.kind === 'checkbox' ? (
            <ExpandableFilterList
              items={group.options}
              initialVisible={FILTER_LIST_INITIAL_VISIBLE}
              getKey={(option) => option.value}
              isSelected={(option) => selectedValues.has(option.value)}
              tone={tone}
              listClassName="space-y-1"
              renderItem={(option) => {
                const checked = selectedValues.has(option.value)
                return (
                  <button
                    type="button"
                    onClick={() => onToggleValue(option.value)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 py-1 text-left text-[13.5px]',
                      checked
                        ? 'font-semibold text-idl-ink'
                        : isDesign
                          ? 'text-idl-ink-soft'
                          : 'text-idl-graphite-2',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded border-[1.5px] text-[11px]',
                        checked
                          ? isDesign
                            ? 'border-idl-brass bg-idl-brass text-white'
                            : 'border-idl-amber bg-idl-amber text-white'
                          : isDesign
                            ? 'border-idl-path-design-border'
                            : 'border-idl-tech-chip-border',
                      )}
                    >
                      {checked ? '✓' : null}
                    </span>
                    {option.label}
                    {option.count != null ? (
                      <span
                        className={cn(
                          'ml-auto text-[11px]',
                          isDesign ? 'text-idl-ink-muted' : 'text-idl-muted',
                        )}
                      >
                        {option.count}
                      </span>
                    ) : null}
                  </button>
                )
              }}
            />
          ) : (
            <ExpandableFilterList
              items={group.options}
              initialVisible={FILTER_CHIP_INITIAL_VISIBLE}
              getKey={(option) => option.value}
              isSelected={(option) => selectedValues.has(option.value)}
              tone={tone}
              listClassName="flex flex-wrap gap-2"
              renderItem={(option) => {
                const active = selectedValues.has(option.value)
                return (
                  <button
                    type="button"
                    onClick={() => onToggleValue(option.value)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition',
                      active
                        ? 'border-idl-ink bg-idl-ink font-mono text-white'
                        : isDesign
                          ? 'border-idl-path-design-border text-idl-ink-soft hover:border-idl-brass'
                          : 'border-idl-tech-border bg-idl-tech-panel font-mono text-idl-graphite-2 hover:border-idl-amber',
                    )}
                  >
                    {option.label}
                    {option.count != null ? (
                      <span className="ml-1 opacity-70">{option.count}</span>
                    ) : null}
                  </button>
                )
              }}
            />
          )}
        </div>
      ))}

      {showWattRange ? (
        <div className="border-t border-idl-tech-border py-4">
          <div className="mb-2.5 font-mono text-[11px] tracking-[0.1em] text-idl-muted uppercase">
            Wattaggio
          </div>
          <WattaggioRangeFilter
            values={wattaggioValues}
            min={wattaggioMin}
            max={wattaggioMax}
            onChange={onSelectWattaggioRange}
            tone="tech"
          />
        </div>
      ) : null}
    </aside>
  )
}
