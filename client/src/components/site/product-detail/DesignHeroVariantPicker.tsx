'use client'

import { useMemo } from 'react'
import type { ProductVariantDTO } from '@/types/dto'
import { cn } from '@/utils/cn'
import { ProductDetailPlaceholder } from './shared'

const SWATCH_COLORS: Record<string, string> = {
  bianco: '#f3efe7',
  white: '#f3efe7',
  arancio: '#d36a3d',
  orange: '#d36a3d',
  rosso: '#b3322f',
  red: '#b3322f',
  nero: '#1f1c17',
  black: '#1f1c17',
}

type Props = {
  variants: ReadonlyArray<ProductVariantDTO>
  selectedRef: string
  onChange: (ref: string) => void
}

function isFinituraAttribute(name: string): boolean {
  return /finitura|colore|color/i.test(name)
}

function swatchForValue(value: string): string | null {
  const key = value.trim().toLowerCase()
  for (const [token, color] of Object.entries(SWATCH_COLORS)) {
    if (key.includes(token)) return color
  }
  return null
}

export function DesignHeroVariantPicker({ variants, selectedRef, onChange }: Props) {
  const finitura = useMemo(() => {
    if (variants.length <= 1) return null
    const attrName = variants[0]?.attributes.find((a) => isFinituraAttribute(a.name))?.name
    if (!attrName) return null
    const options = variants.map((v) => {
      const attr = v.attributes.find((a) => a.name === attrName)
      return { ref: v.ref, value: attr?.value ?? v.label, swatch: swatchForValue(attr?.value ?? v.label) }
    })
    return { attrName, options }
  }, [variants])

  const selected = variants.find((v) => v.ref === selectedRef) ?? variants[0]
  const selectedFinitura =
    finitura?.options.find((o) => o.ref === selected?.ref)?.value ?? finitura?.options[0]?.value

  if (finitura) {
    return (
      <div className="mb-[26px]">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-idl-design-fg">Finitura</span>
          <span className="text-[13px] text-idl-design-dim">{selectedFinitura ?? '—'}</span>
        </div>
        <div className="flex gap-3">
          {finitura.options.map((option) => {
            const active = option.ref === selectedRef
            return (
              <button
                key={option.ref}
                type="button"
                aria-label={option.value}
                aria-pressed={active}
                onClick={() => onChange(option.ref)}
                className={cn(
                  'size-[38px] rounded-full border-2 transition',
                  active
                    ? 'border-idl-glow shadow-[0_0_0_3px_#0c0c0d_inset]'
                    : 'border-white/20 hover:border-white/35',
                )}
                style={{ background: option.swatch ?? '#8f8f93' }}
              />
            )
          })}
        </div>
      </div>
    )
  }

  if (variants.length <= 1) {
    return (
      <div className="mb-[26px]">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-idl-design-fg">Finitura</span>
          <ProductDetailPlaceholder className="text-[13px] not-italic">In arrivo</ProductDetailPlaceholder>
        </div>
        <div className="flex gap-3">
          {['#f3efe7', '#d36a3d', '#b3322f', '#1f1c17'].map((color, i) => (
            <span
              key={color}
              aria-hidden
              className={cn(
                'size-[38px] rounded-full border-2',
                i === 0 ? 'border-idl-glow opacity-50' : 'border-white/20 opacity-30',
              )}
              style={{ background: color }}
            />
          ))}
        </div>
      </div>
    )
  }

  const attrName = variants[0]?.attributes[0]?.name ?? 'Variante'
  return (
    <div className="mb-[26px]">
      <div className="mb-2 text-sm font-semibold text-idl-design-fg">{attrName}</div>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const label = v.attributes.map((a) => a.value).join(' · ') || v.label
          const active = v.ref === selectedRef
          return (
            <button
              key={v.ref}
              type="button"
              onClick={() => onChange(v.ref)}
              className={cn(
                'rounded-lg border px-4 py-2.5 text-sm font-medium transition',
                active
                  ? 'border-idl-glow bg-idl-glow text-idl-design'
                  : 'border-white/20 text-idl-design-muted hover:border-white/35',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
