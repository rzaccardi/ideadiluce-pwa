'use client'

import { useMemo } from 'react'
import type { ProductVariantDTO } from '@/types/dto'
import { cn } from '@/utils/cn'
import {
  attributeNames,
  getMatrixValueState,
  htmlColorForAttributeValue,
  isSwatchAttribute,
  pickVariantForAttribute,
  subgroupAttributeValues,
  uniqueValuesForAttr,
  type MatrixValueState,
} from '@/lib/product-variant-attributes'

/** Fallback neutro se Odoo non invia `html_color` — non un colore di un altro valore. */
const SWATCH_FALLBACK = '#8f8f93'

type Props = {
  variants: ReadonlyArray<ProductVariantDTO>
  selectedRef: string
  onChange: (ref: string) => void
}

function matrixButtonProps(state: MatrixValueState, active: boolean) {
  const disabled = state === 'unavailable'
  return {
    disabled,
    'aria-disabled': disabled || undefined,
    title:
      state === 'unavailable'
        ? 'Combinazione non disponibile'
        : state === 'out_of_stock'
          ? 'Non disponibile / esaurito'
          : undefined,
    className: cn(
      state === 'unavailable' && 'cursor-not-allowed opacity-35',
      state === 'out_of_stock' && !active && 'opacity-55',
    ),
  }
}

export function DesignHeroVariantPicker({ variants, selectedRef, onChange }: Props) {
  const groups = useMemo(() => {
    if (variants.length <= 1) return []
    return attributeNames(variants).flatMap((name) => {
      const asSwatch = isSwatchAttribute(name)
      const subgroups = asSwatch
        ? [{ title: name, values: uniqueValuesForAttr(variants, name) }]
        : subgroupAttributeValues(name, uniqueValuesForAttr(variants, name))
      return subgroups.map((sub) => ({
        attrName: name,
        title: sub.title,
        values: sub.values,
        asSwatch,
      }))
    })
  }, [variants])

  const selected = variants.find((v) => v.ref === selectedRef) ?? variants[0]

  if (!groups.length) return null

  return (
    <div className="mb-[26px] space-y-5">
      {groups.map((group) => {
        const selectedValue = selected?.attributes.find((a) => a.name === group.attrName)?.value
        const selectedInGroup = group.values.includes(selectedValue ?? '')

        if (group.asSwatch) {
          return (
            <div key={`${group.attrName}:${group.title}`}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-idl-ink">{group.title}</span>
                <span className="text-[13px] text-idl-ink-muted">
                  {selectedInGroup ? selectedValue : '—'}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {group.values.map((value) => {
                  const active = selectedValue === value
                  const state = getMatrixValueState(variants, selectedRef, group.attrName, value)
                  const matrix = matrixButtonProps(state, active)
                  const swatch = htmlColorForAttributeValue(variants, group.attrName, value)
                  return (
                    <button
                      key={`${group.attrName}-${value}`}
                      type="button"
                      aria-label={value}
                      aria-pressed={active}
                      disabled={matrix.disabled}
                      aria-disabled={matrix['aria-disabled']}
                      title={matrix.title ?? value}
                      onClick={() => {
                        if (matrix.disabled) return
                        onChange(
                          pickVariantForAttribute(variants, selectedRef, group.attrName, value),
                        )
                      }}
                      className={cn(
                        'size-[38px] rounded-full border-2 transition',
                        active
                          ? 'border-idl-brass shadow-[0_0_0_3px_#fff_inset]'
                          : 'border-idl-path-design-border hover:border-idl-brass/50',
                        matrix.className,
                      )}
                      style={{ background: swatch ?? SWATCH_FALLBACK }}
                    />
                  )
                })}
              </div>
            </div>
          )
        }

        return (
          <div key={`${group.attrName}:${group.title}`}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-idl-ink">{group.title}</span>
              <span className="text-[13px] text-idl-ink-muted">
                {selectedInGroup ? selectedValue : '—'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const active = selectedValue === value
                const state = getMatrixValueState(variants, selectedRef, group.attrName, value)
                const matrix = matrixButtonProps(state, active)
                return (
                  <button
                    key={`${group.attrName}-${value}`}
                    type="button"
                    disabled={matrix.disabled}
                    aria-disabled={matrix['aria-disabled']}
                    title={matrix.title}
                    onClick={() => {
                      if (matrix.disabled) return
                      onChange(
                        pickVariantForAttribute(variants, selectedRef, group.attrName, value),
                      )
                    }}
                    className={cn(
                      'rounded-lg border px-4 py-2.5 text-sm font-medium transition',
                      active
                        ? 'border-idl-brass bg-idl-brass text-white'
                        : 'border-idl-path-design-border text-idl-ink-muted hover:border-idl-brass',
                      matrix.className,
                      state === 'out_of_stock' && active && 'line-through decoration-white/50',
                    )}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
