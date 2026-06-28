'use client'

import { useMemo } from 'react'
import type { ProductVariantDTO } from '@/types/dto'
import { cn } from '@/utils/cn'

type Props = {
  variants: ReadonlyArray<ProductVariantDTO>
  selectedRef: string
  onChange: (ref: string) => void
}

function isKelvinGroup(name: string): boolean {
  return /temperatura|colore|kelvin/i.test(name)
}

function attributeNames(variants: ReadonlyArray<ProductVariantDTO>): string[] {
  const names = new Set<string>()
  for (const v of variants) {
    for (const a of v.attributes) names.add(a.name)
  }
  return [...names]
}

function uniqueValuesForAttr(variants: ReadonlyArray<ProductVariantDTO>, attrName: string): string[] {
  const values: string[] = []
  const seen = new Set<string>()
  for (const v of variants) {
    const value = v.attributes.find((a) => a.name === attrName)?.value?.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    values.push(value)
  }
  return values
}

function pickVariantForAttribute(
  variants: ReadonlyArray<ProductVariantDTO>,
  selectedRef: string,
  attrName: string,
  newValue: string,
): string {
  const current = variants.find((v) => v.ref === selectedRef) ?? variants[0]
  const desired = new Map(current.attributes.map((a) => [a.name, a.value]))
  desired.set(attrName, newValue)

  const exact = variants.find((v) =>
    [...desired.entries()].every(([name, value]) =>
      v.attributes.some((a) => a.name === name && a.value === value),
    ),
  )
  if (exact) return exact.ref

  const partial = variants.find((v) =>
    v.attributes.some((a) => a.name === attrName && a.value === newValue),
  )
  return partial?.ref ?? current.ref
}

export function TechnicalHeroVariantPicker({ variants, selectedRef, onChange }: Props) {
  const groups = useMemo(() => {
    if (variants.length <= 1) return []
    return attributeNames(variants).map((name) => ({
      name,
      hint: /lunghezza|length/i.test(name) ? 'Misura la vecchia lampadina prima di scegliere' : null,
      values: uniqueValuesForAttr(variants, name),
    }))
  }, [variants])

  const selected = variants.find((v) => v.ref === selectedRef) ?? variants[0]

  if (!groups.length) return null

  return (
    <div className="space-y-[18px]">
      {groups.map((group) => {
        const selectedValue = selected?.attributes.find((a) => a.name === group.name)?.value
        const showKelvinBar = isKelvinGroup(group.name)

        return (
          <div key={group.name}>
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
              <span className="text-[13.5px] font-bold text-idl-graphite">{group.name}</span>
              {group.hint ? <span className="text-xs text-idl-muted">{group.hint}</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const active = selectedValue === value
                return (
                  <button
                    key={`${group.name}-${value}`}
                    type="button"
                    onClick={() => onChange(pickVariantForAttribute(variants, selectedRef, group.name, value))}
                    className={cn(
                      'rounded-[7px] px-4 py-2.5 text-[13px] font-semibold transition',
                      showKelvinBar ? 'font-sans' : 'font-mono',
                      active
                        ? 'bg-idl-graphite text-white'
                        : 'border border-idl-tech-chip-border bg-white text-idl-graphite-2 hover:border-idl-amber/40',
                    )}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
            {showKelvinBar ? (
              <>
                <div
                  className="mt-2 h-1.5 rounded bg-linear-to-r from-[#f4c97a] via-[#fbe9c9] via-40% to-[#cfe0f0]"
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
