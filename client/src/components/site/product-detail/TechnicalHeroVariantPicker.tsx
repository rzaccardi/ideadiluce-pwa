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
} from '@/lib/product-variant-attributes'

/** Fallback neutro se Odoo non invia `html_color` — non un colore di un altro valore. */
const SWATCH_FALLBACK = '#8f8f93'

type Props = {
  variants: ReadonlyArray<ProductVariantDTO>
  selectedRef: string
  onChange: (ref: string) => void
}

function isKelvinGroup(name: string): boolean {
  if (isSwatchAttribute(name)) return false
  return /temperatura|colore|kelvin/i.test(name)
}

export function TechnicalHeroVariantPicker({ variants, selectedRef, onChange }: Props) {
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
        hint:
          /lunghezza|length/i.test(name) && sub.values.every((v) => /^\d/.test(v))
            ? 'Misura la vecchia lampadina prima di scegliere'
            : null,
        values: sub.values,
        asSwatch,
        showKelvinBar: isKelvinGroup(name) && subgroups.length === 1,
      }))
    })
  }, [variants])

  const selected = variants.find((v) => v.ref === selectedRef) ?? variants[0]

  if (!groups.length) return null

  return (
    <div className="space-y-[18px]">
      {groups.map((group) => {
        const selectedValue = selected?.attributes.find((a) => a.name === group.attrName)?.value
        const selectedInGroup = group.values.includes(selectedValue ?? '')

        return (
          <div key={`${group.attrName}:${group.title}`}>
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
              <span className="text-[13.5px] font-bold text-idl-graphite">{group.title}</span>
              {group.hint ? <span className="text-xs text-idl-muted">{group.hint}</span> : null}
              {!group.hint && selectedInGroup ? (
                <span className="text-xs text-idl-muted">{selectedValue}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const active = selectedValue === value
                const state = getMatrixValueState(variants, selectedRef, group.attrName, value)
                const unavailable = state === 'unavailable'
                const swatch = group.asSwatch
                  ? htmlColorForAttributeValue(variants, group.attrName, value)
                  : null
                return (
                  <button
                    key={`${group.attrName}-${value}`}
                    type="button"
                    aria-label={group.asSwatch ? value : undefined}
                    aria-pressed={group.asSwatch ? active : undefined}
                    disabled={unavailable}
                    aria-disabled={unavailable || undefined}
                    title={
                      unavailable
                        ? 'Combinazione non disponibile'
                        : state === 'out_of_stock'
                          ? 'Non disponibile / esaurito'
                          : group.asSwatch
                            ? value
                            : undefined
                    }
                    onClick={() => {
                      if (unavailable) return
                      onChange(
                        pickVariantForAttribute(variants, selectedRef, group.attrName, value),
                      )
                    }}
                    className={cn(
                      group.asSwatch
                        ? 'size-[38px] rounded-full border-2 transition'
                        : 'rounded-[7px] px-4 py-2.5 text-[13px] font-semibold transition',
                      !group.asSwatch && (group.showKelvinBar ? 'font-sans' : 'font-mono'),
                      group.asSwatch
                        ? active
                          ? 'border-idl-amber shadow-[0_0_0_3px_#fff_inset]'
                          : 'border-idl-tech-chip-border hover:border-idl-amber/50'
                        : active
                          ? 'bg-idl-graphite text-white'
                          : 'border border-idl-tech-chip-border bg-idl-tech-panel text-idl-graphite-2 hover:border-idl-amber/40',
                      unavailable && 'cursor-not-allowed opacity-35 hover:border-idl-tech-chip-border',
                      state === 'out_of_stock' && !active && 'opacity-55',
                      state === 'out_of_stock' && active && !group.asSwatch && 'line-through decoration-white/50',
                    )}
                    style={group.asSwatch ? { background: swatch ?? SWATCH_FALLBACK } : undefined}
                  >
                    {group.asSwatch ? null : value}
                  </button>
                )
              })}
            </div>
            {group.showKelvinBar ? (
              <>
                <div
                  className="mt-2 h-1.5 rounded bg-linear-to-r from-[#c4c4c8] via-[#e8e8ea] via-40% to-[#cfe0f0]"
                  aria-hidden
                />
                <div className="mt-1 flex justify-between text-[10.5px] text-idl-muted">
                  <span>calda 2700K</span>
                  <span>fredda 6500K</span>
                </div>
              </>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
