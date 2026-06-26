import type { CategoryFilterGroup } from '@/types/category-landing'
import { cn } from '@/utils/cn'

type Props = {
  title: string
  resetLabel: string
  groups: ReadonlyArray<CategoryFilterGroup>
  variant?: 'design' | 'technical'
  className?: string
  sticky?: boolean
}

export function CategoryFilterSidebar({
  title,
  resetLabel,
  groups,
  variant = 'design',
  className,
  sticky = true,
}: Props) {
  const isDesign = variant === 'design'

  return (
    <aside className={cn(sticky && 'lg:sticky lg:top-24', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[15px] font-extrabold tracking-tight">{title}</div>
        <button type="button" className={cn('text-[12.5px] font-semibold', isDesign ? 'text-idl-brass' : 'font-bold text-idl-amber')}>
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
            <ul className="space-y-1">
              {group.options.map((option) => (
                <li key={option.label}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-2 py-1 text-[13.5px]',
                      option.checked
                        ? isDesign
                          ? 'font-semibold text-idl-ink'
                          : 'font-semibold text-idl-ink'
                        : isDesign
                          ? 'text-idl-ink-soft'
                          : 'text-idl-graphite-2',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded border-[1.5px] text-[11px]',
                        option.checked
                          ? isDesign
                            ? 'border-idl-brass bg-idl-brass text-white'
                            : 'border-idl-amber bg-idl-amber text-white'
                          : isDesign
                            ? 'border-idl-path-design-border'
                            : 'border-idl-tech-chip-border',
                      )}
                    >
                      {option.checked ? '✓' : null}
                    </span>
                    {option.label}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <span
                  key={option.label}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs',
                    option.active
                      ? isDesign
                        ? 'border-idl-ink bg-idl-ink font-mono text-white'
                        : 'border-idl-ink bg-idl-ink font-mono text-white'
                      : isDesign
                        ? 'border-idl-path-design-border text-idl-ink-soft'
                        : 'border-idl-tech-border bg-white font-mono text-idl-graphite-2',
                  )}
                >
                  {option.label}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  )
}
